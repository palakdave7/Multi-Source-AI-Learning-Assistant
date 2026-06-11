from sentence_transformers import SentenceTransformer
from typing import List

# Loads once, stays in memory — fast after first load
_model = SentenceTransformer("all-MiniLM-L6-v2")  # 80MB, free, local


def embed_texts(texts: List[str]) -> List[List[float]]:
    return _model.encode(texts, show_progress_bar=False).tolist()


def embed_query(text: str) -> List[float]:
    return _model.encode(text, show_progress_bar=False).tolist()