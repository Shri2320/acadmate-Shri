import os
from dotenv import load_dotenv
from langchain.document_loaders import PyPDFDirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import Pinecone
import pinecone

# Load Environment Variables from .env file
load_dotenv()

# Read credentials and index name from .env
PINECONE_API_KEY = os.environ.get('PINECONE_API_KEY')
PINECONE_ENV = os.environ.get('PINECONE_ENV')
PINECONE_INDEX = os.environ.get('PINECONE_INDEX') # <-- Reads your index name

# --- Configuration ---
DATA_PATH = "data/"
EMBEDDINGS_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

def main():
    """
    Main function to load, split, and ingest documents into Pinecone.
    """
    # Check if all required environment variables are loaded
    if not all([PINECONE_API_KEY, PINECONE_ENV, PINECONE_INDEX]):
        print("Error: Missing required Pinecone credentials in .env file.")
        print("Please ensure PINECONE_API_KEY, PINECONE_ENV, and PINECONE_INDEX are set.")
        return

    # 1. Load documents
    print(f"Loading documents from {DATA_PATH}...")
    loader = PyPDFDirectoryLoader(DATA_PATH)
    documents = loader.load()
    if not documents:
        print(f"No documents found in the '{DATA_PATH}' directory.")
        return
    print(f"Loaded {len(documents)} document(s).")

    # 2. Split documents
    print("Splitting documents into chunks...")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    docs = text_splitter.split_documents(documents)
    print(f"Split into {len(docs)} chunks.")

    # 3. Create embeddings
    print(f"Creating embeddings using '{EMBEDDINGS_MODEL_NAME}'...")
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDINGS_MODEL_NAME)

    # 4. Initialize Pinecone
    print("Initializing Pinecone...")
    pinecone.init(
        api_key=PINECONE_API_KEY,
        environment=PINECONE_ENV
    )

    # 5. Ingest data into the index specified in your .env file
    print(f"Ingesting {len(docs)} chunks into index '{PINECONE_INDEX}'...")
    Pinecone.from_documents(docs, embeddings, index_name=PINECONE_INDEX)
    print("✅ Data ingestion complete!")

if __name__ == "__main__":
    main()