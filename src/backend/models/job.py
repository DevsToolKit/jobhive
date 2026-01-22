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
    job_type: Optional[str]
    interval: Optional[str]
    min_amount: Optional[float]
    max_amount: Optional[float]
    currency: Optional[str]
    date_posted: Optional[datetime]
    scraped_at: datetime
    emails: Optional[str]
    job_level: Optional[str]
    company_industry: Optional[str]
    
    class Config:
        from_attributes = True