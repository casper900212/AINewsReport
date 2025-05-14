#!/bin/bash

echo "🔧 Installing Ollama..."
curl -fsSL https://ollama.com/install.sh | sh

echo "⬇️ Pulling mistral model..."
ollama pull mistral

echo "✅ Done! You can now run: ollama run mistral"
