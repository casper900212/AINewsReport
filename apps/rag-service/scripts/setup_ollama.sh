#!/bin/bash

# echo "🔧 Installing Ollama..."
# curl -fsSL https://ollama.com/install.sh | sh

# use homebrew to install ollama instead
# brew install ollama

echo "Start Ollama service in background ..."
brew services start ollama

echo "⬇️ Pulling gemma3 model..."
ollama pull gemma3:latest

echo "✅ Done! You can now run: ollama run gemma3"
