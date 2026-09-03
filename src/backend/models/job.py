from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class Job(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    session_id: str
    site: str
    title: str
    company: Optional[str] = None
    company_url: Optional[str] = None
    job_url: Optional[str] = None
    location_country: Optional[str] = None
    location_city: Optional[str] = None
    location_state: Optional[str] = None
    is_remote: bool = False
    description: Optional[str] = None
    tags: Optional[str] = None
    job_type: Optional[str] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    currency: Optional[str] = None
    interval: Optional[str] = None
    date_posted: Optional[datetime] = None
    scraped_at: datetime
    emails: Optional[str] = None
    job_level: Optional[str] = None
    company_industry: Optional[str] = None