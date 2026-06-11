import google.generativeai as genai
import os
from typing import List

genai.configure(api_key=os.environ["GEMINI_API_KEY"])

def embed_texts(texts: List[str]) -> List[List[float]]:
    result = genai.embed_content(
        model="models/gemini-embedding-001",
        content=texts,
        task_type="retrieval_document",
    )
    return result["embedding"]


def embed_query(text: str) -> List[float]:
    result = genai.embed_content(
        model="models/gemini-embedding-001",
        content=text,
        task_type="retrieval_query",
    )
    return result["embedding"]