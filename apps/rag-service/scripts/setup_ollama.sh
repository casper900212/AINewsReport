#!/bin/bash

# echo "🔧 Installing Ollama..."
# curl -fsSL https://ollama.com/install.sh | sh

# use homebrew to install ollama instead
# brew install ollama

echo "Start Ollama service in background ..."
brew services start ollama

echo "⬇️ Pulling mistral model..."
ollama pull mistral

echo "✅ Done! You can now run: ollama run mistral"
