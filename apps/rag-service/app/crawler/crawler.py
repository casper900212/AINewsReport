import newspaper
from newspaper import Article
import json
from datetime import datetime

url = "https://www.blocktempo.com/"
article = Article(url)
article.download()
article.parse()

# Check if article was published in May
if article.publish_date and article.publish_date.month == 5:
    news_data = {
        "title": article.title,
        "text": article.text,
        "publish_date": str(article.publish_date)
    }

    with open("../../data/sample.json", "w", encoding="utf-8") as f:
        json.dump(news_data, f, ensure_ascii=False, indent=2)
else:
    print(f"Article not from May. Published date: {article.publish_date}")