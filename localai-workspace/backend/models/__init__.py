from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
import datetime

from database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    status = Column(String, default="To Do") # To Do, In Progress, Done
    owner = Column(String, nullable=True)
    deadline = Column(DateTime, nullable=True)
    risk_level = Column(String, nullable=True)
    source = Column(String, nullable=True)
    
    # Store calendar events as JSON for flexibility
    # Contains: { date, time, duration, notes, scheduledAt }
    calendar_event = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    transcript = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
