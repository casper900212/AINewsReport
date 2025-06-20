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

# Global LLM instance (can be initialized once per process, or per request if stateless API)
global_llm = None

# --- Utility Functions (mostly unchanged, but some might be less relevant) ---

def load_industry_config(config_path: str):
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)
    except FileNotFoundError:
        print(f"❌ Error: Configuration file not found at {config_path}")
        return None
    except yaml.YAMLError as e:
        print(f"❌ Error: Invalid configuration file format - {str(e)}")
        return None

def init_llm():
    """Initializes and returns the LLM instance."""
    global global_llm
    if global_llm is None:
        if "GOOGLE_API_KEY" not in os.environ:
            os.environ["GOOGLE_API_KEY"] = getpass.getpass("Enter your Google AI API key: ")
        global_llm = ChatGoogleGenerativeAI(model='gemini-2.0-flash', temperature=0)
    return global_llm

def extract_date_from_prompt(prompt: str, target_month: str = None) -> str:
    # This might become less relevant if we are always given a collection or documents
    if target_month:
        return target_month
    date_pattern = r'\d{4}-\d{2}'
    match = re.search(date_pattern, prompt)
    if match:
        return match.group(0)
    return datetime.now().strftime('%Y-%m')

def init_vectorstore(collection_name: str):
    """Initializes and returns the Qdrant vectorstore. Used if RAG is part of *every* request."""
    qdrant_client = QdrantClient(url="http://localhost:6333")
    embedding_model = HuggingFaceEmbeddings(
        model_name="jinaai/jina-embeddings-v2-base-zh",
        model_kwargs={'trust_remote_code': True}
    )
    vectorstore = Qdrant(
        client=qdrant_client,
        collection_name=collection_name,
        embeddings=embedding_model,
        content_payload_key="text",
    )
    return vectorstore

def get_diverse_sources(vectorstore, query: str, k: int = 5):
    """Performs RAG to retrieve diverse documents.
       This function would be called if *every* revision request needs fresh RAG."""
    # In a truly stateless "revise" model, you'd likely pass the relevant docs or a summary with the request
    # rather than doing RAG for every single revision. However, keeping it here for demonstration
    # in case you intend to do RAG per revision request.
    print("🔍 Performing RAG: Fetching diverse sources...")
    initial_docs = vectorstore.similarity_search(query, k=k*2)

    sources = defaultdict(list)
    for doc in initial_docs:
        url = doc.metadata.get('url', 'unknown')
        sources[url].append(doc)

    diverse_docs = []
    for url, docs in sources.items():
        if len(diverse_docs) >= k:
            break
        doc = docs[0]
        diverse_docs.append(Document(
            page_content=(
                f"Title： {doc.metadata.get('title', 'N/A')}\n"
                f"Date： {doc.metadata.get('publish_date', 'N/A')}\n"
                f"Source： {url}\n"
                f"{doc.page_content}"
            ),
            metadata=doc.metadata
        ))
    print(f"✅ Found {len(diverse_docs)} diverse sources.")
    return diverse_docs


def process_revision_request(request_data: list[dict], output_dir: str = None): # Changed type hint to List[dict]
    
    SUMMARY_PROMPT = """You are a professional industry analyst responsible for generating monthly industry reports. You must generate a complete industry monthly report based on the provided articles. The report should include the following sections:

        1. Industry Overview: Summarize the overall development of the {industry} industry this month
        2. Article Summaries: Provide individual summaries for articles from different sources
        3. Key Points: Extract key points from each article

        Output Example:

        # {industry} Industry Monthly Report - January 2025

        **Industry Overview:**

        Industry overview

        **Article Summaries:**

        **1. Title of Article 1**

        * **Source:** Source of Article 1
        * **Date:** Date of Article 1
        * **Summary:** Summary of Article 1
        * **Key Points:**
        1. Key point 1:
            - Key details
            - Key details

        2. Key point 2
            - Key details
            - Key details
        
        3. Key point 3
            - Key details
            - Key details

        **2. Title of Article 2**

        * **Source:** Source of Article 2
        * **Date:** Date of Article 2
        * **Summary:** Summary of Article 2
        * **Key Points:**
        1. Key point 1:
            - Key details
            - Key details

        2. Key point 2
            - Key details
            - Key details
        
        3. Key point 3
            - Key details
            - Key details

        **3. Title of Article 3**

        * **Source:** Source of Article 3
        * **Date:** Date of Article 3
        * **Summary:** Summary of Article 3
        * **Key Points:**
        1. Key point 1:
            - Key details
            - Key details

        2. Key point 2
            - Key details
            - Key details
        
        3. Key point 3
            - Key details
            - Key details
            
        **4. Title of Article 4**

        * **Source:** Source of Article 4
        * **Date:** Date of Article 4
        * **Summary:** Summary of Article 4
        * **Key Points:**
        1. Key point 1:
            - Key details
            - Key details

        2. Key point 2
            - Key details
            - Key details
        
        3. Key point 3
            - Key details
            - Key details
            
        **5. Title of Article 5**

        * **Source:** Source of Article 5
        * **Date:** Date of Article 5
        * **Summary:** Summary of Article 5
        * **Key Points:**
        1. Key point 1:
            - Key details
            - Key details

        2. Key point 2
            - Key details
            - Key details
        
        3. Key point 3
            - Key details
            - Key details
        **Conclusion:**

        Conclusion

        ---

        Input Documents: {input_docs}
        Previous Report: {pre_report}


        Necessary Rules:
        - Summarize each input article sequentially
        - The output format of the report MUST follow the exact format of the output example
        - Use the actual article titles, dates, and sources from the input
        - Pay special attention to these keywords: {keywords}
        - The report MUST be written in Traditional Chinese
        - Every article Must have a summary and at least 3 key points
        - The content of the report MUST be generated according to the content in Input Documents
        - If Previous Report is provided, the new report MUST be generated based on Previous Report.
        - (Very Important) Only change the part of the Previous Report requested by the user, and the rest of parts of Previous Report not mentioned by the user MUST remain unchanged

        Report requirements:
        - Base content strictly on provided articles (no additional information)
        - Maintain objectivity (avoid speculation)
        - Use clear structure and logical organization
        - Highlight important data and key events
        - Include specific information from original text when appropriate


        Please begin generating the report:"""

    
    if not request_data:
        return {"error": "Conversation history is missing or empty."}
    
    # Initialize memory with proper parameters
    memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
    
    human = []
    target_date = ""
    number_of_news = 5
    keywords = ""
    industry = ""
    report = ""
    retrieved_article = [] # This will store the formatted articles
    request_counter = 0
    
    query = ""
    

    for conv in request_data:
        if request_counter == 0:
            # 'source' is not directly used for article content here, it's for passing back.
            # So we'll populate retrieved_article directly.
            target_date = conv.get("dateRange")
            number_of_news = conv.get("number")
            keywords = conv.get("keywords")
            industry = conv.get("industry")
        else:
            content = conv.get("content")
            human.append(content)
            # This save_context might need adjustment if you intend to truly use conversation memory for LLM
            # For this specific task, the prompt handles the "previous report" logic.
            memory.save_context({"input": human[-1]}, {"output": ""}) # Corrected 'input' key
        request_counter += 1

    llm = init_llm() # Ensure LLM is initialized
    
    if human:
        query = human[-1]

    previous_output_content = output_dir
    
    collection_name = f"{target_date}"
    vectorstore = init_vectorstore(collection_name=collection_name)
    
    if not previous_output_content:
        print("no output file")
        initial_prompt = f"Find {number_of_news} news about {keywords} that influence blockchain industry the most in {target_date}"
    
        diverse_docs = get_diverse_sources(vectorstore, initial_prompt, number_of_news)
        documents_text = "\n\n".join([doc.page_content for doc in diverse_docs])

        # Populate retrieved_article in the desired format
        for doc in diverse_docs:
            retrieved_article.append({"article_content": doc.page_content}) # Corrected format
        
        # Update the 'source' key in the first (system) conversation entry with the retrieved articles
        # This is for passing the articles back in the history for subsequent calls.
        request_data[0]["source"].append(retrieved_article) 
        print(retrieved_article) # For debugging

        summary_prompt = SUMMARY_PROMPT.format(
            keywords=', '.join(keywords),
            industry=', '.join(industry),
            input_docs=documents_text,
            pre_report=""
        )
        output = llm.invoke([
            SystemMessage(content=summary_prompt),
            HumanMessage(content="generate a blockchain monthly report")
        ])
        report = output.content
        print(report)
        
    else:
        print("output file exists")
        # Retrieve documents from the 'source' field of the system message in the request_data
        # This assumes 'request_data[0]["source"]' was populated in a previous call.
        
        # Ensure request_data[0]["source"] exists and is a list of dicts with "article_content"
        if request_data and request_data[0].get("source") and isinstance(request_data[0]["source"], list):
            documents_text = "\n\n".join([doc.get("article_content", "") for doc in request_data[0]["source"]])
            retrieved_article = request_data[0]["source"] # Use the existing retrieved articles for the return
        else:
            documents_text = "" # No previous articles found in history
            print("Warning: 'source' not found or invalid in conversation history for revision.")

        summary_prompt = SUMMARY_PROMPT.format(
            keywords=', '.join(keywords),
            input_docs=documents_text,
            pre_report = output_dir
        )
        output = llm.invoke([
            SystemMessage(content=summary_prompt),
            HumanMessage(content=query)
        ])
        report = output.content
        print(report)
        
    return retrieved_article, report


# --- Main simulation function ---

def main():
    # Create output directory if it doesn't exist
    output_dir = "../../outputs/test"
    os.makedirs(output_dir, exist_ok=True)
    
    # Initialize output file path
    output_file = os.path.join(output_dir, "initial.md")
    
    # Initialize history file path
    history_file = "../firstQuery.json"
    
    try:
        # Read history file
        with open(history_file, "r", encoding="utf-8") as file:
            history = json.load(file)
        
        # Read or create output file
        try:
            with open(output_file, "r", encoding="utf-8") as file:
                output = file.read()
        except FileNotFoundError:
            output = ""  # Initialize empty if file doesn't exist
            print(f"Creating new output file: {output_file}")
        
        # Process the revision request
        newHistory, response_1 = process_revision_request(history, output)
        
        print(newHistory)
        
        # Write the response to output file
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(response_1)
        
        # Update history file
        with open(history_file, 'w', encoding='utf-8') as f:
            json.dump(newHistory, f, ensure_ascii=False, indent=4)
            
        print(f"✅ Successfully processed revision request. Output saved to {output_file}")
        
    except FileNotFoundError as e:
        print(f"❌ Error: Could not find required file: {e}")
    except json.JSONDecodeError as e:
        print(f"❌ Error: Invalid JSON in history file: {e}")
    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}")

if __name__ == "__main__":
    main()