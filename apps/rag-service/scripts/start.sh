#!/bin/bash

echo "🔧 初始化環境..."

# echo "✅ 建立 config 檔案..."
# cp .env.example .env

echo "⬇️ 安裝本地模型..."
bash scripts/setup_ollama.sh

echo "🚀 啟動系統..."
docker-compose up --build
