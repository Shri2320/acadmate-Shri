import logging
from typing import List, Dict, Any, Optional
from pinecone import Pinecone

from config import config

logger = logging.getLogger(__name__)


class RetrievalService:
    """
    Service for retrieving similar documents from Pinecone.
    """
    
    def __init__(self, index_name: str = None):
        self.index_name = index_name or config.PINECONE_INDEX_NAME
        
        # Initialize Pinecone
        self._initialize_pinecone()
    
    def _initialize_pinecone(self):
        """Initialize Pinecone client and index."""
        logger.info("Initializing Pinecone client")
        
        self.pc = Pinecone()
        self.index = self.pc.Index(self.index_name)
        
        logger.info(f"Connected to Pinecone index: {self.index_name}")
    
    def query(
        self,
        query_vector: List[float],
        top_k: int = None,
        namespace: str = None,
        filter_metadata: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """
        Query Pinecone for similar vectors.
        
        Args:
            query_vector: Embedding vector
            top_k: Number of results to return
            namespace: Pinecone namespace to search
            filter_metadata: Metadata filters for pre-filtering
        
        Returns:
            List of matched documents with scores and metadata
        """
        top_k = top_k or config.DEFAULT_TOP_K
        
        # Validate top_k
        if top_k > config.MAX_TOP_K:
            logger.warning(f"top_k={top_k} exceeds MAX_TOP_K={config.MAX_TOP_K}, capping")
            top_k = config.MAX_TOP_K
        
        # Build query parameters
        query_params = {
            "vector": query_vector,
            "top_k": top_k,
            "include_metadata": True
        }
        
        if namespace:
            query_params["namespace"] = namespace
        
        if filter_metadata:
            query_params["filter"] = filter_metadata
        
        # Execute query
        logger.info(f"Querying Pinecone: top_k={top_k}, namespace={namespace}")
        response = self.index.query(**query_params)
        
        # Format results
        matches = []
        for match in response.get("matches", []):
            matches.append({
                "id": match["id"],
                "score": match["score"],
                "metadata": match.get("metadata", {})
            })
        
        logger.info(f"Retrieved {len(matches)} documents")
        return matches
    
    def get_index_stats(self) -> dict:
        """Get Pinecone index statistics."""
        stats = self.index.describe_index_stats()
        return {
            "dimension": stats.get("dimension"),
            "total_vector_count": stats.get("total_vector_count"),
            "namespaces": stats.get("namespaces", {})
        }