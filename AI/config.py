import os
from typing import Optional

from dotenv import load_dotenv
load_dotenv()

class Config:
    """
    Centralized configuration for RAG pipeline.
    """
    
    # Pinecone settings
    PINECONE_INDEX_NAME: str = os.getenv("PINECONE_INDEX_NAME")
    PINECONE_NAMESPACE: Optional[str] = os.getenv("PINECONE_NAMESPACE", None)
    
    # Embedding model settings
    EMBEDDING_MODEL_NAME: str = "sentence-transformers/all-mpnet-base-v2"
    EMBEDDING_DEVICE: str = "cpu"  # Change to "cuda" for GPU
    EMBEDDING_BATCH_SIZE: int = 32
    NORMALIZE_EMBEDDINGS: bool = True
    
    # Retrieval settings
    DEFAULT_TOP_K: int = 5
    MAX_TOP_K: int = 20
    
    # Cache settings
    ENABLE_CACHE: bool = True
    CACHE_TTL: int = 3600  # 1 hour
    CACHE_MAX_SIZE: int = 1000
    
    # API settings
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_WORKERS: int = 4
    
    # Groq LLM settings
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    GROQ_TEMPERATURE: float = float(os.getenv("GROQ_TEMPERATURE", "0.7"))
    GROQ_MAX_TOKENS: int = int(os.getenv("GROQ_MAX_TOKENS", "1024"))
    
    # Logging
    LOG_LEVEL: str = "INFO"


config = Config()