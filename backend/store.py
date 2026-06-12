import chromadb
from typing import Dict, List
from config import get_settings
from db import (
    init_db, save_source, load_sources, clear_sources,
    save_message, load_history, clear_history
)

settings = get_settings()

chroma_client = chromadb.PersistentClient(path=settings.chroma_path)

init_db()


def get_or_create_collection(session_id: str):
    collection_name = f"session_{session_id.replace('-', '_')}"
    return chroma_client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"},
    )


def add_source(session_id: str, source: dict):
    save_source(session_id, source)


def get_sources(session_id: str) -> List[dict]:
    return load_sources(session_id)


def get_history(session_id: str) -> List[dict]:
    return load_history(session_id)


def append_history(session_id: str, role: str, content: str):
    save_message(session_id, role, content)


def clear_session(session_id: str):
    collection_name = f"session_{session_id.replace('-', '_')}"
    try:
        chroma_client.delete_collection(collection_name)
    except Exception:
        pass
    clear_sources(session_id)
    clear_history(session_id)