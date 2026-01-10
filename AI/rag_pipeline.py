import logging
from typing import List, Dict, Any, Optional

from config import config
from embedding_service import EmbeddingService
from retrieval_service import RetrievalService
from llm_service import LLMService
from schema_service import SchemaService

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=config.LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


class RAGPipeline:
    """
    Main RAG pipeline orchestrating embedding and retrieval services.
    """
    
    def __init__(
        self,
        index_name: str = None,
        embedding_service: EmbeddingService = None,
        retrieval_service: RetrievalService = None,
        llm_service: LLMService = None
    ):
        """
        Initialize RAG pipeline.
        
        Args:
            index_name: Pinecone index name
            embedding_service: Optional pre-initialized embedding service
            retrieval_service: Optional pre-initialized retrieval service
            llm_service: Optional pre-initialized LLM service
        """
        self.index_name = index_name or config.PINECONE_INDEX_NAME
        
        # Initialize services
        self.embedding_service = embedding_service or EmbeddingService()
        self.retrieval_service = retrieval_service or RetrievalService(self.index_name)
        self.llm_service = llm_service or LLMService()
        
        logger.info("RAG Pipeline initialized")
    
    def retrieve(
        self,
        query: str,
        top_k: int = None,
        namespace: str = None,
        filter_metadata: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant documents for a query.
        
        Args:
            query: Search query
            top_k: Number of results
            namespace: Pinecone namespace
            filter_metadata: Metadata filters
        
        Returns:
            List of retrieved documents
        """
        # Generate embedding
        logger.info(f"Processing query: {query[:100]}...")
        query_vector = self.embedding_service.embed_single(query)
        
        # Retrieve from Pinecone
        documents = self.retrieval_service.query(
            query_vector=query_vector,
            top_k=top_k,
            namespace=namespace,
            filter_metadata=filter_metadata
        )
        
        return documents
    
    def retrieve_batch(
        self,
        queries: List[str],
        top_k: int = None,
        namespace: str = None,
        filter_metadata: Dict[str, Any] = None
    ) -> List[List[Dict[str, Any]]]:
        """
        Retrieve documents for multiple queries in batch.
        More efficient than individual queries.
        
        Args:
            queries: List of search queries
            top_k: Number of results per query
            namespace: Pinecone namespace
            filter_metadata: Metadata filters
        
        Returns:
            List of document lists (one per query)
        """
        logger.info(f"Processing batch of {len(queries)} queries")
        
        # Generate embeddings in batch
        query_vectors = self.embedding_service.embed_batch(queries)
        
        # Retrieve for each query
        all_results = []
        for i, query_vector in enumerate(query_vectors):
            logger.info(f"Retrieving for query {i+1}/{len(queries)}")
            documents = self.retrieval_service.query(
                query_vector=query_vector,
                top_k=top_k,
                namespace=namespace,
                filter_metadata=filter_metadata
            )
            all_results.append(documents)
        
        return all_results
    
    def build_context(
        self,
        documents: List[Dict[str, Any]],
        include_scores: bool = False,
        max_length: int = None
    ) -> str:
        """
        Build context string from retrieved documents.
        
        Args:
            documents: Retrieved documents
            include_scores: Whether to include similarity scores
            max_length: Maximum context length in characters
        
        Returns:
            Formatted context string
        """
        context_chunks = []
        current_length = 0
        
        for doc in documents:
            text = doc["metadata"].get("text", "")
            if not text:
                continue
            
            # Format chunk
            if include_scores:
                chunk = f"[Score: {doc['score']:.4f}]\n{text}"
            else:
                chunk = text
            
            # Check length limit
            if max_length:
                if current_length + len(chunk) > max_length:
                    break
                current_length += len(chunk)
            
            context_chunks.append(chunk)
        
        return "\n\n---\n\n".join(context_chunks)
    
    def run(
        self,
        query: str,
        top_k: int = None,
        namespace: str = None,
        filter_metadata: Dict[str, Any] = None,
        include_context: bool = True,
        include_scores: bool = False
    ) -> Dict[str, Any]:
        """
        Execute full RAG pipeline.
        
        Args:
            query: Search query
            top_k: Number of results
            namespace: Pinecone namespace
            filter_metadata: Metadata filters
            include_context: Whether to build context string
            include_scores: Whether to include scores in context
        
        Returns:
            Complete RAG result with query, documents, and context
        """
        # Retrieve documents
        documents = self.retrieve(
            query=query,
            top_k=top_k,
            namespace=namespace,
            filter_metadata=filter_metadata
        )
        
        # Build result
        result = {
            "query": query,
            "documents": documents,
            "num_results": len(documents),
            "model": self.embedding_service.model_name
        }
        
        # Add context if requested
        if include_context:
            result["context"] = self.build_context(
                documents=documents,
                include_scores=include_scores
            )
        
        return result
    
    def get_stats(self) -> Dict[str, Any]:
        """Get pipeline statistics."""
        return {
            "embedding": self.embedding_service.get_cache_stats(),
            "index": self.retrieval_service.get_index_stats()
        }
    
    def generate_answer(
        self,
        query: str,
        marks: int = 5,
        top_k: int = None,
        namespace: str = None,
        filter_metadata: Dict[str, Any] = None,
        custom_system_prompt: str = None,
        temperature: float = None,
        max_tokens: int = None,
        include_sources: bool = True
    ) -> Dict[str, Any]:
        """
        Complete RAG pipeline with schema-based LLM generation for exams.
        
        Args:
            query: User's question
            marks: Mark allocation (1, 2, 3, 5, 7, 10, 15)
            top_k: Number of documents to retrieve
            namespace: Pinecone namespace
            filter_metadata: Metadata filters
            custom_system_prompt: Override default schema-based prompt
            temperature: LLM temperature (overrides schema default)
            max_tokens: Maximum tokens (overrides schema default)
            include_sources: Whether to include source documents
        
        Returns:
            Dict containing query, answer, context, schema info, and sources
        """
        logger.info(f"Generating {marks}-mark answer for query: {query[:100]}...")
        
        # Validate marks
        marks = SchemaService.validate_marks(marks)
        
        # Get schema configuration
        schema = SchemaService.get_schema(marks)
        
        # Use schema defaults if not provided
        if temperature is None:
            temperature = SchemaService.get_temperature(marks)
        
        if max_tokens is None:
            max_tokens = SchemaService.get_max_tokens(marks)
        
        # Retrieve relevant documents
        documents = self.retrieve(
            query=query,
            top_k=top_k,
            namespace=namespace,
            filter_metadata=filter_metadata
        )
        
        # Build context
        context = self.build_context(documents=documents)
        
        # Build schema-based prompts
        if custom_system_prompt:
            system_prompt = custom_system_prompt
            user_prompt = f"Context: {context}\n\nQuestion: {query}"
        else:
            system_prompt = SchemaService.build_system_prompt(marks)
            user_prompt = SchemaService.build_user_prompt(query, context, marks)
        
        # Generate answer using LLM
        answer = self.llm_service.generate(
            prompt=user_prompt,
            system_prompt=system_prompt,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        result = {
            "query": query,
            "answer": answer,
            "marks": marks,
            "schema": {
                "name": schema['name'],
                "structure": schema['structure'],
                "max_tokens": max_tokens,
                "temperature": temperature
            },
            "context": context,
            "model": {
                "embedding": self.embedding_service.model_name,
                "llm": self.llm_service.model
            }
        }
        
        if include_sources:
            result["sources"] = documents
        
        return result