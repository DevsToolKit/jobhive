from pydantic import BaseModel, Field, validator
from typing import Optional, List
from enum import Enum

class JobSite(str, Enum):
    LINKEDIN = "linkedin"
    INDEED = "indeed"
    GLASSDOOR = "glassdoor"
    GOOGLE = "google"

class JobType(str, Enum):
    FULLTIME = "fulltime"
    PARTTIME = "parttime"
    INTERNSHIP = "internship"
    CONTRACT = "contract"

class ScrapeConfig(BaseModel):
    search_term: str = Field(..., min_length=1, description="Job title or keywords")
    location: Optional[str] = Field(None, description="Location (city, state, country)")
    
    # Job sites to scrape
    sites: List[JobSite] = Field(
        default=[JobSite.LINKEDIN, JobSite.INDEED],
        description="Job sites to scrape"
    )
    
    # Filters
    results_wanted: int = Field(default=50, ge=1, le=200, description="Max results per site")
    distance: Optional[int] = Field(default=50, description="Distance in miles")
    job_type: Optional[JobType] = None
    is_remote: Optional[bool] = None
    hours_old: Optional[int] = Field(None, description="Only jobs posted within X hours")
    
    # Advanced options
    country_indeed: str = Field(default="USA", description="Country for Indeed search")
    offset: int = Field(default=0, ge=0, description="Pagination offset")
    
    @validator('sites')
    def validate_sites(cls, v):
        if not v or len(v) == 0:
            raise ValueError("At least one job site must be selected")
        return v

class ScrapeRequest(ScrapeConfig):
    """Request model for starting a scrape"""
    save_as_preset: Optional[bool] = False
    preset_name: Optional[str] = None
    preset_id: Optional[str] = None
