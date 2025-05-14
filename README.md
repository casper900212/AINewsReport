# 📰 News Monthly Report Generator

一個開源工具，用來爬取新聞網站並根據產業分類自動生成 Markdown 與 PDF 格式的月報。  
內建支援本地語言模型（如 LLaMA3、Mistral via Ollama），方便部署於企業內部、學術或地方政府使用。

---

## 🚀 功能特色

<!-- - 🕷 使用 Scrapy / newspaper3k 自動抓取新聞網站
- 🧼 清洗與斷句處理
- 🔍 使用 MiniLM-L6-v2 生成嵌入向量，並儲存於 Qdrant 向量資料庫
- 🤖 結合 LangChain Retriever 與本地 LLM，生成 Markdown 格式月報
- 📄 將 Markdown 匯出為 PDF（使用 WeasyPrint）
- ⚙️ 可透過 GitHub Actions / Cloudflare Cron 定期排程生成 -->

---

## ⚙️ 快速啟動

```bash
# git clone https://github.com/your-org/news-monthly-report
# cd news-monthly-report
# cp .env.example .env
bash scripts/setup_ollama.sh        # 安裝 & 拉取本地 LLM 模型
docker-compose up --build           # 啟動服務（含 Qdrant 向量資料庫）
```