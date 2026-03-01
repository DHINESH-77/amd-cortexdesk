from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models

from database import engine

# Create the database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="LocalAI Workspace API",
    description="Privacy-first offline AI productivity tool",
    version="1.0.0",
)

# Allow frontend to connect — covers any Vite port (5173, 5174, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import tasks, documents, meetings

app.include_router(tasks.router)
app.include_router(documents.router)
app.include_router(meetings.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to LocalAI Workspace Backend"}

