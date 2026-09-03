import csv
from datetime import datetime, timezone
import io
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Response

from models.job import Job
from models.session import Session, SessionSummary
from services.session_service import SessionService

router = APIRouter(prefix="/api/sessions", tags=["sessions"])
session_service = SessionService()


@router.get("", response_model=List[SessionSummary])
@router.get("/", response_model=List[SessionSummary])
async def get_all_sessions(limit: int = 100):
    """Get all scraping sessions"""
    try:
        return session_service.get_all_sessions(limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/latest", response_model=List[SessionSummary])
async def get_latest_session():
    """
    Return today's latest session only.
    If the latest session is from a previous day, return empty list.
    """
    try:
        today = datetime.now(timezone.utc).date()
        sessions = session_service.get_all_sessions(limit=10)

        todays_sessions = [
            s for s in sessions
            if s.created_at.date() == today
        ]

        return todays_sessions[:1]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{session_id}", response_model=Session)
async def get_session(session_id: str):
    """Get a specific session by ID"""
    session = session_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.get("/{session_id}/jobs", response_model=List[Job])
async def get_session_jobs(session_id: str, limit: int = 1000):
    """Get all jobs for a specific session"""
    try:
        return session_service.get_session_jobs(session_id, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{session_id}")
async def delete_session(session_id: str):
    """Delete a session and all its jobs"""
    success = session_service.delete_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session deleted successfully", "session_id": session_id}


@router.get("/{session_id}/export/csv")
async def export_session_csv(session_id: str):
    """Export session jobs as CSV"""
    session = session_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    try:
        csv_data = session_service.export_session_csv(session_id)
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=jobs_{session_id}.csv"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{session_id}/export/json")
async def export_session_json(session_id: str):
    """Export session jobs as JSON"""
    session = session_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    try:
        jobs = session_service.get_session_jobs(session_id)
        jobs_data = [job.model_dump() for job in jobs]

        return {
            "session_id": session_id,
            "total_jobs": len(jobs_data),
            "jobs": jobs_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))