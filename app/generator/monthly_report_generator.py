from langchain_community.vectorstores import Qdrant
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_ollama import OllamaLLM
from langchain.chains import RetrievalQA
from langchain_core.documents import Document

from qdrant_client import QdrantClient
import yaml, os
from datetime import datetime

# 讀取 config 設定
def load_industry_config(path="config/industry_profiles.yml"):
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

# 初始化 LLM
def init_llm():
    return OllamaLLM(model="mistral")

# 建立產業月報
def generate_industry_report(industry: str, keywords: list, prompt: str, output_dir="outputs"):
    print(f"\n🧠 產生 {industry} 月報...")

    qdrant = QdrantClient(url="http://localhost:6333")
    embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

    vectorstore = Qdrant(
      client=qdrant,
      collection_name="news-articles",
      embeddings=embedding_model,
      content_payload_key="text",  # 這行是關鍵
    )

    retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
    llm = init_llm()
    chain = RetrievalQA.from_chain_type(llm=llm, retriever=retriever)

    query = f"{prompt}\n\n請根據以下關鍵字回應：{', '.join(keywords)}"
    result = chain.invoke({"query": query})

    os.makedirs(output_dir, exist_ok=True)
    filename = f"{output_dir}/{industry}-report-{datetime.now().strftime('%Y-%m')}.md"
    with open(filename, "w", encoding="utf-8") as f:
        f.write(f"# {industry.title()} 產業月報\n\n")
        f.write(result["result"])
    print(f"✅ 已輸出：{filename}")

# 主流程
def main():
    config = load_industry_config()
    for industry, info in config.items():
        generate_industry_report(industry, info["keywords"], info["prompt"])

if __name__ == "__main__":
    main()