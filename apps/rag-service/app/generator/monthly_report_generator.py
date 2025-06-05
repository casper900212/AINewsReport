from langchain_community.vectorstores import Qdrant
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_ollama import OllamaLLM
from langchain.chains import RetrievalQA
from langchain_core.documents import Document

from qdrant_client import QdrantClient
import yaml, os
from datetime import datetime

# 讀取 config 設定
def load_industry_config(path="../../config/blockchain_reports_news_summary.yaml"):
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

# 初始化 LLM
def init_llm():
    return OllamaLLM(model="mistral")

# 建立產業月報
def generate_industry_report(industry: str, keywords: list, prompt: str, output_dir="../../outputs/test"):
    print(f"\n🧠 產生 {industry} 月報...")

    qdrant = QdrantClient(url="http://localhost:6333")
    embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/msmarco-bert-base-dot-v5")

    vectorstore = Qdrant(
      client=qdrant,
      collection_name="blocktempo-articles-2025-05-original",
      embeddings=embedding_model,
      content_payload_key="text",  # 這行是關鍵
    )

    retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
    llm = init_llm()
    chain = RetrievalQA.from_chain_type(llm=llm, retriever=retriever,return_source_documents=True)

    query = f"{prompt}\n\n請根據以下關鍵字回應：{', '.join(keywords)}"
    result = chain.invoke({"query": query})

    # Get the retrieved documents
    # docs = retriever.get_relevant_documents(query)
    
    os.makedirs(output_dir, exist_ok=True)
    # filename = f"{output_dir}/{industry}-report-{datetime.now().strftime('%Y-%m')}.md"
    filename = f"{output_dir}/{industry}-report-2025-05.md"
    with open(filename, "w", encoding="utf-8") as f:
        f.write(f"# {industry.title()} 產業月報\n\n")
        f.write(result["result"])
        
        # Add sources section
        # --- ADDED CODE TO WRITE SOURCE DOCUMENTS ---
        f.write("\n\n---\n\n### 參考資料 (Retrieved Documents):\n")
        if "source_documents" in result:
            for i, doc in enumerate(result["source_documents"]):
                print(doc)
                f.write(f"**來源標題:** {doc.metadata.get('title', 'N/A')}\n")
                f.write(f"**發布日期:** {doc.metadata.get('publish_date', 'N/A')}\n")
                f.write(f"**來源網址:** {doc.metadata.get('url', 'N/A')}\n")
                f.write("```\n") # Markdown code block for easy readability
                f.write(doc.page_content)
                f.write("\n```\n")
        # --- END ADDED CODE ---
    
    print(f"✅ 已輸出：{filename}")

# 主流程
def main():
    config = load_industry_config()
    for industry, info in config.items():
        generate_industry_report(industry, info["keywords"], info["prompt"])

if __name__ == "__main__":
    main()