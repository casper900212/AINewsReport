from langchain_community.vectorstores import Qdrant
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_ollama import OllamaLLM
from langchain.chains import RetrievalQA
from langchain_core.documents import Document
from langchain.chains.question_answering import load_qa_chain
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationalRetrievalChain
from langchain.prompts import PromptTemplate
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from qdrant_client import QdrantClient
import yaml, os
from datetime import datetime
import re
from prompts import SYSTEM_PROMPT, INDUSTRY_PROMPTS, SUMMARY_PROMPT
from collections import defaultdict
import argparse
import getpass


# 讀取 config 設定
def load_industry_config(config_path: str):
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)
    except FileNotFoundError:
        print(f"❌ 錯誤：找不到設定檔 {config_path}")
        return None
    except yaml.YAMLError as e:
        print(f"❌ 錯誤：設定檔格式不正確 - {str(e)}")
        return None

# 初始化 LLM
def init_llm():
    # return OllamaLLM(model="mistral")
    if "GOOGLE_API_KEY" not in os.environ:
        os.environ["GOOGLE_API_KEY"] = getpass.getpass("Enter your Google AI API key: ")
    llm = ChatGoogleGenerativeAI(model='gemini-2.0-flash', temperature=0)
    return llm

# 從提示中提取日期
def extract_date_from_prompt(prompt: str, target_month: str = None) -> str:
    if target_month:
        return target_month
    # 尋找 YYYY-MM 格式的日期
    date_pattern = r'\d{4}-\d{2}'
    match = re.search(date_pattern, prompt)
    if match:
        print(match.group(0))
        return match.group(0)
    return datetime.now().strftime('%Y-%m')  # 如果沒有找到日期，使用當前月份

def get_diverse_sources(vectorstore, query: str, k: int = 5, memory: ConversationBufferMemory = None):
    """第一輪：獲取不同來源的文章，支援對話記憶"""
    # 使用較大的 k 值以確保有足夠的不同來源
    initial_docs = vectorstore.similarity_search(query, k=k*2)
    
    # 按來源URL分組
    sources = defaultdict(list)
    for doc in initial_docs:
        url = doc.metadata.get('url', 'unknown')
        sources[url].append(doc)
    
    # 選擇前 k 個不同來源的文章
    diverse_docs = []
    for url, docs in sources.items():
        if len(diverse_docs) >= k:
            break
        # 取每個來源的第一篇文章
        doc = docs[0]
        diverse_docs.append(Document(
            page_content=(
                f"Title： {doc.metadata.get('title', 'N/A')}\n"
                f"Date： {doc.metadata.get('publish_date', 'N/A')}\n"
                f"Source： {url}\n"
                f"{doc.page_content}"
            ),
            metadata=doc.metadata
        ))
    
    return diverse_docs


# 建立產業月報
def generate_industry_report(industry: str, keywords: list, prompt: str, output_dir: str, target_month: str = None):
    print(f"\n🧠 產生 {industry} {target_month}月報...")

    # 從提示中提取日期
    date = extract_date_from_prompt(prompt, target_month)
    collection_name = f"{date}"
    print(f"📊 使用集合: {collection_name}")

    qdrant = QdrantClient(url="http://localhost:6333")
    embedding_model = HuggingFaceEmbeddings(
        model_name="jinaai/jina-embeddings-v2-base-zh",
        model_kwargs={'trust_remote_code': True}
    )

    vectorstore = Qdrant(
        client=qdrant,
        collection_name=collection_name,
        embeddings=embedding_model,
        content_payload_key="text",
    )

    # 初始化對話記憶
    memory = ConversationBufferMemory(
        memory_key="chat_history",
        return_messages=True
    )

    # 構建查詢
    industry_specific_prompt = INDUSTRY_PROMPTS.get(industry.lower(), "")
    query = f"{prompt}\n\n請根據以下關鍵字回應：{', '.join(keywords)}"
    
    # 第一輪：獲取不同來源的文章
    print("🔍 第一輪：獲取不同來源的文章...")
    diverse_docs = get_diverse_sources(vectorstore, query, memory=memory)
    print(f"✅ 找到 {len(diverse_docs)} 個不同來源")
    
    # 初始化 LLM
    llm = init_llm()
    
    documents_text = "\n\n".join([doc.page_content for doc in diverse_docs])
    
    # 使用總結提示詞
    summary_prompt = SUMMARY_PROMPT.format(
        industry=industry,
        keywords=', '.join(keywords),
        input_docs=documents_text,
    )
    
    output = llm.invoke([
        SystemMessage(content=summary_prompt),
        HumanMessage(content=prompt)
    ])
    
    output_string = output.content
    print(output_string)
    
    os.makedirs(output_dir, exist_ok=True)
    filename = f"{output_dir}/{industry}-report-{date}.md"
    with open(filename, "w", encoding="utf-8") as f:
        f.write(f"# {industry.title()} 產業月報 ({date})\n\n")
        f.write(output_string)
        
        '''
        # Add sources section
        f.write("\n\n---\n\n### 參考資料 (Retrieved Documents):\n")
        # 按來源URL分組顯示
        sources = defaultdict(list)
        for doc in diverse_docs:
            url = doc.metadata.get('url', 'N/A')
            sources[url].append(doc)
        
        # 顯示每個來源的所有文章
        for url, docs in sources.items():
            f.write(f"\n#### 來源: {url}\n")
            for doc in docs:
                f.write(doc.page_content)
                f.write("\n```\n")
        '''
    
    print(f"✅ 已輸出：{filename}")

# 主流程
def main():
    # 設置命令行參數
    parser = argparse.ArgumentParser(description='生成產業月報')
    parser.add_argument('--config', type=str, default='../../config/blockchain_reports_news_summary.yaml',
                      help='設定檔路徑 (預設: ../../config/blockchain_reports_news_summary.yaml)')
    parser.add_argument('--month', type=str, help='目標月份 (格式: YYYY-MM)')
    parser.add_argument('--output', type=str, default='../../outputs/test',
                      help='輸出目錄 (預設: ../../outputs/test)')
    args = parser.parse_args()

    # 驗證月份格式（如果提供）
    if args.month:
        try:
            datetime.strptime(args.month, '%Y-%m')
            print(args.month)
        except ValueError:
            print("❌ 錯誤：月份格式必須為 YYYY-MM")
            return

    # 讀取設定檔
    config = load_industry_config(args.config)
    if not config:
        return

    # 生成報告
    for industry, info in config.items():
        generate_industry_report(
            industry=industry,
            keywords=info["keywords"],
            prompt=info["prompt"],
            output_dir=args.output,
            target_month=args.month
        )

if __name__ == "__main__":
    main()