# crow.py

import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# ✅ Load environment variables from .env file
load_dotenv()

# 🧠 Load Groq LLM (LLaMA3 70B)
# It will automatically find the GROQ_API_KEY from your .env file
llm = ChatGroq(
    model_name="Llama-3.3-70B-Versatile"
)

# 📘 Define the Crow-style prompt
template = """You are Crow, an academic assistant for first-year engineering students at JSSSTU, Mysuru.
Your goal is to answer only the specific question asked by the user, using concise, textbook-like language.

Rules:
- Don't provide extra explanation unless asked.
- If the concept can be remembered using a trick or acronym (e.g., VIBGYOR for rainbow colors), include it.
- Never make up content or examples unless you are sure.
- Keep your answer under 80 words unless the question demands more.
- Avoid repetition. Be direct.

Question: {question}
"""
prompt = ChatPromptTemplate.from_template(template)

# 🔗 **FIX:** Build the chain using the modern pipe syntax
# This replaces the deprecated LLMChain
crow_chain = prompt | llm | StrOutputParser()

# 🔁 Function to call from API
def run_crow_chain(query: str) -> dict:
    # Use .invoke and pass the input as a dictionary
    result = crow_chain.invoke({"question": query})
    return {"response": result}