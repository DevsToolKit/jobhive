from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class SessionStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class Session(BaseModel):
    id: str
    search_term: str
    location: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]
    status: SessionStatus
    total_jobs: int = 0
    config: dict
    error_message: Optional[str] = None
    
    class Config:
        use_enum_values = True

class SessionSummary(BaseModel):
    """Lightweight session info for listing"""
    id: str
    search_term: str
    location: Optional[str]
    created_at: datetime
    status: SessionStatus
    total_jobs: int