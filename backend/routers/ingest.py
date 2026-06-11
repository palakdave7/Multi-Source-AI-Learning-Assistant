from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from services.sources import process_youtube, process_pdf, process_pptx, process_url
from services.retrieval import index_chunks
from services.llm import generate_summary
from store import add_source, get_sources
from logger import get_logger
import uuid

router = APIRouter()
logger = get_logger("ingest")


@router.post("/youtube")
async def ingest_youtube(session_id: str = Form(...), url: str = Form(...)):
    logger.info(f"Ingesting YouTube URL: {url} for session: {session_id}")
    try:
        source = process_youtube(url)
    except Exception as e:
        logger.error(f"YouTube ingestion failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    source_index = len(get_sources(session_id))
    index_chunks(session_id, source["chunks"], source_index)
    source["summary"] = generate_summary(source["summary_snippet"])
    source.pop("chunks")
    add_source(session_id, source)
    logger.info(f"YouTube source added for session: {session_id}")
    return {"source": source}


@router.post("/pdf")
async def ingest_pdf(session_id: str = Form(...), file: UploadFile = File(...)):
    logger.info(f"Ingesting PDF: {file.filename} for session: {session_id}")
    content = await file.read()
    try:
        source = process_pdf(content, file.filename)
    except Exception as e:
        logger.error(f"PDF ingestion failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    source_index = len(get_sources(session_id))
    index_chunks(session_id, source["chunks"], source_index)
    source["summary"] = generate_summary(source["summary_snippet"])
    source.pop("chunks")
    add_source(session_id, source)
    logger.info(f"PDF source added for session: {session_id}")
    return {"source": source}


@router.post("/pptx")
async def ingest_pptx(session_id: str = Form(...), file: UploadFile = File(...)):
    logger.info(f"Ingesting PPTX: {file.filename} for session: {session_id}")
    content = await file.read()
    try:
        source = process_pptx(content, file.filename)
    except Exception as e:
        logger.error(f"PPTX ingestion failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    source_index = len(get_sources(session_id))
    index_chunks(session_id, source["chunks"], source_index)
    source["summary"] = generate_summary(source["summary_snippet"])
    source.pop("chunks")
    add_source(session_id, source)
    logger.info(f"PPTX source added for session: {session_id}")
    return {"source": source}


@router.post("/url")
async def ingest_url(session_id: str = Form(...), url: str = Form(...)):
    logger.info(f"Ingesting URL: {url} for session: {session_id}")
    try:
        source = process_url(url)
    except Exception as e:
        logger.error(f"URL ingestion failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    source_index = len(get_sources(session_id))
    index_chunks(session_id, source["chunks"], source_index)
    source["summary"] = generate_summary(source["summary_snippet"])
    source.pop("chunks")
    add_source(session_id, source)
    logger.info(f"URL source added for session: {session_id}")
    return {"source": source}


@router.get("/sources")
def get_session_sources(session_id: str):
    return {"sources": get_sources(session_id)}


@router.post("/new-session")
def new_session():
    session_id = str(uuid.uuid4())
    logger.info(f"New session created: {session_id}")
    return {"session_id": session_id}