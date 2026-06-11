from store import get_or_create_collection
from services.embeddings import embed_texts, embed_query
from typing import List


def index_chunks(session_id: str, chunks: List[dict], source_index: int):
    """Embed and store chunks in ChromaDB for a session."""
    collection = get_or_create_collection(session_id)
    texts = [c["text"] for c in chunks]
    refs = [c["ref"] for c in chunks]

    embeddings = embed_texts(texts)

    ids = [f"src{source_index}_chunk{i}" for i in range(len(chunks))]
    metadatas = [{"ref": ref, "source_index": source_index} for ref in refs]

    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=texts,
        metadatas=metadatas,
    )


def retrieve_chunks(session_id: str, query: str, top_k: int = 5) -> List[dict]:
    """Retrieve top-k relevant chunks for a query."""
    collection = get_or_create_collection(session_id)
    count = collection.count()
    if count == 0:
        return []

    query_embedding = embed_query(query)
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(top_k, count),
        include=["documents", "metadatas"],
    )

    chunks = []
    for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
        chunks.append({"text": doc, "ref": meta["ref"]})
    return chunks