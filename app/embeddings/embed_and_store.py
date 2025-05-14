from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.http.models import PointStruct
from qdrant_client.models import Filter, FieldCondition, MatchValue, Distance, VectorParams
from qdrant_client.http.exceptions import UnexpectedResponse
import json

qdrant = QdrantClient(url="http://localhost:6333")
collection_name = "news-articles"

# 建立 collection（若尚未存在）
try:
    qdrant.get_collection(collection_name=collection_name)
    print(f"✅ Collection '{collection_name}' already exists.")
except UnexpectedResponse as e:
    if e.status_code == 404:
        print(f"🆕 Collection '{collection_name}' does not exist. Creating it.")
        qdrant.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE),
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
with open("data/sample_news.json", "r", encoding="utf-8") as f:
    news_items = json.load(f)

model = SentenceTransformer("all-MiniLM-L6-v2")

points = []
id_counter = 0

for item in news_items:
    content = item["text"]
    title = item.get("title", "")
    date = item.get("publish_date", "")

    # 分段處理
    chunk_size = 200
    chunk_overlap = 50
    chunks = [content[i:i + chunk_size] for i in range(0, len(content), chunk_size - chunk_overlap)]

    vectors = model.encode(chunks)

    for i, (vec, chunk) in enumerate(zip(vectors, chunks)):
        if isinstance(chunk, str) and chunk.strip():  # 濾掉空段
            points.append(PointStruct(
                id=id_counter,  # 改為 int，不要轉成 str
                vector=vec.tolist(),
                payload={
                    "text": chunk,
                    "title": title,
                    "date": date
                }
            ))
            id_counter += 1

# 上傳到 Qdrant
qdrant.upsert(collection_name=collection_name, points=points)
print(f"✅ 完成上傳 {len(points)} 筆向量至 Qdrant collection '{collection_name}'")
