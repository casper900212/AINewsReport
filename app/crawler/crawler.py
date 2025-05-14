import newspaper
from newspaper import Article
import json

url = "https://example.com/sample-news"
article = Article(url)
article.download()
article.parse()

news_data = {
    "title": article.title,
    "text": article.text,
    "publish_date": str(article.publish_date)
}

with open("data/sample_news.json", "w", encoding="utf-8") as f:
    json.dump(news_data, f, ensure_ascii=False, indent=2)