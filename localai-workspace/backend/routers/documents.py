from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List
import os

from database import get_db
import models
import schemas
from vector_store import vector_store
from services.ai_pipeline import ai_pipeline

router = APIRouter(prefix="/documents", tags=["Documents"])

# Supported text-based MIME types and extensions for extraction
TEXT_EXTENSIONS = {".txt", ".md", ".csv", ".eml", ".log", ".py", ".json", ".xml", ".html"}
BINARY_EXTENSIONS = {".pdf", ".docx", ".doc", ".png", ".jpg", ".jpeg", ".webp"}


def decode_file_content(raw_bytes: bytes, filename: str) -> str:
    """
    Safely decode raw bytes to a string.
    For text files: decode with UTF-8 (replacing unreadable chars).
    For binary/image files: return a placeholder describing the file 
    (real OCR/PDF parsing would go here).
    """
    ext = os.path.splitext(filename)[1].lower()

    if ext in BINARY_EXTENSIONS:
        # In production, you'd run OCR (pytesseract) or PDF parser (pdfplumber) here
        return (
            f"[Binary file: {filename}]\n"
            f"This file type ({ext}) requires OCR or PDF parsing which runs locally. "
            f"File size: {len(raw_bytes)} bytes. "
            f"For now, task extraction will use the filename and metadata as context."
        )

    # For all text-based files, decode safely
    for encoding in ("utf-8", "latin-1", "cp1252"):
        try:
            return raw_bytes.decode(encoding)
        except (UnicodeDecodeError, ValueError):
            continue

    # Last resort: replace undecodable bytes
    return raw_bytes.decode("utf-8", errors="replace")


@router.post("/upload", response_model=schemas.DocumentResponse)
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Upload a document (text, PDF, image, etc.).
    Saves to database, chunks and indexes in vector store.
    """
    try:
        raw_bytes = await file.read()

        if len(raw_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        if len(raw_bytes) > 10 * 1024 * 1024:  # 10 MB limit
            raise HTTPException(status_code=413, detail="File too large. Max 10MB.")

        text_content = decode_file_content(raw_bytes, file.filename or "unknown")

        # Save to DB
        db_doc = models.Document(filename=file.filename, content=text_content)
        db.add(db_doc)
        db.commit()
        db.refresh(db_doc)

        # Chunk by double newline (paragraphs), filter empties
        chunks = [c.strip() for c in text_content.split("\n\n") if c.strip()]
        if not chunks:
            chunks = [text_content[:500]]  # fallback — first 500 chars as one chunk

        # Prepend filename for retrieval context
        context_chunks = [f"[File: {file.filename}] {chunk}" for chunk in chunks]

        # Add to FAISS Vector Store
        vector_store.add_texts(context_chunks)

        return db_doc

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")


@router.post("/upload/extract", response_model=schemas.ExtractedData)
async def upload_and_extract(file: UploadFile = File(...)):
    """
    Upload a document AND immediately run the AI extraction pipeline on it.
    Returns structured tasks, decisions, risks, and summary.
    """
    try:
        raw_bytes = await file.read()

        if len(raw_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        text_content = decode_file_content(raw_bytes, file.filename or "unknown")

        extracted = ai_pipeline.extract_structured_data(text_content)
        assigned = ai_pipeline.assign_tasks(extracted)
        return assigned

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")


@router.get("/", response_model=List[schemas.DocumentResponse])
def list_documents(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    docs = db.query(models.Document).offset(skip).limit(limit).all()
    return docs


@router.delete("/{doc_id}", status_code=204)
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(doc)
    db.commit()


@router.post("/query")
def query_documents(query: schemas.ExtractionRequest):
    results = vector_store.similarity_search(query.text, k=3)

    if not results:
        return {
            "answer": "I don't have enough context in the uploaded documents to answer that.",
            "references": []
        }

    context_str = "\n".join(results)
    answer = (
        f"Based on the provided documents:\n\n{context_str}\n\n"
        "(This is a simulated RAG response using mock FAISS embeddings.)"
    )

    return {"answer": answer, "references": results}
