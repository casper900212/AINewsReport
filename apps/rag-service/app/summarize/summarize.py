import json
from langchain.llms import Ollama
from langchain.prompts import PromptTemplate

def summarize_article():
    # Load the article data
    with open("../../data/blocktempo_articles_2025-05.json", "r", encoding="utf-8") as f:
        article = json.load(f)

    # Initialize Ollama
    llm = Ollama(model="mistral")

    # Create a prompt template
    template = """
    Please summarize the following news article in Traditional Chinese:
    
    Title: {title}
    Date: {date}
    Content: {content}
    
    Provide a concise summary that captures the main points and key information.
    """

    prompt = PromptTemplate(
        template=template,
        input_variables=["title", "date", "content"]
    )

    # Generate summary
    summary = llm(prompt.format(
        title=article["title"],
        date=article["publish_date"],
        content=article["text"]
    ))

    # Save the summary
    summary_data = {
        "original_title": article["title"],
        "original_date": article["publish_date"],
        "summary": summary
    }

    with open("../../data/summarize.json", "w", encoding="utf-8") as f:
        json.dump(summary_data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    summarize_article()
