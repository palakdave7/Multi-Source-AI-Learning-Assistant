from services.embeddings import embed_texts, embed_query
from supabase_client import supabase
from typing import List
from config import get_settings

settings = get_settings()


def index_chunks(session_id: str, chunks: List[dict], source_id: str, source_index: int):
    texts = [c["text"] for c in chunks]
    refs = [c["ref"] for c in chunks]
    embeddings = embed_texts(texts)

    rows = []
    for text, ref, embedding in zip(texts, refs, embeddings):
        rows.append({
            "session_id": session_id,
            "source_id": source_id,
            "source_index": source_index,
            "text": text,
            "ref": ref,
            "embedding": embedding,
        })

    # Insert in batches of 50 to avoid payload size issues
    for i in range(0, len(rows), 50):
        batch = rows[i:i + 50]
        supabase.table("chunks").insert(batch).execute()


def retrieve_chunks(session_id: str, query: str, top_k: int = None) -> List[dict]:
    top_k = top_k or settings.top_k
    query_embedding = embed_query(query)

    result = supabase.rpc("match_chunks", {
        "query_embedding": query_embedding,
        "match_session_id": session_id,
        "match_count": top_k,
    }).execute()

    return [{"text": r["text"], "ref": r["ref"]} for r in result.data]