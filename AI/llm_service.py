import logging
from typing import List, Dict, Any, Optional
from groq import Groq

from config import config

logger = logging.getLogger(__name__)


class LLMService:
    """
    Service for generating responses using Groq API.
    Supports various Groq models with streaming capabilities.
    """
    
    def __init__(
        self,
        api_key: str = None,
        model: str = None,
        temperature: float = None,
        max_tokens: int = None
    ):
        self.api_key = api_key or config.GROQ_API_KEY
        self.model = model or config.GROQ_MODEL
        self.temperature = temperature if temperature is not None else config.GROQ_TEMPERATURE
        self.max_tokens = max_tokens or config.GROQ_MAX_TOKENS
        
        # Initialize Groq client
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize Groq client."""
        logger.info(f"Initializing Groq client with model: {self.model}")
        
        self.client = Groq(api_key=self.api_key)
        
        logger.info("Groq client initialized successfully")
    
    def generate(
        self,
        prompt: str,
        system_prompt: str = None,
        temperature: float = None,
        max_tokens: int = None,
        stop_sequences: List[str] = None
    ) -> str:
        """
        Generate a response using Groq API.
        
        Args:
            prompt: User prompt/query
            system_prompt: System instructions for the model
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens to generate
            stop_sequences: Sequences where generation should stop
        
        Returns:
            Generated text response
        """
        messages = []
        
        # Add system prompt if provided
        if system_prompt:
            messages.append({
                "role": "system",
                "content": system_prompt
            })
        
        # Add user prompt
        messages.append({
            "role": "user",
            "content": prompt
        })
        
        # Use instance defaults or override
        temp = temperature if temperature is not None else self.temperature
        max_tok = max_tokens or self.max_tokens
        
        try:
            logger.info(f"Generating response with model: {self.model}")
            
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temp,
                max_tokens=max_tok,
                stop=stop_sequences
            )
            
            response = completion.choices[0].message.content
            
            logger.info(f"Generated {len(response)} characters")
            return response
        
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            raise
    
    def generate_with_context(
        self,
        query: str,
        context: str,
        system_prompt: str = None,
        temperature: float = None,
        max_tokens: int = None
    ) -> str:
        """
        Generate a response using retrieved context (RAG).
        
        Args:
            query: User's question
            context: Retrieved context from vector database
            system_prompt: Optional system instructions
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
        
        Returns:
            Generated answer based on context
        """
        # Default RAG system prompt
        if system_prompt is None:
            system_prompt = """You are a helpful AI assistant. Answer the user's question based on the provided context.

Rules:
- Use only information from the context to answer
- If the context doesn't contain the answer, say so clearly
- Be concise and accurate
- Cite specific parts of the context when relevant"""
        
        # Build RAG prompt
        rag_prompt = f"""Context:
{context}

Question: {query}

Answer:"""
        
        return self.generate(
            prompt=rag_prompt,
            system_prompt=system_prompt,
            temperature=temperature,
            max_tokens=max_tokens
        )
    
    def generate_stream(
        self,
        prompt: str,
        system_prompt: str = None,
        temperature: float = None,
        max_tokens: int = None
    ):
        """
        Generate a streaming response using Groq API.
        
        Args:
            prompt: User prompt/query
            system_prompt: System instructions
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
        
        Yields:
            Text chunks as they are generated
        """
        messages = []
        
        if system_prompt:
            messages.append({
                "role": "system",
                "content": system_prompt
            })
        
        messages.append({
            "role": "user",
            "content": prompt
        })
        
        temp = temperature if temperature is not None else self.temperature
        max_tok = max_tokens or self.max_tokens
        
        try:
            logger.info(f"Starting streaming generation with model: {self.model}")
            
            stream = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temp,
                max_tokens=max_tok,
                stream=True
            )
            
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        
        except Exception as e:
            logger.error(f"Error in streaming generation: {str(e)}")
            raise
    
    def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = None,
        max_tokens: int = None
    ) -> str:
        """
        Multi-turn chat conversation.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
        
        Returns:
            Generated response
        """
        temp = temperature if temperature is not None else self.temperature
        max_tok = max_tokens or self.max_tokens
        
        try:
            logger.info(f"Processing chat with {len(messages)} messages")
            
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temp,
                max_tokens=max_tok
            )
            
            return completion.choices[0].message.content
        
        except Exception as e:
            logger.error(f"Error in chat: {str(e)}")
            raise