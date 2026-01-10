import hashlib
import logging
from functools import lru_cache
from typing import List, Optional
import numpy as np

logger = logging.getLogger(__name__)


class EmbeddingCache:
    """
    In-memory LRU cache for query embeddings.
    For production, replace with Redis.
    """
    
    def __init__(self, max_size: int = 1000):
        self.max_size = max_size
        self._cache = {}
        self._access_count = {}
        logger.info(f"Initialized embedding cache with max_size={max_size}")
    
    def _generate_key(self, query: str, model_name: str) -> str:
        """Generate cache key from query and model name."""
        content = f"{model_name}:{query}"
        return hashlib.md5(content.encode()).hexdigest()
    
    def get(self, query: str, model_name: str) -> Optional[List[float]]:
        """Retrieve cached embedding."""
        key = self._generate_key(query, model_name)
        
        if key in self._cache:
            self._access_count[key] = self._access_count.get(key, 0) + 1
            logger.debug(f"Cache HIT for query: {query[:50]}...")
            return self._cache[key]
        
        logger.debug(f"Cache MISS for query: {query[:50]}...")
        return None
    
    def set(self, query: str, model_name: str, embedding: List[float]):
        """Store embedding in cache."""
        if len(self._cache) >= self.max_size:
            self._evict_least_used()
        
        key = self._generate_key(query, model_name)
        self._cache[key] = embedding
        self._access_count[key] = 1
        logger.debug(f"Cache SET for query: {query[:50]}...")
    
    def _evict_least_used(self):
        """Remove least frequently used item."""
        if not self._cache:
            return
        
        least_used_key = min(self._access_count, key=self._access_count.get)
        del self._cache[least_used_key]
        del self._access_count[least_used_key]
        logger.debug(f"Evicted least used cache entry")
    
    def clear(self):
        """Clear all cached embeddings."""
        self._cache.clear()
        self._access_count.clear()
        logger.info("Cache cleared")
    
    def stats(self) -> dict:
        """Return cache statistics."""
        return {
            "size": len(self._cache),
            "max_size": self.max_size,
            "total_accesses": sum(self._access_count.values())
        }