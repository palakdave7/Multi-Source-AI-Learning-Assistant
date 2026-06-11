"""
In-memory store for:
- ChromaDB collections (per session)
- Source metadata (per session)
- Conversation history (per session)
"""
import chromadb
from typing import Dict, List

# Global ChromaDB client (in-memory)
chroma_client = chromadb.Client()

# session_id -> list of source metadata dicts
session_sources: Dict[str, List[dict]] = {}

# session_id -> list of {role, content} dicts
session_history: Dict[str, List[dict]] = {}


def get_or_create_collection(session_id: str):
    collection_name = f"session_{session_id.replace('-', '_')}"
    return chroma_client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"},
    )


def add_source(session_id: str, source: dict):
    if session_id not in session_sources:
        session_sources[session_id] = []
    session_sources[session_id].append(source)


def get_sources(session_id: str) -> List[dict]:
    return session_sources.get(session_id, [])


def get_history(session_id: str) -> List[dict]:
    return session_history.get(session_id, [])


def append_history(session_id: str, role: str, content: str):
    if session_id not in session_history:
        session_history[session_id] = []
    session_history[session_id].append({"role": role, "content": content})


def clear_session(session_id: str):
    collection_name = f"session_{session_id.replace('-', '_')}"
    try:
        chroma_client.delete_collection(collection_name)
    except Exception:
        pass
    session_sources.pop(session_id, None)
    session_history.pop(session_id, None)