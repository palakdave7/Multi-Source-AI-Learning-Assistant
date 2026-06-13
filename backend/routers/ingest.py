from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from services.sources import process_youtube, process_pdf, process_pptx, process_url
from services.retrieval import index_chunks
from services.llm import generate_summary
from store import add_source, get_sources
from logger import get_logger
import uuid

router = APIRouter()
logger = get_logger("ingest")

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def validate_url(url: str):
    if not url.startswith(("http://", "https://")):
        raise HTTPException(
            status_code=400,
            detail="Invalid URL. Must start with http:// or https://",
        )


@router.post("/youtube")
async def ingest_youtube(session_id: str = Form(...), url: str = Form(...)):
    logger.info(f"Ingesting YouTube URL: {url} for session: {session_id}")
    if "youtube.com" not in url and "youtu.be" not in url:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL.")
    try:
        source = process_youtube(url)
    except Exception as e:
        logger.error(f"YouTube ingestion failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))

    source_index = len(get_sources(session_id))
    chunk_count = len(source["chunks"])
    source["summary"] = generate_summary(source["summary_snippet"])
    source["chunk_count"] = chunk_count
    chunks_data = source.pop("chunks")
    source_id = add_source(session_id, source)
    index_chunks(session_id, chunks_data, source_id, source_index)
    logger.info(f"YouTube source added for session: {session_id} | chunks: {chunk_count}")
    return {"source": source}


@router.post("/pdf")
async def ingest_pdf(session_id: str = Form(...), file: UploadFile = File(...)):
    logger.info(f"Ingesting PDF: {file.filename} for session: {session_id}")
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB.")
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF files are accepted.")
    try:
        source = process_pdf(content, file.filename)
    except Exception as e:
        logger.error(f"PDF ingestion failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))

    source_index = len(get_sources(session_id))
    chunk_count = len(source["chunks"])
    source["summary"] = generate_summary(source["summary_snippet"])
    source["chunk_count"] = chunk_count
    chunks_data = source.pop("chunks")
    source_id = add_source(session_id, source)
    index_chunks(session_id, chunks_data, source_id, source_index)
    logger.info(f"PDF source added for session: {session_id} | chunks: {chunk_count}")
    return {"source": source}


@router.post("/pptx")
async def ingest_pptx(session_id: str = Form(...), file: UploadFile = File(...)):
    logger.info(f"Ingesting PPTX: {file.filename} for session: {session_id}")
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB.")
    if not file.filename.endswith(".pptx"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only PPTX files are accepted.")
    try:
        source = process_pptx(content, file.filename)
    except Exception as e:
        logger.error(f"PPTX ingestion failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))

    source_index = len(get_sources(session_id))
    chunk_count = len(source["chunks"])
    source["summary"] = generate_summary(source["summary_snippet"])
    source["chunk_count"] = chunk_count
    chunks_data = source.pop("chunks")
    source_id = add_source(session_id, source)
    index_chunks(session_id, chunks_data, source_id, source_index)
    logger.info(f"PPTX source added for session: {session_id} | chunks: {chunk_count}")
    return {"source": source}


@router.post("/url")
async def ingest_url(session_id: str = Form(...), url: str = Form(...)):
    logger.info(f"Ingesting URL: {url} for session: {session_id}")
    validate_url(url)
    try:
        source = process_url(url)
    except Exception as e:
        logger.error(f"URL ingestion failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))

    source_index = len(get_sources(session_id))
    chunk_count = len(source["chunks"])
    source["summary"] = generate_summary(source["summary_snippet"])
    source["chunk_count"] = chunk_count
    chunks_data = source.pop("chunks")
    source_id = add_source(session_id, source)
    index_chunks(session_id, chunks_data, source_id, source_index)
    logger.info(f"URL source added for session: {session_id} | chunks: {chunk_count}")
    return {"source": source}


@router.get("/sources")
def get_session_sources(session_id: str):
    return {"sources": get_sources(session_id)}


@router.post("/new-session")
def new_session():
    from db import create_session
    session_id = create_session()
    logger.info(f"New session created: {session_id}")
    return {"session_id": session_id}

