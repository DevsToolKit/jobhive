from fastapi import APIRouter, Query
from typing import List, Optional
from models.job import Job
from database.connection import get_db
from datetime import datetime

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.get("/search", response_model=List[Job])
async def search_jobs(
    query: Optional[str] = None,
    company: Optional[str] = None,
    location_city: Optional[str] = None,
    location_state: Optional[str] = None,
    is_remote: Optional[bool] = None,
    job_type: Optional[str] = None,
    min_salary: Optional[float] = None,
    max_salary: Optional[float] = None,
    site: Optional[str] = None,
    limit: int = Query(100, le=1000)
):
    """
    Advanced job search across all sessions
    """
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Build dynamic query
        sql = "SELECT * FROM jobs WHERE 1=1"
        params = []
        
        if query:
            sql += " AND (title LIKE ? OR description LIKE ?)"
            params.extend([f"%{query}%", f"%{query}%"])
        
        if company:
            sql += " AND company LIKE ?"
            params.append(f"%{company}%")
        
        if location_city:
            sql += " AND location_city LIKE ?"
            params.append(f"%{location_city}%")
        
        if location_state:
            sql += " AND location_state = ?"
            params.append(location_state)
        
        if is_remote is not None:
            sql += " AND is_remote = ?"
            params.append(is_remote)
        
        if job_type:
            sql += " AND job_type = ?"
            params.append(job_type)
        
        if min_salary:
            sql += " AND max_amount >= ?"
            params.append(min_salary)
        
        if max_salary:
            sql += " AND min_amount <= ?"
            params.append(max_salary)
        
        if site:
            sql += " AND site = ?"
            params.append(site)
        
        sql += " ORDER BY scraped_at DESC LIMIT ?"
        params.append(limit)
        
        cursor.execute(sql, params)
        rows = cursor.fetchall()
        
        return [
            Job(
                id=row['id'],
                session_id=row['session_id'],
                site=row['site'],
                title=row['title'],
                company=row['company'],
                company_url=row['company_url'],
                job_url=row['job_url'],
                location_country=row['location_country'],
                location_city=row['location_city'],
                location_state=row['location_state'],
                is_remote=bool(row['is_remote']),
                description=row['description'],
                job_type=row['job_type'],
                interval=row['interval'],
                min_amount=row['min_amount'],
                max_amount=row['max_amount'],
                currency=row['currency'],
                date_posted=datetime.fromisoformat(row['date_posted']) if row['date_posted'] else None,
                scraped_at=datetime.fromisoformat(row['scraped_at']),
                emails=row['emails'],
                job_level=row['job_level'],
                company_industry=row['company_industry']
            )
            for row in rows
        ]