from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services.retrieval import retrieve_chunks
from services.llm import stream_answer, generate_quiz, generate_summary
from store import get_history, append_history, get_sources
import json

router = APIRouter()


class ChatRequest(BaseModel):
    session_id: str
    message: str


class QuizRequest(BaseModel):
    session_id: str


@router.post("/")
async def chat(req: ChatRequest):
    history = get_history(req.session_id)
    chunks = retrieve_chunks(req.session_id, req.message, top_k=5)

    def generate():
        full_response = ""
        for token in stream_answer(req.message, chunks, history):
            full_response += token
            yield f"data: {json.dumps({'token': token})}\n\n"
        append_history(req.session_id, "user", req.message)
        append_history(req.session_id, "assistant", full_response)
        # Send source refs used
        refs = list({c["ref"] for c in chunks})
        yield f"data: {json.dumps({'done': True, 'refs': refs})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.post("/quiz")
async def quiz(req: QuizRequest):
    sources = get_sources(req.session_id)
    if not sources:
        return {"quiz": "No sources loaded yet."}
    combined = " ".join(s.get("summary_snippet", "") for s in sources)
    return {"quiz": generate_quiz(combined)}


@router.get("/history")
def history(session_id: str):
    return {"history": get_history(session_id)}