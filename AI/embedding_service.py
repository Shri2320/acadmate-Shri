import logging
from typing import List, Union
from sentence_transformers import SentenceTransformer

from config import config
from cache_manager import EmbeddingCache

logger = logging.getLogger(__name__)


class EmbeddingService:
    """
    Service for generating embeddings with caching support.
    Loaded once at application startup.
    """
    
    def __init__(
        self,
        model_name: str = None,
        device: str = None,
        enable_cache: bool = None
    ):
        self.model_name = model_name or config.EMBEDDING_MODEL_NAME
        self.device = device or config.EMBEDDING_DEVICE
        self.enable_cache = enable_cache if enable_cache is not None else config.ENABLE_CACHE
        
        # Initialize cache
        if self.enable_cache:
            self.cache = EmbeddingCache(max_size=config.CACHE_MAX_SIZE)
        else:
            self.cache = None
        
        # Load model (happens once)
        self._load_model()
    
    def _load_model(self):
        """Load the embedding model."""
        logger.info(f"Loading embedding model: {self.model_name}")
        logger.info(f"Device: {self.device}")
        
        self.model = SentenceTransformer(
            self.model_name,
            device=self.device
        )
        
        logger.info("Embedding model loaded successfully")
    
    def embed_single(self, query: str) -> List[float]:
        """
        Generate embedding for a single query.
        Uses cache if enabled.
        """
        # Check cache first
        if self.cache:
            cached_embedding = self.cache.get(query, self.model_name)
            if cached_embedding is not None:
                return cached_embedding
        
        # Generate embedding
        embedding = self.model.encode(
            query,
            normalize_embeddings=config.NORMALIZE_EMBEDDINGS,
            show_progress_bar=False
        )
        
        embedding_list = embedding.tolist()
        
        # Store in cache
        if self.cache:
            self.cache.set(query, self.model_name, embedding_list)
        
        return embedding_list
    
    def embed_batch(self, queries: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple queries in batch.
        Much faster than individual encoding.
        """
        logger.info(f"Batch encoding {len(queries)} queries")
        
        embeddings = self.model.encode(
            queries,
            normalize_embeddings=config.NORMALIZE_EMBEDDINGS,
            batch_size=config.EMBEDDING_BATCH_SIZE,
            show_progress_bar=False
        )
        
        return [emb.tolist() for emb in embeddings]
    
    def get_cache_stats(self) -> dict:
        """Return cache statistics."""
        if self.cache:
            return self.cache.stats()
        return {"cache_enabled": False}
    
    def clear_cache(self):
        """Clear the embedding cache."""
        if self.cache:
            self.cache.clear()
            logger.info("Embedding cache cleared")