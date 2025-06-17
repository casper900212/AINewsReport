from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Literal
import time

app = FastAPI()

# -------------------- RAG 問答 API --------------------

class QueryRequest(BaseModel):
    query: str
    top_k: int = 3

class QueryResponse(BaseModel):
    answer: str
    sources: List[str]

def retrieve_documents(query: str, top_k: int) -> List[str]:
    # TODO: 向量檢索
    return ["sources"]

def generate_answer(query: str, contexts: List[str]) -> str:
    # TODO: 串接 LLM
    context_str = "\n".join(contexts)
    return "answer"

@app.post("/query", response_model=QueryResponse)
def query_rag(req: QueryRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query string cannot be empty")
    docs = retrieve_documents(req.query, req.top_k)
    answer = generate_answer(req.query, docs)
    return QueryResponse(answer=answer, sources=docs)

# -------------------- 同步爬蟲 API --------------------

class CrawlerJobRequest(BaseModel):
    urls: List[HttpUrl]
    year: int
    month: int
    day: Optional[int] = None

class CrawlerJobResponse(BaseModel):
    status: Literal["Success", "Failed"]

def crawl_url(url: str, date_info: Optional[dict]):
    print(f"[開始爬取] {url} 日期條件: {date_info}")
    time.sleep(2)  # 模擬爬取耗時
    print(f"[完成] {url}")

@app.post("/crawler/jobs", response_model=CrawlerJobResponse)
def create_job(payload: CrawlerJobRequest):
    date_info = {
        "year": payload.year,
        "month": payload.month,
        "day": payload.day
    }

    try:
        for url in payload.urls:
            crawl_url(url, date_info)
        return CrawlerJobResponse(status="Success")
    except Exception as e:
        print(f"[錯誤] {e}")
        return CrawlerJobResponse(status="Failed")
