from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from services.sources import process_youtube, process_pdf, process_pptx, process_url
from services.retrieval import index_chunks
from services.llm import generate_summary
from store import add_source, get_sources
import uuid

router = APIRouter()


@router.post("/youtube")
async def ingest_youtube(session_id: str = Form(...), url: str = Form(...)):
    try:
        source = process_youtube(url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    source_index = len(get_sources(session_id))
    index_chunks(session_id, source["chunks"], source_index)
    source["summary"] = generate_summary(source["summary_snippet"])
    source.pop("chunks")
    add_source(session_id, source)
    return {"source": source}


@router.post("/pdf")
async def ingest_pdf(session_id: str = Form(...), file: UploadFile = File(...)):
    content = await file.read()
    try:
        source = process_pdf(content, file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    source_index = len(get_sources(session_id))
    index_chunks(session_id, source["chunks"], source_index)
    source["summary"] = generate_summary(source["summary_snippet"])
    source.pop("chunks")
    add_source(session_id, source)
    return {"source": source}


@router.post("/pptx")
async def ingest_pptx(session_id: str = Form(...), file: UploadFile = File(...)):
    content = await file.read()
    try:
        source = process_pptx(content, file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    source_index = len(get_sources(session_id))
    index_chunks(session_id, source["chunks"], source_index)
    source["summary"] = generate_summary(source["summary_snippet"])
    source.pop("chunks")
    add_source(session_id, source)
    return {"source": source}


@router.post("/url")
async def ingest_url(session_id: str = Form(...), url: str = Form(...)):
    try:
        source = process_url(url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    source_index = len(get_sources(session_id))
    index_chunks(session_id, source["chunks"], source_index)
    source["summary"] = generate_summary(source["summary_snippet"])
    source.pop("chunks")
    add_source(session_id, source)
    return {"source": source}


@router.get("/sources")
def get_session_sources(session_id: str):
    return {"sources": get_sources(session_id)}


@router.post("/new-session")
def new_session():
    return {"session_id": str(uuid.uuid4())}