from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# ── Calendar / Event Schemas ───────────────────────────────────────────────

class CalendarEvent(BaseModel):
    date: str
    time: str
    duration: int
    notes: Optional[str] = None
    scheduledAt: Optional[str] = None

# ── Task Schemas ───────────────────────────────────────────────────────────

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = "To Do"
    owner: Optional[str] = "Unassigned"
    deadline: Optional[datetime] = None
    risk_level: Optional[str] = "Normal"
    source: Optional[str] = None
    calendar_event: Optional[Dict[str, Any]] = None

class TaskCreate(TaskBase):
    pass

class TaskResponse(TaskBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# ── Extraction / Pipeline Schemas ──────────────────────────────────────────

class ExtractionRequest(BaseModel):
    text: str

class StructuredSummary(BaseModel):
    title: Optional[str] = None
    overview: str
    key_points: Optional[List[str]] = []
    sentiment: Optional[str] = "Neutral"

class ExtractedData(BaseModel):
    tasks: List[TaskCreate] = []
    risks: List[str] = []
    decisions: List[str] = []
    summary: Optional[StructuredSummary] = None

# ── Document Schemas ───────────────────────────────────────────────────────

class DocumentBase(BaseModel):
    filename: str
    content: str

class DocumentCreate(DocumentBase):
    pass

class DocumentResponse(DocumentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# ── Meeting Schemas ────────────────────────────────────────────────────────

class MeetingBase(BaseModel):
    title: str
    transcript: str

class MeetingCreate(MeetingBase):
    pass

class MeetingResponse(MeetingBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
