from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.http.models import PointStruct
from qdrant_client.models import Filter, FieldCondition, MatchValue, Distance, VectorParams
from qdrant_client.http.exceptions import UnexpectedResponse
import json
import time

qdrant = QdrantClient(url="http://localhost:6333")
collection_name = "blocktempo-articles-2025-05-original"

# 建立 collection（若尚未存在）
try:
    qdrant.get_collection(collection_name=collection_name)
    print(f"✅ Collection '{collection_name}' already exists.")
    '''
    # Delete existing collection to recreate with correct dimensions
    qdrant.delete_collection(collection_name=collection_name)
    print(f"🗑️ Deleted existing collection to update dimensions")
    '''
except UnexpectedResponse as e:
    if e.status_code == 404:
        print(f"🆕 Collection '{collection_name}' does not exist. Creating it.")
        qdrant.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=768, distance=Distance.COSINE),
        )
    else:
        raise e

# 清空舊資料（⚠️小心：這會刪光 collection 中所有資料）
qdrant.delete(
    collection_name=collection_name,
    points_selector=Filter(must=[])  # 空條件代表刪除全部
)
print(f"🧹 清空 collection '{collection_name}' 的所有資料")

# 讀取多筆新聞資料
with open("../../data/blocktempo_articles_2025-05_full.json", "r", encoding="utf-8") as f:
    news_items = json.load(f)

# Start timing
start_time = time.time()

model = SentenceTransformer("sentence-transformers/msmarco-bert-base-dot-v5")

points = []
id_counter = 0

for item in news_items:
    content = item["text"]
    title = item.get("title", "")
    date = item.get("publish_date", "")
    url = item.get("url", "")
    
    print(f"Processing item: {title} - {date} - {url}\n")

    # 分段處理
    chunk_size = 500
    chunk_overlap = 10
    chunks = [content[i:i + chunk_size] for i in range(0, len(content), chunk_size - chunk_overlap)]

    vectors = model.encode(chunks)

    for i, (vec, chunk) in enumerate(zip(vectors, chunks)):
        if isinstance(chunk, str) and chunk.strip():  # 濾掉空段
            points.append(PointStruct(
                id=id_counter,
                vector=vec.tolist(),
                payload={
                    "text": chunk, # This is your main content, correctly mapped by content_payload_key="text"
                    "metadata": { # <<<--- ADDED THIS NESTED DICTIONARY
                        "title": title,
                        "publish_date": date,
                        "url": url
                    }
                }
            ))
            id_counter += 1

# 上傳到 Qdrant
qdrant.upsert(collection_name=collection_name, points=points)

# Calculate and print elapsed time
end_time = time.time()
elapsed_time = end_time - start_time
print(f"⏱️ 向量化與儲存耗時: {elapsed_time:.2f} 秒")
print(f"✅ 完成上傳 {len(points)} 筆向量至 Qdrant collection '{collection_name}'")
