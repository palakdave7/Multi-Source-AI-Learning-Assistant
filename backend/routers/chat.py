from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services.retrieval import retrieve_chunks
from services.llm import stream_answer, generate_quiz, generate_summary, generate_flashcards
from store import get_history, append_history, get_sources
from logger import get_logger
import json

router = APIRouter()
logger = get_logger("chat")


class ChatRequest(BaseModel):
    session_id: str
    message: str


class QuizRequest(BaseModel):
    session_id: str


class FlashcardRequest(BaseModel):
    session_id: str


@router.post("/")
async def chat(req: ChatRequest):
    logger.info(f"Chat | session: {req.session_id} | message: {req.message[:50]}")
    history = get_history(req.session_id)
    chunks = retrieve_chunks(req.session_id, req.message, top_k=5)
    logger.info(f"Retrieved {len(chunks)} chunks")

    def generate():
        full_response = ""
        for token in stream_answer(req.message, chunks, history):
            full_response += token
            yield f"data: {json.dumps({'token': token})}\n\n"
        append_history(req.session_id, "user", req.message)
        append_history(req.session_id, "assistant", full_response)
        refs = list({c["ref"] for c in chunks})
        yield f"data: {json.dumps({'done': True, 'refs': refs})}\n\n"
        logger.info(f"Chat complete | session: {req.session_id}")

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.post("/quiz")
async def quiz(req: QuizRequest):
    logger.info(f"Quiz | session: {req.session_id}")
    sources = get_sources(req.session_id)
    if not sources:
        return {"quiz": "No sources loaded yet."}
    chunks = retrieve_chunks(req.session_id, "key concepts topics main ideas", top_k=8)
    if not chunks:
        combined = " ".join(s.get("summary_snippet", "") for s in sources)
    else:
        combined = "\n\n".join(f"[{c['ref']}]\n{c['text']}" for c in chunks)
    return {"quiz": generate_quiz(combined)}


@router.post("/flashcards")
async def flashcards(req: FlashcardRequest):
    logger.info(f"Flashcards | session: {req.session_id}")
    sources = get_sources(req.session_id)
    if not sources:
        return {"flashcards": []}
    chunks = retrieve_chunks(req.session_id, "key concepts definitions terms", top_k=8)
    if not chunks:
        combined = " ".join(s.get("summary_snippet", "") for s in sources)
    else:
        combined = "\n\n".join(f"[{c['ref']}]\n{c['text']}" for c in chunks)
    cards = generate_flashcards(combined)
    return {"flashcards": cards}


@router.get("/history")
def history(session_id: str):
    return {"history": get_history(session_id)}