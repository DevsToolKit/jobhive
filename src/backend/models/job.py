from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Job(BaseModel):
    id: Optional[int] = None
    session_id: str
    site: str
    title: str
    company: Optional[str]
    company_url: Optional[str]
    job_url: Optional[str]
    location_country: Optional[str]
    location_city: Optional[str]
    location_state: Optional[str]
    is_remote: bool = False
    description: Optional[str]
    tags: Optional[str]
    job_type: Optional[str]
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    currency: Optional[str] = None
    interval: Optional[str] = None
    date_posted: Optional[datetime]
    scraped_at: datetime
    emails: Optional[str]
    job_level: Optional[str]
    company_industry: Optional[str]
    
    class Config:
        from_attributes = True