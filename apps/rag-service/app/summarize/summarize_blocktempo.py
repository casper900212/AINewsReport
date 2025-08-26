import json
from langchain.llms import Ollama
from langchain.prompts import PromptTemplate
from tqdm import tqdm

def summarize_articles():
    # 載入文章
    with open("../../data/blocktempo_articles_2025-05.json", "r", encoding="utf-8") as f:
        articles = json.load(f)

    # 初始化Ollama模型
    llm = Ollama(model="mistral")
    
    # 建立prompt template
    template = """
    請用繁體中文總結以下新聞文章：
    
    標題：{title}
    日期：{date}
    內容：{content}
    
    要求：
    1. 保持客觀中立，突出關鍵信息
    2. 使用簡潔的段落格式（最多3段）
    3. 重要數據（如金額、百分比等）需保留
    4. 總結長度控制在150-200字之間
    """

    prompt = PromptTemplate(
        template=template,
        input_variables=["title", "date", "content"]
    )

    summaries = []
    
    # 添加进度条
    for article in tqdm(articles, desc="生成摘要中"):
        try:
            # 生成摘要
            summary = llm(prompt.format(
                title=article["title"],
                date=article["publish_date"],
                content=article.get("text", article.get("full_content", ""))  # 兼容不同字段名
            ))
            
            # 收集结果
            summaries.append({
                "title": article["title"],
                "publish_date": article["publish_date"],
                "summary": summary.strip(),
                "url": article.get("url", "")  # 保留原文链接
            })
        except Exception as e:
            print(f"\n處理文章失敗：{article['title']}，錯誤訊息：{str(e)}")
            continue

    # 保存所有摘要
    with open("../../data/summarize.json", "w", encoding="utf-8") as f:
        json.dump(summaries, f, ensure_ascii=False, indent=2, 
                 separators=(',', ': '))  # 优化JSON格式

    print(f"\n✅ 已完成 {len(summaries)}/{len(articles)} 篇文章摘要生成")

if __name__ == "__main__":
    summarize_articles()
