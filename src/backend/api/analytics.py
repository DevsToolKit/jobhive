from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/analytics", tags=["analytics"])
analytics_service = AnalyticsService()


@router.get("/dashboard", response_model=Dict)
async def get_dashboard_stats():
    """Get high-level summary stats for the dashboard"""
    try:
        return analytics_service.get_dashboard_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/timeline", response_model=List[Dict])
async def get_session_timeline(days: int = Query(default=30, ge=1, le=365)):
    """Get session scrape activity over time (default 30 days)"""
    try:
        return analytics_service.get_session_timeline(days=days)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/popular-searches", response_model=List[Dict])
async def get_popular_searches(limit: int = Query(default=10, ge=1, le=50)):
    """Get top searched terms and locations"""
    try:
        return analytics_service.get_popular_searches(limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/job-stats", response_model=Dict)
async def get_job_statistics():
    """Get aggregate job statistics: salary distributions, remote vs onsite, top locations"""
    try:
        return analytics_service.get_job_statistics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
