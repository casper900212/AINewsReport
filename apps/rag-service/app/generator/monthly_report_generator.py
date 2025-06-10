from langchain_community.vectorstores import Qdrant
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_ollama import OllamaLLM
from langchain.chains import RetrievalQA
from langchain_core.documents import Document
from langchain.chains.question_answering import load_qa_chain

from qdrant_client import QdrantClient
import yaml, os
from datetime import datetime
import re
from prompts import SYSTEM_PROMPT, INDUSTRY_PROMPTS, SUMMARY_PROMPT
from collections import defaultdict
import argparse

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
    return OllamaLLM(model="gemma3:latest")

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

def get_diverse_sources(vectorstore, query: str, k: int = 5):
    """第一輪：獲取不同來源的文章"""
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
        diverse_docs.append(docs[0])  # 取每個來源的第一篇文章
    
    return diverse_docs

def get_related_content(vectorstore, source_docs, query: str):
    """第二輪：獲取相同來源的所有相關文章"""
    all_related_docs = []
    seen_urls = set()
    
    # 獲取所有找到的URL
    urls = [doc.metadata.get('url', 'unknown') for doc in source_docs]
    urls = list(set(urls))  # 移除重複的URL
    
    # 使用Qdrant的filter功能直接獲取所有相同URL的文章
    for url in urls:
        if url in seen_urls:
            continue
            
        seen_urls.add(url)
        # 使用filter直接獲取所有相同URL的文章
        related_docs = vectorstore.similarity_search(
            query,
            k=100,  # 設置較大的k值以確保獲取所有文章
            filter={"url": url}  # 使用URL作為過濾條件
        )
        all_related_docs.extend(related_docs)
    
    return all_related_docs

def combine_documents_by_url(documents):
    """先按URL分組，再按ID順序合併文章"""
    combined_docs = []
    url_groups = defaultdict(list)
    
    # 第一步：按URL分組
    for doc in documents:
        url = doc.metadata.get('url', 'unknown')
        url_groups[url].append(doc)
    
    # 第二步：對每個URL組內的文章按ID排序並合併
    article_counter = 1
    for url, docs in url_groups.items():
        # 按ID排序
        sorted_docs = sorted(docs, key=lambda x: x.metadata.get('id', ''))
        
        # 合併內容
        combined_content = []
        combined_content.append(f"###第{article_counter}篇文章###\n")
        # 添加文章元數據
        combined_content.append(
            f"標題： {sorted_docs[0].metadata.get('title', 'N/A')}\n"
            f"日期： {sorted_docs[0].metadata.get('publish_date', 'N/A')}\n"
            f"來源： {url}"
        )
        for doc in sorted_docs:
            content = doc.page_content
            combined_content.append(content)
        
        
        # 創建新的合併文檔
        combined_doc = Document(
            page_content="\n".join(combined_content),
            metadata={
                'url': url,
                'title': sorted_docs[0].metadata.get('title', 'N/A'),
                'publish_date': sorted_docs[0].metadata.get('publish_date', 'N/A'),
                'source_count': len(docs)
            }
        )
        combined_docs.append(combined_doc)
        article_counter += 1
    
    return combined_docs

# 建立產業月報
def generate_industry_report(industry: str, keywords: list, prompt: str, output_dir: str, target_month: str = None):
    print(f"\n🧠 產生 {industry} {target_month}月報...")

    # 從提示中提取日期
    date = extract_date_from_prompt(prompt, target_month)
    # 當source 來源增加時改成動態調整
    collection_name = f"blocktempo-articles-{date}-original"
    print(f"📊 使用集合: {collection_name}")

    qdrant = QdrantClient(url="http://localhost:6333")
    embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/msmarco-bert-base-dot-v5")

    vectorstore = Qdrant(
      client=qdrant,
      collection_name=collection_name,
      embeddings=embedding_model,
      content_payload_key="text",  # 這行是關鍵
    )

    # 構建查詢
    industry_specific_prompt = INDUSTRY_PROMPTS.get(industry.lower(), "")
    query = f"{prompt}\n\n請根據以下關鍵字回應：{', '.join(keywords)}"
    
    # 第一輪：獲取不同來源的文章
    print("🔍 第一輪：獲取不同來源的文章...")
    diverse_docs = get_diverse_sources(vectorstore, query)
    print(f"✅ 找到 {len(diverse_docs)} 個不同來源")
    
    # 第二輪：獲取相同來源的相關文章
    print("🔍 第二輪：獲取相關文章...")
    all_related_docs = get_related_content(vectorstore, diverse_docs, query)
    print(f"✅ 總共找到 {len(all_related_docs)} 篇相關文章")
    
    # 合併相同id的文章
    print("🔄 合併相同url的文章...")
    combined_docs = combine_documents_by_url(all_related_docs)
    print(f"✅ 合併後共有 {len(combined_docs)} 篇文章")
    
    # 直接使用合併後的文章進行生成
    llm = init_llm()
    chain = load_qa_chain(llm, chain_type="stuff")
    
    # 使用總結提示詞
    summary_prompt = SUMMARY_PROMPT.format(
        industry=industry,
        keywords=', '.join(keywords),
        original_prompt=prompt
    )
    result = chain.invoke({"input_documents": combined_docs, "question": summary_prompt})
    
    os.makedirs(output_dir, exist_ok=True)
    filename = f"{output_dir}/{industry}-report-{date}.md"
    with open(filename, "w", encoding="utf-8") as f:
        f.write(f"# {industry.title()} 產業月報 ({date})\n\n")
        f.write(result["output_text"])
        
        # Add sources section
        f.write("\n\n---\n\n### 參考資料 (Retrieved Documents):\n")
        # 按來源URL分組顯示
        sources = defaultdict(list)
        for doc in combined_docs:
            url = doc.metadata.get('url', 'N/A')
            sources[url].append(doc)
        
        # 顯示每個來源的所有文章
        for url, docs in sources.items():
            f.write(f"\n#### 來源: {url}\n")
            for doc in docs:
                f.write(doc.page_content)
                f.write("\n```\n")
    
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