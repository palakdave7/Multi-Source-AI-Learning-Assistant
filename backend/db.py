from supabase_client import supabase
from typing import List, Dict
import uuid


def create_session() -> str:
    session_id = str(uuid.uuid4())
    supabase.table("sessions").insert({"id": session_id}).execute()
    return session_id


def save_source(session_id: str, source: dict) -> str:
    result = supabase.table("sources").insert({
        "session_id": session_id,
        "type": source.get("type"),
        "label": source.get("label"),
        "summary": source.get("summary"),
        "summary_snippet": source.get("summary_snippet"),
        "url": source.get("url"),
        "chunk_count": source.get("chunk_count"),
    }).execute()
    return result.data[0]["id"]


def load_sources(session_id: str) -> List[dict]:
    result = supabase.table("sources").select("*").eq("session_id", session_id).execute()
    return result.data


def clear_sources(session_id: str):
    supabase.table("sources").delete().eq("session_id", session_id).execute()


def save_message(session_id: str, role: str, content: str):
    supabase.table("messages").insert({
        "session_id": session_id,
        "role": role,
        "content": content,
    }).execute()


def load_history(session_id: str) -> List[Dict]:
    result = supabase.table("messages").select("role, content").eq("session_id", session_id).order("created_at").execute()
    return result.data


def clear_history(session_id: str):
    supabase.table("messages").delete().eq("session_id", session_id).execute()


def init_db():
    pass  # No-op, Supabase tables already created via SQL editor