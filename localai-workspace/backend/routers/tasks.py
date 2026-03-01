from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models
import schemas
from services.ai_pipeline import ai_pipeline

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("/", response_model=List[schemas.TaskResponse])
def read_tasks(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    tasks = db.query(models.Task).offset(skip).limit(limit).all()
    return tasks

@router.post("/", response_model=schemas.TaskResponse)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db)):
    db_task = models.Task(**task.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

from fastapi import UploadFile, File

@router.post("/extract/file", response_model=schemas.ExtractedData)
async def extract_from_file(file: UploadFile = File(...)):
    """
    Reads file content, cleans it up, generates structured summary, and extracts actionable items.
    """
    content = await file.read()
    text = content.decode("utf-8", errors="ignore")
    
    extracted = ai_pipeline.extract_structured_data(text)
    assigned = ai_pipeline.assign_tasks(extracted)
    return assigned

@router.post("/extract", response_model=schemas.ExtractedData)
def extract_from_text(req: schemas.ExtractionRequest):
    """
    Takes raw text, extracts structured data, and automatically assigns attributes.
    """
    extracted = ai_pipeline.extract_structured_data(req.text)
    assigned = ai_pipeline.assign_tasks(extracted)
    return assigned

@router.put("/{task_id}", response_model=schemas.TaskResponse)
def update_task(task_id: int, task_update: schemas.TaskCreate, db: Session = Depends(get_db)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    for key, value in task_update.model_dump().items():
        setattr(db_task, key, value)
        
    db.commit()
    db.refresh(db_task)
    return db_task

@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(db_task)
    db.commit()
