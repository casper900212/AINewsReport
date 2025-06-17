from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.http.models import PointStruct
from qdrant_client.models import Filter, FieldCondition, MatchValue, Distance, VectorParams
from qdrant_client.http.exceptions import UnexpectedResponse, ResponseHandlingException
import json
import time
import argparse
from datetime import datetime
import numpy as np

def validate_month(month: str) -> bool:
    """驗證月份格式是否正確"""
    try:
        datetime.strptime(month, '%Y-%m')
        return True
    except ValueError:
        return False

def process_batch(points, qdrant, collection_name, batch_size=100):
    """分批處理向量上傳"""
    for i in range(0, len(points), batch_size):
        batch = points[i:i + batch_size]
        max_retries = 3
        for attempt in range(max_retries):
            try:
                qdrant.upsert(
                    collection_name=collection_name,
                    points=batch
                )
                print(f"✅ 成功上傳第 {i//batch_size + 1} 批向量 ({len(batch)} 筆)")
                break
            except ResponseHandlingException as e:
                if attempt < max_retries - 1:
                    print(f"⚠️ 上傳超時，正在重試 ({attempt + 1}/{max_retries})...")
                    time.sleep(5)  # 等待5秒後重試
                else:
                    print(f"❌ 上傳失敗：{str(e)}")
                    raise e

def main():
    # 設置命令行參數
    parser = argparse.ArgumentParser(description='將文章轉換為向量並存儲到 Qdrant')
    parser.add_argument('--source', type=str, required=True, help='來源媒體 (例如: blocktempo)')
    parser.add_argument('--month', type=str, required=True, help='目標月份 (格式: YYYY-MM)')
    args = parser.parse_args()

    # 驗證月份格式
    if not validate_month(args.month):
        print("❌ 錯誤：月份格式必須為 YYYY-MM")
        return

    # 構建 collection 名稱
    collection_name = f"{args.month}"
    print(f"📊 使用集合: {collection_name}")

    # 初始化 Qdrant 客戶端
    qdrant = QdrantClient(
        url="http://localhost:6333"
    )

    # 建立 collection（若尚未存在）
    try:
        qdrant.get_collection(collection_name=collection_name)
        print(f"✅ Collection '{collection_name}' already exists.")
    except UnexpectedResponse as e:
        if e.status_code == 404:
            print(f"🆕 Collection '{collection_name}' does not exist. Creating it.")
            qdrant.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=768, distance=Distance.COSINE),  # Jina embeddings 使用 768 維度
            )
        else:
            raise e

    # 清空舊資料（⚠️小心：這會刪光 collection 中所有資料）
    try:
        qdrant.delete(
            collection_name=collection_name,
            points_selector=Filter(must=[])  # 空條件代表刪除全部
        )
        print(f"🧹 清空 collection '{collection_name}' 的所有資料")
    except Exception as e:
        print(f"⚠️ 清空資料時發生錯誤：{str(e)}")
        return

    # 讀取新聞資料
    input_file = f"../../data/{args.source}_{args.month}.json"
    try:
        with open(input_file, "r", encoding="utf-8") as f:
            news_items = json.load(f)
    except FileNotFoundError:
        print(f"❌ 錯誤：找不到檔案 {input_file}")
        return
    except json.JSONDecodeError:
        print(f"❌ 錯誤：檔案 {input_file} 格式不正確")
        return

    # Start timing
    start_time = time.time()

    print("🔄 開始向量化處理...")
    print("📚 使用 Jina embeddings 模型進行中文文本向量化")
    model = SentenceTransformer('jinaai/jina-embeddings-v2-base-zh', trust_remote_code=True)

    points = []
    id_counter = 0
    batch_size = 100  # 每批處理的向量數量

    for item in news_items:
        content = item["text"]
        title = item.get("title", "")
        date = item.get("publish_date", "")
        url = item.get("url", "")
        
        print(f"Processing item: {title} - {date} - {url}\n")

        '''
        # 分段處理
        chunk_size = 500
        chunk_overlap = 10
        chunks = [content[i:i + chunk_size] for i in range(0, len(content), chunk_size - chunk_overlap)]
        content_id = 1 # 辨別第幾個chunk
        '''

        try:
            # 使用模型進行向量化
            vector = model.encode(content, show_progress_bar=True)
            
            # 確保向量是正確的格式
            if isinstance(vector, np.ndarray):
                vector = vector.tolist()
            elif not isinstance(vector, list):
                vector = [float(x) for x in vector]

            if isinstance(content, str) and content.strip():  # 濾掉空段
                points.append(PointStruct(
                    id=id_counter,
                    vector=vector,
                    payload={
                        "text": content,
                        "metadata": {
                            "title": title,
                            "publish_date": date,
                            "url": url
                        }
                    }
                ))
                id_counter += 1

            # 當累積的向量達到批次大小時，進行上傳
            if len(points) >= batch_size:
                process_batch(points, qdrant, collection_name, batch_size)
                points = []  # 清空已處理的向量

        except Exception as e:
            print(f"⚠️ 處理文章時發生錯誤: {str(e)}")
            continue

    # 處理剩餘的向量
    if points:
        process_batch(points, qdrant, collection_name, batch_size)

    # Calculate and print elapsed time
    end_time = time.time()
    elapsed_time = end_time - start_time
    print(f"⏱️ 向量化與儲存耗時: {elapsed_time:.2f} 秒")
    print(f"✅ 完成上傳 {id_counter} 筆向量至 Qdrant collection '{collection_name}'")

if __name__ == "__main__":
    main()
