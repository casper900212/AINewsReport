from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Literal
from generator import monthly_report_generator
import time

app = FastAPI()

# -------------------- RAG 問答 API --------------------

class QueryRequest(BaseModel):
    conversation_history: List[dict] # Renamed for clarity and to match monthly_report_generator's expectation
    previous_report_content: Optional[str] = None # Renamed for clarity and to match monthly_report_generator's expectation

class QueryResponse(BaseModel):
    output: str
    sources: list

def retrieve_documents(query: str, top_k: int) -> List[str]:
    # TODO: 向量檢索
    return ["sources"]

def generate_answer(query: str, contexts: List[str]) -> str:
    # TODO: 串接 LLM
    context_str = "\n".join(contexts)
    return "answer"

@app.post("/query", response_model=QueryResponse)
def query_rag(req: QueryRequest):
    # The check for empty query string might be more complex now depending on history content
    # For now, we'll assume the history will always contain something meaningful for processing
    if not req.conversation_history:
         raise HTTPException(status_code=400, detail="Conversation history cannot be empty")

    docs, output = monthly_report_generator.process_revision_request(
        req.conversation_history,
        req.previous_report_content
    )
    return QueryResponse(output=output, sources=docs)

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
