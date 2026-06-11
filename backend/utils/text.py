import re
from typing import List


def clean_text(text: str) -> str:
    """Remove excessive whitespace and normalize text."""
    text = re.sub(r"\s+", " ", text)
    text = text.strip()
    return text


def chunk_text(text: str, chunk_size: int = 1500, overlap: int = 150) -> List[str]:
    """Split text into overlapping chunks by word count."""
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunks.append(" ".join(words[start:end]))
        start += chunk_size - overlap
    return [c for c in chunks if c.strip()]


def truncate(text: str, max_chars: int = 3000) -> str:
    """Truncate text to max_chars."""
    return text[:max_chars] + "..." if len(text) > max_chars else text