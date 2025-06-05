import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import newspaper
from newspaper import Article
import json
from datetime import datetime

# 配置参數
BASE_URL = "https://www.blocktempo.com/"
TARGET_MONTH = "2025-05"
article_counter = 0

def parse_article(article_url):
    """解析單篇文章詳情頁内容"""
    '''
    try:
        response = requests.get(article_url, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'lxml')
        
        # 提取文章正文
        content_div = soup.find('div', class_='content-inner')
        paragraphs = [p.get_text(strip=True) for p in content_div.find_all('p')] if content_div else []
        
        return {
            "full_content": "\n".join(paragraphs)
        }
    except Exception as e:
        print(f"解析文章 {article_url} 失敗: {str(e)}")
        return None
    '''
    article = Article(article_url)
    article.download()
    article.parse()
    return {
        "title": article.title,
        "text": article.text,
        "publish_date": str(article.publish_date)
    }

def crawl_blocktempo():
    LIST_URL = "https://www.blocktempo.com/2025/" 
    
    try:
        for page in range(1, 30):
            # 獲取列表頁
            print(f"🔍 正在抓取第 {page} 頁")
            if page == 1:
                response = requests.get(LIST_URL, headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                })
            else:
                response = requests.get(f"{LIST_URL}page/{page}", headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                })
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'lxml')
            articles = []

            # 解析文章列表
            for article_tag in soup.find_all('article', class_='jeg_post'):
                # 提取元数据
                date_tag = article_tag.find('div', class_='jeg_meta_date').find('a')
                pub_date = date_tag.text.strip() if date_tag else None
                
                # 過濾非目標月份文章
                if not pub_date or not pub_date.startswith(TARGET_MONTH):
                    continue

                # 提取文章內容
                title_tag = article_tag.find('h3', class_='jeg_post_title').find('a')
                author_tag = article_tag.find('div', class_='jeg_meta_author').find('a')
                
                article_data = {
                    "title": title_tag.text.strip(),
                    "url": urljoin(BASE_URL, title_tag['href']),
                    "publish_date": pub_date,
                    "author": author_tag.text.strip() if author_tag else None,
                    "excerpt": article_tag.find('div', class_='jeg_post_excerpt').get_text(strip=True)
                }

                detail_content = parse_article(article_data['url'])
                if detail_content:
                    article_data.update(detail_content)
                    articles.append(article_data)
                    print(f"✅ 已抓取: {article_data['title']}")
                    
            article_counter += len(articles)
            print(f"🎉 目前共抓取 {article_counter} 篇{TARGET_MONTH}文章")

            try:
                with open(f'../../data/blocktempo_articles_{TARGET_MONTH}_full.json', 'r+', encoding='utf-8') as f:
                    data = json.load(f)
                    data += articles
                    f.seek(0)
                    json.dump(data, f, ensure_ascii=False, indent=2)
            except FileNotFoundError:
                with open(f'../../data/blocktempo_articles_{TARGET_MONTH}_full.json', 'w', encoding='utf-8') as f:
                    json.dump(articles, f, ensure_ascii=False, indent=2)
        
    except Exception as e:
        print(f"爬取失敗: {str(e)}")

if __name__ == "__main__":
    crawl_blocktempo()
