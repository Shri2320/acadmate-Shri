# rag_pipeline.py

import os
from langchain_pinecone import PineconeVectorStore
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from typing import Dict, Any

class EnhancedRAGPipeline:
    def __init__(self):
        """
        Initializes the RAG pipeline using standard LangChain components.
        This is simpler, more reliable, and ensures model consistency.
        """
        # --- Configuration ---
        # Ensure the embedding model here is THE SAME as in your ingest.py script
        # self.embedding_model_name = "sentence-transformers/all-MiniLM-L6-v2"
        self.embedding_model_name="sentence-transformers/all-mpnet-base-v2"
        self.llm_model_name = "llama-3.1-8b-instant"
        self.pinecone_index = os.getenv("PINECONE_INDEX")

        if not self.pinecone_index:
            raise ValueError("PINECONE_INDEX not found in environment variables.")

        # 1. Initialize Embedding Model
        # This will use your HUGGING_FACE_HUB_TOKEN from the .env file
        self.embeddings = HuggingFaceEmbeddings(model_name=self.embedding_model_name)

        # 2. Initialize Pinecone Vector Store
        # This LangChain component handles the connection and retrieval
        self.vector_store = PineconeVectorStore.from_existing_index(
            index_name=self.pinecone_index,
            embedding=self.embeddings
        )
        self.retriever = self.vector_store.as_retriever()

        # 3. Initialize LLM
        self.llm = ChatGroq(model_name=self.llm_model_name)

        # 4. Define the RAG Prompt Template
        self.prompt_template = self._create_prompt_template()

        # 5. Build the RAG Chain
        self.rag_chain = self._build_rag_chain()

    def _create_prompt_template(self):
        template = """
        You are an expert AI Tutor. Use the provided context to answer the user's query comprehensively.
        The depth of your answer should be appropriate for the specified marks.

        CONTEXT:
        {context}

        QUESTION:
        {question}

        INSTRUCTIONS:
        - Analyze the context and the user's question carefully.
        - Construct a detailed answer that directly addresses the question.
        - Structure your answer logically with headings and bullet points for clarity.
        - Do NOT mention the context in your final answer. Just provide the answer.

        ANSWER:
        """
        return PromptTemplate(template=template, input_variables=["context", "question"])

    def _build_rag_chain(self):
        """Constructs the RAG chain using LangChain Expression Language (LCEL)."""
        
        def format_docs(docs):
            return "\n\n---\n\n".join(doc.page_content for doc in docs)

        return (
            {"context": self.retriever | format_docs, "question": RunnablePassthrough()}
            | self.prompt_template
            | self.llm
            | StrOutputParser()
        )

    def query_rag(self, user_query: str, marks: int = 5, **kwargs) -> Dict[str, Any]:
        """
        Executes the RAG query.
        The 'marks' and other kwargs are not directly used by this simplified chain
        but are kept for API compatibility.
        """
        # The retriever will automatically find the source documents
        answer = self.rag_chain.invoke(user_query)
        
        # Optionally, retrieve the source documents separately to return them
        source_documents = self.retriever.invoke(user_query)
        formatted_sources = [
            {"source": doc.metadata.get("source", "unknown"), "content": doc.page_content}
            for doc in source_documents
        ]

        return {
            "answer": answer,
            "source_documents": formatted_sources
        }