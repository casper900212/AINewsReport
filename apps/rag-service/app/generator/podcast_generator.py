from langchain_community.vectorstores import Qdrant
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_ollama import OllamaLLM # Not used in this version, keeping for reference
from langchain_core.documents import Document
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationalRetrievalChain # Not directly used for revision task
from langchain.prompts import PromptTemplate
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from qdrant_client import QdrantClient
import yaml, os
from datetime import datetime
import re
# Assuming prompts.py contains these. We'll adapt SUMMARY_PROMPT or create a new REVISION_PROMPT.
# from prompts import SYSTEM_PROMPT, INDUSTRY_PROMPTS, SUMMARY_PROMPT
from collections import defaultdict
import argparse
import getpass
import json
import requests
import base64
import struct
import wave

# Global LLM instance
global_llm = None

# --- Utility Functions ---

def load_industry_config(config_path: str):
    """
    Loads industry configuration from a YAML file.
    """
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)
    except FileNotFoundError:
        print(f"❌ Error: Configuration file not found at {config_path}")
        return None
    except yaml.YAMLError as e:
        print(f"❌ Error: Invalid configuration file format - {str(e)}")
        return None

def initialize_llm(model_name: str = "gemini-1.5-pro", temperature: float = 0.5):
    """
    Initializes a ChatGoogleGenerativeAI LLM instance.
    """
    global global_llm
    if global_llm is None:
        try:
            # Note: The API key for ChatGoogleGenerativeAI should be set as an environment variable (GOOGLE_API_KEY)
            # or passed directly. For this example, we assume it's configured.
            global_llm = ChatGoogleGenerativeAI(
                model=model_name,
                temperature=temperature,
                convert_system_message_to_human=True,
            )
            print("✅ LLM initialized successfully.")
        except Exception as e:
            print(f"❌ Error initializing LLM: {e}")
            global_llm = None
    return global_llm

def get_relevant_docs(query: str, documents: list[dict], k: int = 2) -> list[dict]:
    """
    Simulated RAG retrieval function.
    In a real application, this would query a vector store like Qdrant.
    Here, it performs a simple keyword-based search on hardcoded documents.
    """
    keywords = query.lower().split()
    scored_docs = []

    for doc in documents:
        score = 0
        content_lower = doc['content'].lower()
        for keyword in keywords:
            if keyword in content_lower:
                score += 1
        
        if score > 0:
            scored_docs.append({'doc': doc, 'score': score})

    # Sort by score in descending order and return the top k
    scored_docs.sort(key=lambda x: x['score'], reverse=True)
    return [item['doc'] for item in scored_docs[:k]]

def generate_podcast_script(retrieved_docs: list[dict]):
    """
    Generates a podcast script using an LLM based on retrieved documents.
    """
    llm = initialize_llm()
    if not llm:
        return "Error: LLM not initialized."

    # Format the documents for the LLM prompt
    formatted_docs = "\n\n---\n\n".join([f"Title: {doc['title']}\nContent: {doc['content']}" for doc in retrieved_docs])

    # Craft the prompt for the LLM
    prompt_template = PromptTemplate(
        template="""Act as two podcast hosts, 'Host 1' and 'Host 2', and create a short, conversational script based on the following documents. Discuss the key points and synthesize the information. The script should be formatted as 'Host 1: [text]' and 'Host 2: [text]' for each line. The tone should be informative and engaging.

        Input Documents:
        {documents}

        Podcast Script:""",
        input_variables=["documents"]
    )
    
    prompt = prompt_template.format(documents=formatted_docs)
    
    try:
        print("💡 Generating podcast script with LLM...")
        # Use a list of messages to maintain a conversational format
        response = llm.invoke([
            SystemMessage(content="You are a helpful assistant for generating podcast scripts."),
            HumanMessage(content=prompt)
        ])
        
        # Access the content from the AIMessage object
        script = response.content
        return script

    except Exception as e:
        print(f"❌ Error generating podcast script: {e}")
        return "Error generating podcast script."

def generate_podcast_audio(script: str, output_path: str):
    """
    Generates a podcast audio file from the script using the Gemini TTS API.
    """
    print("🎧 Generating podcast audio...")
    api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key="
    api_key = os.getenv("GOOGLE_API_KEY", "") # Retrieve from environment variable
    
    if not api_key:
        print("❌ Error: GOOGLE_API_KEY environment variable not set.")
        return False

    headers = {'Content-Type': 'application/json'}
    payload = {
        "contents": [
            {
                "parts": [{"text": script}]
            }
        ],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "multiSpeakerVoiceConfig": {
                    "speakerVoiceConfigs": [
                        {"speaker": "Host 1", "voiceConfig": {"prebuiltVoiceConfig": {"voiceName": "Kore"}}},
                        {"speaker": "Host 2", "voiceConfig": {"prebuiltVoiceConfig": {"voiceName": "Puck"}}}
                    ]
                }
            }
        },
        "model": "gemini-2.5-flash-preview-tts"
    }

    try:
        response = requests.post(f"{api_url}{api_key}", headers=headers, json=payload)
        response.raise_for_status() # Raise an exception for bad status codes
        
        result = response.json()
        audio_data_base64 = result['candidates'][0]['content']['parts'][0]['inlineData']['data']
        audio_data = base64.b64decode(audio_data_base64)
        mime_type = result['candidates'][0]['content']['parts'][0]['inlineData']['mimeType']
        sample_rate = int(re.search(r'rate=(\d+)', mime_type).group(1))

        # Write the audio data to a WAV file
        with wave.open(output_path, 'wb') as wav_file:
            wav_file.setnchannels(1) # Mono audio
            wav_file.setsampwidth(2)  # 16-bit audio
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(audio_data)
        
        print(f"✅ Audio saved successfully to: {output_path}")
        return True

    except requests.exceptions.RequestException as e:
        print(f"❌ Error during API call: {e}")
        return False
    except (KeyError, IndexError, TypeError, AttributeError) as e:
        print(f"❌ Error parsing API response: {e}")
        return False

def main():
    """
    Main function to orchestrate the RAG and podcast generation process.
    """
    # Hardcoded documents to simulate a news crawl.
    # In a real application, you would dynamically fetch this content.
    example_news = [
        {
            "id": 1,
            "title": "New AI Breakthroughs Boost Efficiency Across Industries",
            "content": "Recent advancements in artificial intelligence are leading to significant efficiency gains in sectors from manufacturing to healthcare. New machine learning models are optimizing supply chains, predicting equipment failures, and even assisting with medical diagnoses. Experts say this new wave of AI is more accessible and easier to integrate than previous generations, promising a swift adoption rate.",
        },
        {
            "id": 2,
            "title": "Global Supply Chain Faces New Challenges",
            "content": "Disruptions from recent geopolitical events and climate-related disasters are putting unprecedented pressure on global supply chains. Companies are now looking for resilient and flexible solutions, including diversifying their manufacturing hubs and investing in real-time tracking technologies. The goal is to build a system that can quickly adapt to unforeseen shocks.",
        },
        {
            "id": 3,
            "title": "Renewable Energy Adoption Accelerates Worldwide",
            "content": "The transition to renewable energy is gaining momentum, with new reports showing record-breaking investments in solar and wind power. Governments and corporations are committing to ambitious decarbonization goals, driving innovation and lowering the cost of green technologies. This shift is not only a response to climate change but also a strategic move to secure energy independence.",
        },
        {
            "id": 4,
            "title": "AI in Healthcare: A Growing Partnership",
            "content": "The intersection of artificial intelligence and healthcare is proving to be a powerful force for change. AI-powered tools are now being used for everything from analyzing medical images to personalizing treatment plans for patients. While the technology is promising, challenges remain in data privacy and regulatory approval.",
        },
        {
            "id": 5,
            "title": "The Future of Manufacturing with AI",
            "content": "AI is revolutionizing the manufacturing industry, moving from simple automation to complex, self-optimizing systems. Smart factories use AI to monitor production lines, predict maintenance needs, and improve quality control. The result is a more efficient, cost-effective, and flexible manufacturing process.",
        },
    ]

    # Use argparse to get a query from the command line
    parser = argparse.ArgumentParser(description="Generate a podcast script using RAG.")
    parser.add_argument("query", type=str, help="The topic for the podcast, e.g., 'AI in healthcare'.")
    args = parser.parse_args()
    
    user_query = args.query
    print(f"🔍 Searching for relevant documents for the query: '{user_query}'...")
    
    # Step 1: Simulate RAG document retrieval
    retrieved_docs = get_relevant_docs(user_query, example_news)
    
    if not retrieved_docs:
        print("❌ No relevant documents found. Please try a different query.")
        return

    print("✅ Documents retrieved:")
    for doc in retrieved_docs:
        print(f" - {doc['title']}")

    # Step 2: Generate the podcast script
    podcast_script = generate_podcast_script(retrieved_docs)
    
    if podcast_script.startswith("Error:"):
        print(podcast_script)
        return

    print("\n=== Generated Podcast Script ===")
    print(podcast_script)
    print("================================")
    print("\n✅ Script generation complete.")

    # Step 3: Generate the podcast audio file
    output_filename = "podcast.wav"
    generate_podcast_audio(podcast_script, output_filename)


if __name__ == "__main__":
    main()
