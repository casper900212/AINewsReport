import asyncio
import json
import re
import urllib.parse
from datetime import datetime, date
from typing import List, Dict, Optional, Set
from pydantic import BaseModel, Field
import aiohttp
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, LLMConfig
from crawl4ai.extraction_strategy import LLMExtractionStrategy
import os
import time
import random
import logging
import xml.etree.ElementTree as ET
import argparse
from dateutil.parser import parse as dateutil_parse
import hashlib
# 您可能需要先安裝: pip install beautifulsoup4 lxml litellm readability-lxml
from bs4 import BeautifulSoup
from litellm import acompletion as litellm_acompletion
from readability import Document

# 設置日誌
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class NewsArticle(BaseModel):
    """新聞文章數據模型"""
    title: str = Field(..., description="文章標題")
    publication_date: str = Field(..., description="發布日期 (YYYY-MM-DD 格式)")
    url: str = Field(..., description="文章原始URL")
    author: Optional[str] = Field(None, description="作者姓名")
    content: str = Field(..., description="文章主要內容")

class UniversalNewsScraper:
    """通用新聞爬蟲類"""
    
    def __init__(self, domain: str, year: int, month: int):
        self.domain = domain.replace('https://', '').replace('http://', '').replace('www.', '')
        self.base_url = f"https://www.{self.domain}"
        self.year = year
        self.month = month
        self.articles: List[Dict] = []
        self.visited_urls: Set[str] = set()
        
        # 用戶代理輪換
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        ]
        
        # "無內容" 指示詞
        self.no_content_indicators = [
            'page not found', 'cannot be found', 'no posts found', 'no results found',
            '找不到頁面', '無法找到', '沒有文章', '沒有結果'
        ]
        
        # URL路徑排除模式
        self.path_exclusion_patterns = [
            '/search/', '/tag/', '/category/', '/author/'
        ]

    async def _collect_links_from_sitemap(self) -> List[str]:
        """
        Fetches and parses sitemaps using aiohttp to find article links for the target month.
        """
        logger.info("從 sitemap 收集文章鏈接")
        article_links = set()
        headers = {'User-Agent': random.choice(self.user_agents)}
        try:
            async with aiohttp.ClientSession(headers=headers) as session:
                # 1. Fetch robots.txt to find sitemap URLs
                robots_url = f"{self.base_url}/robots.txt"
                async with session.get(robots_url) as response:
                    if response.status == 200:
                        robots_txt = await response.text()
                        sitemap_urls = re.findall(r'Sitemap:\s*([^\s]+)', robots_txt)
                    else:
                        logger.warning(f"無法獲取 robots.txt: {response.status}, 將嘗試常見路徑")
                        sitemap_urls = []

                if not sitemap_urls:
                    # Fallback for common sitemap locations
                    sitemap_urls.extend([
                        f"{self.base_url}/sitemap.xml",
                        f"{self.base_url}/sitemap_index.xml",
                        f"{self.base_url}/news-sitemap.xml"
                    ])

                # 2. Process each sitemap URL found
                tasks = [self._process_sitemap_for_articles(session, url, article_links) for url in sitemap_urls]
                await asyncio.gather(*tasks)
        
        except Exception as e:
            logger.warning(f"從 sitemap 收集鏈接時出錯: {str(e)}")
        
        logger.info(f"從 sitemap 找到 {len(article_links)} 個潛在鏈接")
        return list(article_links)

    def _extract_urls_from_sitemap_content(self, content: str) -> List[str]:
        """Extracts URLs from sitemap content using a proper XML parser."""
        try:
            # Remove default namespace for easier parsing, a common issue with sitemap XML
            content = re.sub(r'\sxmlns="[^"]+"', '', content, count=1)
            root = ET.fromstring(content)
            # Find all <loc> tags, which contain the URLs
            loc_tags = root.findall('.//loc')
            return [loc.text for loc in loc_tags if loc.text]
        except ET.ParseError as e:
            logger.warning(f"Sitemap XML 解析錯誤: {e}")
            # Fallback to regex for malformed XML that might still contain links
            urls = re.findall(r'<loc>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</loc>', content)
            return urls
        except Exception as e:
            logger.error(f"提取 sitemap URL 時發生未知錯誤: {e}")
            return []

    async def _process_sitemap_for_articles(self, session: aiohttp.ClientSession, sitemap_url: str, found_urls: Set[str]):
        """
        Recursively processes a sitemap URL, extracts article links for the target month,
        and adds them to the found_urls set.
        """
        if not sitemap_url:
            return
        try:
            async with session.get(sitemap_url) as response:
                if response.status != 200:
                    return
                content = await response.text()

            # If it's a sitemap index, recurse into nested sitemaps
            if '<sitemapindex' in content:
                nested_sitemap_urls = self._extract_urls_from_sitemap_content(content)
                tasks = []
                for nested_url in nested_sitemap_urls:
                    # Heuristic to check if the nested sitemap is relevant
                    if str(self.year) in nested_url or 'news' in nested_url or 'post' in nested_url or 'article' in nested_url:
                        tasks.append(self._process_sitemap_for_articles(session, nested_url, found_urls))
                await asyncio.gather(*tasks)
            # If it's a regular sitemap, parse it properly
            else:
                content_no_ns = re.sub(r'\sxmlns="[^"]+"', '', content, count=1)
                root = ET.fromstring(content_no_ns)
                for url_entry in root.findall('.//url'):
                    loc_tag = url_entry.find('loc')
                    lastmod_tag = url_entry.find('lastmod')
                    
                    if loc_tag is not None and loc_tag.text and lastmod_tag is not None and lastmod_tag.text:
                        url = loc_tag.text
                        date_str = lastmod_tag.text
                        
                        try:
                            # Handles ISO format with or without timezone
                            article_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                            if article_date.year == self.year and article_date.month == self.month:
                                if self._is_valid_html_page(url):
                                    logger.info(f"從 sitemap 找到符合日期的文章: {url}")
                                    found_urls.add(url)
                        except ValueError:
                            # Ignore entries with invalid date formats
                            continue
        except Exception as e:
            logger.warning(f"處理 sitemap {sitemap_url} 時出錯: {str(e)}")

    def _is_news_list_page(self, content: str) -> bool:
        """
        使用啟發式規則判斷頁面是否為有效的新聞列表頁面，而不是 "Not Found" 或空頁面。
        """
        if not content:
            return False
        
        content_lower = content.lower()
        
        # 1. 檢查是否有 "無內容" 指示詞
        if any(indicator in content_lower for indicator in self.no_content_indicators):
            return False
            
        # 2. 檢查是否包含新聞相關關鍵詞
        news_indicators = [
            '新聞', '文章', 'news', 'article', 'headline', 'story',
            '標題', '報導', '專題', '最新', 'latest', 'recent'
        ]
        has_news_keywords = any(keyword in content_lower for keyword in news_indicators)
        
        # 3. 檢查是否有足夠的鏈接
        link_count = content_lower.count('http')
        has_sufficient_links = link_count > 5
        
        return has_news_keywords and has_sufficient_links

    async def _extract_and_filter_links_with_llm(self, html_content: str) -> List[str]:
        """
        從HTML中提取所有連結，簡化後交給LLM篩選出文章連結。
        """
        soup = BeautifulSoup(html_content, 'lxml')
        
        # **修正點**: 優先在主要內容區塊中尋找連結，以提高準確性
        main_content_selectors = [
            'main', '#main-content', '.main-content', '#content', '.content', 
            '#main', '.main', 'article', '.post-listing', '#primary'
        ]
        search_area = None
        for selector in main_content_selectors:
            search_area = soup.select_one(selector)
            if search_area:
                logger.info(f"找到主要內容區塊: '{selector}'")
                break
        
        if not search_area:
            logger.warning("未找到任何特定的主要內容區塊，無法提取連結。")
            return []

        # **新增**: 從主要內容區塊中移除已知的噪音容器
        noise_selectors = [
            'nav', 'footer', '.pagination', '.page-nav', '.widget', 
            '#sidebar', '.sidebar', '.related-posts', '.recommended-articles'
        ]
        for noise_selector in noise_selectors:
            for element in search_area.select(noise_selector):
                logger.info(f"  - 移除噪音元素: '{noise_selector}'")
                element.decompose()

        # 提取所有連結及其文字
        links_with_text = []
        for a_tag in search_area.find_all('a', href=True):
            href = a_tag['href']
            text = a_tag.get_text(strip=True)
            if href and text and not href.startswith('#'):
                full_url = urllib.parse.urljoin(self.base_url, href)
                links_with_text.append(f"- {text}: {full_url}")
        
        if not links_with_text:
            return []

        simplified_content = "\n".join(links_with_text)
        
        # 建立LLM請求
        prompt = f"""
        From the following list of links, please extract only the URLs that point to individual news articles.
        Ignore links to categories, tags, author pages, advertisements, and general navigation.
        Return the result as a JSON object with a single key "urls" containing a list of the extracted URL strings.

        Link list:
        {simplified_content}
        """
        
        try:
            response = await litellm_acompletion(
                model="gemini/gemini-2.5-pro-preview-06-05",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            
            response_str = response.choices[0].message.content
            response_data = json.loads(response_str)
            if "urls" in response_data and isinstance(response_data["urls"], list):
                return response_data["urls"]
            else:
                logger.warning(f"LLM回傳的JSON格式不符預期。原始內容: {response_str}")
                return []
        except Exception as e:
            logger.error(f"LLM連結篩選失敗: {e}")
            return []

    async def collect_article_links(self, crawler: AsyncWebCrawler) -> List[str]:
        """
        鏈接收集階段：從 sitemap 和存檔頁面提取所有新聞文章鏈接，並處理重複內容。
        """
        logger.info("開始收集文章鏈接")
        
        # 策略 1: 直接從 sitemap 收集鏈接
        all_links = set(await self._collect_links_from_sitemap())
        logger.info(f"從 sitemap 收集到 {len(all_links)} 個鏈接。")

        logger.info(f"現在開始從存檔頁面尋找更多鏈接...")
        # 策略 2: 爬取存檔頁面
        processed_content_hashes = set()
        
        potential_urls = []
        # 模式 1: 基於路徑的 URL
        archive_path_patterns = [
            f"/{self.year}/{self.month:02d}/",
            f"/archive/{self.year}/{self.month:02d}/",
            f"/news/{self.year}/{self.month:02d}/",
            f"/blog/{self.year}/{self.month:02d}/",
            f"/{self.year}/{self.month}/",
            f"/archive/{self.year}-{self.month:02d}/",
            f"/articles/{self.year}/{self.month:02d}/",
            f"/posts/{self.year}/{self.month:02d}/"
        ]
        for pattern in archive_path_patterns:
            potential_urls.append(self.base_url + pattern)

        # 模式 2: 基於查詢參數的 URL
        archive_query_patterns = [
            {'m': f"{self.year}{self.month:02d}"},
            {'year': self.year, 'monthnum': self.month},
            {'archive_date': f"{self.year}-{self.month:02d}"}
        ]
        for params in archive_query_patterns:
            potential_urls.append(f"{self.base_url}/?{urllib.parse.urlencode(params)}")

        for archive_url in set(potential_urls):
            try:
                # **第一步: 預檢第一頁**
                logger.info(f"預檢存檔頁面: {archive_url}")
                precheck_config = CrawlerRunConfig(user_agent=random.choice(self.user_agents))
                precheck_result = await crawler.arun(url=archive_url, config=precheck_config)

                # **檢查是否重定向到首頁**
                final_url_path = urllib.parse.urlparse(precheck_result.url).path.rstrip('/')
                base_url_path = urllib.parse.urlparse(self.base_url).path.rstrip('/')
                if final_url_path == base_url_path and archive_url != self.base_url:
                    logger.info(f"URL {archive_url} 重定向到首頁，跳過。")
                    continue

                if not precheck_result.success or not self._is_news_list_page(precheck_result.markdown):
                    logger.info(f"頁面 {archive_url} 不是有效的新聞列表頁，跳過。")
                    continue
                
                # **第二步: 對第一頁內容進行雜湊檢查**
                logger.info(f"頁面 {archive_url} 是有效的新聞列表，提取連結並檢查重複...")
                extracted_urls = await self._extract_and_filter_links_with_llm(precheck_result.html)
                
                if not extracted_urls:
                    logger.info(f"在 {archive_url} (第一頁) 未提取到有效連結。")
                    continue

                extracted_urls.sort()
                content_signature = "".join(extracted_urls)
                content_hash = hashlib.sha256(content_signature.encode('utf-8')).hexdigest()

                if content_hash in processed_content_hashes:
                    logger.info(f"頁面 {archive_url} 的文章列表與已處理過的頁面重複。跳過整個系列。")
                    continue
                
                # **第三步: 處理這個不重複的系列**
                processed_content_hashes.add(content_hash)
                logger.info(f"在 {archive_url} (第一頁) 發現 {len(extracted_urls)} 個不重複的文章連結列表。")
                for url in extracted_urls:
                    if self._is_valid_html_page(url):
                        full_url = urllib.parse.urljoin(self.base_url, url)
                        all_links.add(full_url)

                # **第四步: 處理分頁 (從第二頁開始)**
                page_urls = await self._handle_pagination(crawler, archive_url, precheck_result.html)
                for i, page_url in enumerate(page_urls[1:]): # 從第二頁開始
                    logger.info(f"正在處理分頁: {page_url}")
                    
                    page_result = await crawler.arun(url=page_url, config=precheck_config)
                    if not page_result.success:
                        continue
                    
                    paginated_urls = await self._extract_and_filter_links_with_llm(page_result.html)
                    if paginated_urls:
                        logger.info(f"在分頁 {page_url} 發現 {len(paginated_urls)} 個連結。")
                        for url in paginated_urls:
                            if self._is_valid_html_page(url):
                                full_url = urllib.parse.urljoin(self.base_url, url)
                                all_links.add(full_url)
                    
                    await asyncio.sleep(random.uniform(1, 2))
                    
            except Exception as e:
                logger.error(f"處理存檔URL {archive_url} 時出錯: {str(e)}")
        
        logger.info(f"總共收集到 {len(all_links)} 個獨特文章鏈接")
        return list(all_links)

    async def _handle_pagination(self, crawler: AsyncWebCrawler, base_url: str, html_content: str) -> List[str]:
        """處理分頁邏輯，嘗試找到總頁數並生成所有頁面URL"""
        pages = [base_url]
        
        try:
            html = html_content
            
            last_page = 1
            # 策略 1: 從 "Page X of Y" 模式中提取總頁數
            page_of_match = re.search(r'page \d+ of (\d+)', html, re.IGNORECASE)
            if page_of_match:
                last_page = int(page_of_match.group(1))
            else:
                # 策略 2: 尋找所有分頁數字鏈接，取最大值
                page_numbers = re.findall(r'(?:page/|page=)(\d+)', html, re.IGNORECASE)
                numeric_pages = [int(p) for p in page_numbers if p.isdigit()]
                if numeric_pages:
                    last_page = max(numeric_pages)

            # 限制最大頁數，防止異常情況
            last_page = min(last_page, 50) 

            if last_page > 1:
                page_url_format = None
                # 確定分頁URL格式
                if re.search(r'href="[^"]*page/\d+', html, re.IGNORECASE):
                    page_url_format = base_url.rstrip('/') + '/page/{}/'
                elif re.search(r'href="[^"]*\?page=\d+', html, re.IGNORECASE):
                    page_url_format = base_url.rstrip('/') + '?page={}'
                
                if page_url_format:
                    for i in range(2, last_page + 1):
                        pages.append(page_url_format.format(i))
                    logger.info(f"在 {base_url} 發現 {last_page} 個分頁，已生成所有URL。")
                else:
                    logger.warning(f"無法確定 {base_url} 的分頁格式")

        except Exception as e:
            logger.warning(f"處理分頁時出錯: {str(e)}")
        
        return pages

    def _is_valid_html_page(self, url: str) -> bool:
        """Checks if a URL is likely to be an HTML page on the target domain."""
        if not url:
            return False
        
        try:
            parsed_url = urllib.parse.urlparse(url)
            
            # 1. Check for non-HTML file extensions
            excluded_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.pdf', '.zip', '.xml', '.css', '.js']
            if any(parsed_url.path.lower().endswith(ext) for ext in excluded_extensions):
                return False
                
            # 2. Check for common non-article path segments
            if any(pattern in parsed_url.path for pattern in self.path_exclusion_patterns):
                return False

            # 3. Check if the domain is the target domain or a subdomain
            # Allow empty netloc for relative URLs, as they are on the same domain
            if parsed_url.netloc and self.domain not in parsed_url.netloc:
                return False
                
            return True
        except Exception:
            return False

    def _extract_with_heuristics(self, html_content: str, url: str) -> Optional[Dict]:
        """
        使用啟發式規則（JSON-LD, Open Graph, Readability）提取文章內容。
        """
        soup = BeautifulSoup(html_content, 'lxml')
        article_data = {'url': url}

        # 策略 1: JSON-LD
        json_ld_script = soup.find('script', type='application/ld+json')
        if json_ld_script:
            try:
                json_data = json.loads(json_ld_script.string)
                # 處理單一物件或物件列表
                if isinstance(json_data, list):
                    json_data = json_data[0]
                
                if json_data.get('@type') in ['NewsArticle', 'BlogPosting', 'Article']:
                    article_data['title'] = json_data.get('headline')
                    article_data['publication_date'] = json_data.get('datePublished')
                    article_data['content'] = BeautifulSoup(json_data.get('articleBody', ''), 'lxml').get_text(separator='\n', strip=True)
                    author = json_data.get('author')
                    if isinstance(author, dict):
                        article_data['author'] = author.get('name')
                    elif isinstance(author, list) and author:
                        article_data['author'] = author[0].get('name')
                    
                    if all(article_data.get(k) for k in ['title', 'publication_date', 'content']):
                        logger.info(f"透過 JSON-LD 成功提取: {url}")
                        return article_data
            except (json.JSONDecodeError, TypeError, AttributeError) as e:
                logger.warning(f"解析 JSON-LD 時出錯: {e}")

        # 策略 2: Open Graph + Readability
        try:
            doc = Document(html_content)
            article_data['title'] = doc.short_title()
            article_data['content'] = BeautifulSoup(doc.summary(), 'lxml').get_text(separator='\n', strip=True)

            # 從 meta 標籤獲取更精準的日期和作者
            og_date = soup.find('meta', property='article:published_time')
            if og_date:
                article_data['publication_date'] = og_date['content']
            
            og_author = soup.find('meta', property='article:author')
            if og_author:
                article_data['author'] = og_author['content']

            if all(article_data.get(k) for k in ['title', 'content']):
                 # 日期不是絕對必要，後面可以再解析
                logger.info(f"透過 Readability + Meta 成功提取: {url}")
                return article_data
        except Exception as e:
            logger.warning(f"使用 Readability 提取時出錯: {e}")

        return None

    async def extract_article_content(self, crawler: AsyncWebCrawler, article_urls: List[str]) -> List[Dict]:
        """
        內容提取階段：從每個文章頁面提取結構化信息
        """
        logger.info(f"開始提取 {len(article_urls)} 篇文章內容")
        
        articles = []
        for i, url in enumerate(article_urls):
            try:
                logger.info(f"處理文章 {i+1}/{len(article_urls)}: {url}")
                
                # **第一步: 廉價爬取**
                page_result = await crawler.arun(url, config=CrawlerRunConfig(user_agent=random.choice(self.user_agents)))
                if not page_result.success:
                    logger.warning(f"無法下載文章頁面: {url}")
                    continue

                # **第二步: 嘗試啟發式提取**
                article_data = self._extract_with_heuristics(page_result.html, url)
                
                if not article_data:
                    # **第三步: 啟發式失敗，退回到 LLM**
                    logger.warning(f"啟發式提取失敗，退回到 LLM 進行提取: {url}")
                    llm_config = LLMConfig(
                        provider="gemini/gemini-2.5-pro-preview-06-05",
                        api_token=os.getenv('GEMINI_API_KEY')
                    )
                    llm_extraction_strategy = LLMExtractionStrategy(
                        llm_config=llm_config,
                        schema=NewsArticle.model_json_schema(),
                        extraction_type="schema",
                        instruction="""
                        請從網頁內容中提取以下新聞文章信息：
                        1. title: 文章的主標題
                        2. publication_date: 發布日期，必須轉換為 YYYY-MM-DD 格式
                        3. url: 文章的完整URL
                        4. author: 作者姓名（如果有的話）
                        5. content: 文章的主要內容，排除廣告、導航欄、評論等無關內容
                        
                        請確保提取的內容是乾淨的正文，並且日期格式正確。
                        """
                    )
                    run_config = CrawlerRunConfig(
                        extraction_strategy=llm_extraction_strategy,
                        user_agent=random.choice(self.user_agents),
                        excluded_selector="nav, footer, header, aside, .sidebar, .comments, #comments, .ad, #ad, .advertisement, #advertisement"
                    )
                    llm_result = await crawler.arun(url=url, config=run_config)
                    if llm_result.success and llm_result.extracted_content:
                        try:
                            article_data = json.loads(llm_result.extracted_content)
                            if isinstance(article_data, list) and article_data:
                                article_data = article_data[0]
                        except json.JSONDecodeError:
                            logger.error(f"無法解析來自 {url} 的 LLM 結果: {llm_result.extracted_content}")
                            continue
                
                # **第四步: 清理和驗證**
                if article_data:
                    cleaned_article = self._clean_article_data(article_data, url)
                    if cleaned_article and self._is_target_month(cleaned_article['publication_date']):
                        articles.append(cleaned_article)
                        logger.info(f"成功提取文章: {cleaned_article['title']}")
                
                await asyncio.sleep(random.uniform(2, 5))
                
            except Exception as e:
                logger.error(f"提取文章 {url} 時發生未知錯誤: {str(e)}")
                continue
        
        return articles

    def _clean_article_data(self, article_data: Dict, url: str) -> Optional[Dict]:
        """清理和驗證文章數據"""
        try:
            # 確保必要字段存在
            title = article_data.get('title', '').strip()
            content = article_data.get('content', '').strip()
            pub_date = article_data.get('publication_date', '').strip()
            
            if not title or not content or not pub_date:
                return None
            
            # 清理和標準化日期格式
            cleaned_date = self._parse_date(pub_date)
            if not cleaned_date:
                return None
            
            return {
                'title': title,
                'publication_date': cleaned_date,
                'url': url,
                'author': article_data.get('author', '').strip() or None,
                'content': content
            }
            
        except Exception as e:
            logger.warning(f"清理文章數據時出錯: {str(e)}")
            return None

    def _parse_date(self, date_str: str) -> Optional[str]:
        """
        使用 dateutil.parser 解析多種日期格式並標準化為 'YYYY-MM-DD'。
        此函數非常穩健，可以處理 '2024-05-21', 'May 21, 2024', '2024年5月21日' 等多種格式。
        """
        if not date_str or not isinstance(date_str, str):
            return None
        
        try:
            # dateutil.parser is powerful and can handle a wide variety of date formats.
            date_obj = dateutil_parse(date_str)
            return date_obj.strftime('%Y-%m-%d')
        except (ValueError, OverflowError) as e:
            # ValueError for unparseable formats, OverflowError for out-of-range dates.
            logger.warning(f"無法將 '{date_str}' 解析為有效日期: {e}")
            return None

    def _is_target_month(self, date_str: str) -> bool:
        """檢查文章日期是否在目標年月內"""
        try:
            article_date = datetime.strptime(date_str, '%Y-%m-%d')
            return article_date.year == self.year and article_date.month == self.month
        except ValueError:
            return False

    def save_to_json(self, articles: List[Dict]) -> str:
        """儲存文章到JSON檔案"""
        filename = f"{self.domain}_{self.year}_{self.month:02d}.json"
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(articles, f, ensure_ascii=False, indent=2)
        
        logger.info(f"已儲存 {len(articles)} 篇文章到 {filename}")
        return filename

    def save_links_to_json(self, links: List[str]) -> str:
        """Saves the collected article links to a JSON file for review."""
        filename = f"{self.domain}_{self.year}_{self.month:02d}_links.json"
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(links, f, ensure_ascii=False, indent=2)
        
        logger.info(f"已儲存 {len(links)} 個文章鏈接到 {filename}")
        return filename

async def scrape_news_by_month(domain: str, year: int, month: int, test_mode: bool = False) -> str:
    """
    主要入口函數：爬取指定網域在特定年月的所有新聞文章
    
    Args:
        domain: 新聞網站域名 (例如: 'udn.com')
        year: 目標年份 (例如: 2024)
        month: 目標月份 (例如: 5)
        test_mode: If True, only collect and save links without LLM extraction.
    
    Returns:
        str: 儲存的JSON檔案名稱
    """
    
    # 檢查是否設置了 Google API Key
    if not test_mode and not os.getenv('GEMINI_API_KEY'):
        raise ValueError("請設置 GEMINI_API_KEY 環境變數")
    
    scraper = UniversalNewsScraper(domain, year, month)
    
    browser_config = BrowserConfig(
        verbose=True,
        text_mode=True  # More efficient for text extraction
    )
    async with AsyncWebCrawler(config=browser_config) as crawler:
        try:
            article_links = await scraper.collect_article_links(crawler)
            if not article_links:
                logger.error("未找到任何文章鏈接")
                return ""
            
            # 如果是測試模式，僅保存鏈接並退出
            if test_mode:
                links_filename = scraper.save_links_to_json(article_links)
                logger.info(f"測試模式：鏈接收集完成，已儲存至 {links_filename}。")
                return links_filename

            # 第三階段：提取文章內容
            articles = await scraper.extract_article_content(crawler, article_links)
            
            # 第四階段：儲存結果
            if articles:
                filename = scraper.save_to_json(articles)
                logger.info(f"爬蟲任務完成！成功提取 {len(articles)} 篇文章")
                return filename
            else:
                logger.warning("未提取到任何有效文章")
                return ""
                
        except Exception as e:
            logger.error(f"爬蟲過程中發生錯誤: {str(e)}")
            raise

if __name__ == "__main__":
    # 使用範例
    parser = argparse.ArgumentParser(description="通用新聞存檔爬蟲")
    parser.add_argument("domain", type=str, help="要爬取的新聞網站域名 (e.g., 'www.blocktempo.com')")
    parser.add_argument("year", type=int, help="目標年份 (e.g., 2024)")
    parser.add_argument("month", type=int, help="目標月份 (e.g., 5)")
    parser.add_argument("--test-mode", action="store_true", help="僅收集和保存文章鏈接，不使用LLM提取內容。")

    args = parser.parse_args()

    async def main():
        try:
            # os.environ['GEMINI_API_KEY'] = 'your-google-api-key-here'
            
            result_file = await scrape_news_by_month(args.domain, args.year, args.month, args.test_mode)
            
            if result_file:
                if args.test_mode:
                    print(f"鏈接收集完成！結果已儲存至: {result_file}")
                else:
                    print(f"爬蟲完成！結果已儲存至: {result_file}")
            else:
                print("爬蟲未能成功提取文章或鏈接")
                
        except Exception as e:
            print(f"執行錯誤: {str(e)}")
    
    # 運行主程序
    asyncio.run(main())
