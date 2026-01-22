from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class Preset(BaseModel):
    id: str
    name: str
    search_term: str
    location: Optional[str]
    config: dict
    created_at: datetime
    last_used: Optional[datetime]
    use_count: int = 0

class PresetCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    search_term: str
    location: Optional[str]
    config: dict

class PresetSummary(BaseModel):
    id: str
    name: str
    search_term: str
    location: Optional[str]
    use_count: int
    last_used: Optional[datetime]