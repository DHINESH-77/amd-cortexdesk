from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
import json

from database import SessionLocal
import models
from services.ai_pipeline import ai_pipeline

router = APIRouter(prefix="/meetings", tags=["Meetings"])

# Connection manager for WebSockets
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

manager = ConnectionManager()

@router.websocket("/live")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    # We need a new DBSession per websocket lifecycle
    db = SessionLocal()
    
    try:
        # Create a new active meeting immediately
        meeting = models.Meeting(title="Live Meeting session", transcript="")
        db.add(meeting)
        db.commit()
        db.refresh(meeting)
        
        await manager.send_personal_message(json.dumps({
            "type": "info", 
            "message": f"Connected to Meeting {meeting.id}"
        }), websocket)
        
        while True:
            # Receive streaming audio transcript (mocked as text input)
            data = await websocket.receive_text()
            
            # Append transcript
            meeting.transcript += f" {data}"
            db.commit()
            
            # Run Live Extraction Pipeline
            extracted = ai_pipeline.extract_structured_data(data)
            assigned = ai_pipeline.assign_tasks(extracted)
            
            # Send real-time extraction results back
            response = {
                "type": "extraction",
                "extracted_tasks": [t.model_dump() for t in assigned.tasks],
                "decisions": assigned.decisions,
                "risks": assigned.risks
            }
            await manager.send_personal_message(json.dumps(response, default=str), websocket)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    finally:
        db.close()
