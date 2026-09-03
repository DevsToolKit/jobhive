from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from database.connection import get_db
from models.job import Job

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


class JobListResponse(BaseModel):
    total: int
    limit: int
    offset: int
    items: List[Job]


def _row_to_job(row) -> Job:
    return Job(
        id=row["id"],
        session_id=row["session_id"],
        site=row["site"],
        title=row["title"],
        company=row["company"],
        company_url=row["company_url"],
        job_url=row["job_url"],
        location_country=row["location_country"],
        location_city=row["location_city"],
        location_state=row["location_state"],
        is_remote=bool(row["is_remote"]),
        description=row["description"],
        tags=row["tags"],
        job_type=row["job_type"],
        interval=row["interval"],
        min_amount=row["min_amount"],
        max_amount=row["max_amount"],
        currency=row["currency"],
        date_posted=datetime.fromisoformat(row["date_posted"]) if row["date_posted"] else None,
        scraped_at=datetime.fromisoformat(row["scraped_at"]),
        emails=row["emails"],
        job_level=row["job_level"],
        company_industry=row["company_industry"],
    )


@router.get("", response_model=JobListResponse)
@router.get("/", response_model=JobListResponse)
async def list_jobs(
    q: Optional[str] = Query(None, description="Search term in title, company, or description"),
    site: Optional[str] = Query(None, description="Filter by site (e.g. linkedin, indeed)"),
    is_remote: Optional[bool] = Query(None, description="Filter by remote status"),
    job_type: Optional[str] = Query(None, description="Filter by job type"),
    min_amount: Optional[float] = Query(None, description="Minimum salary filter"),
    session_id: Optional[str] = Query(None, description="Filter by session ID"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    """
    Search and filter jobs across all scraping sessions.
    Supports full-text query matching, site filters, salary thresholds, and pagination.
    """
    conditions = []
    params = []

    if q:
        query_pattern = f"%{q.strip()}%"
        conditions.append("(title LIKE ? OR company LIKE ? OR description LIKE ?)")
        params.extend([query_pattern, query_pattern, query_pattern])

    if site:
        conditions.append("site = ?")
        params.append(site.strip().lower())

    if is_remote is not None:
        conditions.append("is_remote = ?")
        params.append(1 if is_remote else 0)

    if job_type:
        conditions.append("job_type = ?")
        params.append(job_type.strip().lower())

    if min_amount is not None:
        conditions.append("(max_amount >= ? OR min_amount >= ?)")
        params.extend([min_amount, min_amount])

    if session_id:
        conditions.append("session_id = ?")
        params.append(session_id)

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    with get_db() as conn:
        cursor = conn.cursor()

        # Count total matches
        count_query = f"SELECT COUNT(*) as total FROM jobs {where_clause}"
        cursor.execute(count_query, params)
        total = cursor.fetchone()["total"]

        # Fetch page items
        data_query = f"""
            SELECT * FROM jobs
            {where_clause}
            ORDER BY scraped_at DESC
            LIMIT ? OFFSET ?
        """
        cursor.execute(data_query, [*params, limit, offset])
        rows = cursor.fetchall()

    return JobListResponse(
        total=total,
        limit=limit,
        offset=offset,
        items=[_row_to_job(r) for r in rows],
    )


@router.get("/{job_id}", response_model=Job)
async def get_job(job_id: int):
    """Get single job posting details by its ID"""
    with get_db() as conn:
        row = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Job not found")

    return _row_to_job(row)
