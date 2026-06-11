from pydantic import BaseModel
from typing import Optional, List


class ChatRequest(BaseModel):
    session_id: str
    message: str


class QuizRequest(BaseModel):
    session_id: str


class FlashcardRequest(BaseModel):
    session_id: str


class SourceResponse(BaseModel):
    type: str
    label: str
    summary: Optional[str] = None
    summary_snippet: Optional[str] = None
    url: Optional[str] = None


class ChunkResponse(BaseModel):
    text: str
    ref: str


class SessionResponse(BaseModel):
    session_id: str


class HealthResponse(BaseModel):
    status: str
    version: str