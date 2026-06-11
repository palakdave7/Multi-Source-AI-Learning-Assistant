import os 
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routers import ingest, chat

app = FastAPI(title="Samasocial AI Learning Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest.router, prefix="/api/ingest", tags=["ingest"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])

@app.get("/health")
def health():
    return {"status": "ok"}