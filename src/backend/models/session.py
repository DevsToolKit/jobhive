from typing import Optional
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, ConfigDict


class SessionStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Session(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    id: str
    search_term: str
    location: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    status: SessionStatus
    total_jobs: int = 0
    config: dict
    error_message: Optional[str] = None


class SessionSummary(BaseModel):
    """Lightweight session info for listing"""
    model_config = ConfigDict(use_enum_values=True)

    id: str
    search_term: str
    location: Optional[str] = None
    created_at: datetime
    status: SessionStatus
    total_jobs: int