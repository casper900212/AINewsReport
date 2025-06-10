import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import newspaper
from newspaper import Article
import json
from datetime import datetime
import argparse

# 配置参數
BASE_URL = "https://www.blocktempo.com/"
article_counter = 0

def parse_article(article_url):
    """解析單篇文章詳情頁内容"""
    try:
        article = Article(article_url)
        article.download()
        article.parse()
        return {
            "title": article.title,
            "text": article.text,
            "publish_date": str(article.publish_date)
        }
    except Exception as e:
        print(f"⚠️ 解析文章失敗 ({article_url}): {str(e)}")
        return None

def is_earlier_month(date_str: str, target_month: str) -> bool:
    """檢查日期是否早於目標月份"""
    try:
        date = datetime.strptime(date_str, "%Y-%m-%d")
        target = datetime.strptime(target_month, "%Y-%m")
        return date < target
    except ValueError:
        return False

def crawl_blocktempo(target_month: str):
    global article_counter  # 宣告使用全局變量
    LIST_URL = "https://www.blocktempo.com/2025/" 
    
    try:
        for page in range(1, 100):
            # 獲取列表頁
            print(f"🔍 正在抓取第 {page} 頁")
            try:
                if page == 1:
                    response = requests.get(LIST_URL, headers={
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                    })
                else:
                    response = requests.get(f"{LIST_URL}page/{page}", headers={
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                    })
                response.raise_for_status()
            except requests.RequestException as e:
                print(f"⚠️ 獲取第 {page} 頁失敗: {str(e)}")
                continue

            soup = BeautifulSoup(response.text, 'lxml')
            articles = []
            found_earlier_month = False

            # 解析文章列表
            for article_tag in soup.find_all('article', class_='jeg_post'):
                try:
                    # 提取元数据
                    date_tag = article_tag.find('div', class_='jeg_meta_date').find('a')
                    pub_date = date_tag.text.strip() if date_tag else None
                    
                    # 檢查是否為更早的月份
                    if pub_date and is_earlier_month(pub_date, target_month):
                        print(f"⚠️ 發現更早的文章 ({pub_date})，停止爬取")
                        found_earlier_month = True
                        break

                    # 過濾非目標月份文章
                    if not pub_date or not pub_date.startswith(target_month):
                        continue

                    # 提取文章內容
                    title_tag = article_tag.find('h3', class_='jeg_post_title').find('a')
                    author_tag = article_tag.find('div', class_='jeg_meta_author').find('a')
                    
                    if not title_tag:
                        print("⚠️ 無法找到文章標題，跳過此文章")
                        continue

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
                    else:
                        print(f"⚠️ 跳過文章: {article_data['title']} (解析失敗)")

                except Exception as e:
                    print(f"⚠️ 處理文章時發生錯誤: {str(e)}")
                    continue
            
                    
            article_counter += len(articles)
            print(f"🎉 目前共抓取 {article_counter} 篇{target_month}文章")

            if articles:  # 只有在有成功抓取的文章時才寫入檔案
                try:
                    with open(f'../../data/blocktempo_articles_{target_month}_full.json', 'r+', encoding='utf-8') as f:
                        try:
                            data = json.load(f)
                        except json.JSONDecodeError:
                            data = []
                        data += articles
                        f.seek(0)
                        json.dump(data, f, ensure_ascii=False, indent=2)
                except FileNotFoundError:
                    with open(f'../../data/blocktempo_articles_{target_month}_full.json', 'w', encoding='utf-8') as f:
                        json.dump(articles, f, ensure_ascii=False, indent=2)
        
            if found_earlier_month:
                break
    except Exception as e:
        print(f"爬取失敗: {str(e)}")

def main():
    # 設置命令行參數
    parser = argparse.ArgumentParser(description='爬取 BlockTempo 文章')
    parser.add_argument('--month', type=str, required=True, help='目標月份 (格式: YYYY-MM)')
    args = parser.parse_args()

    # 驗證月份格式
    try:
        datetime.strptime(args.month, '%Y-%m')
    except ValueError:
        print("❌ 錯誤：月份格式必須為 YYYY-MM")
        return

    print(f"📅 開始爬取 {args.month} 的文章...")
    crawl_blocktempo(args.month)

if __name__ == "__main__":
    main()
