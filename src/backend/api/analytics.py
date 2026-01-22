from fastapi import APIRouter
from services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

analytics_service = AnalyticsService()


@router.get("/dashboard")
async def get_dashboard_stats():
    """Get dashboard statistics"""
    return analytics_service.get_dashboard_stats()


@router.get("/timeline")
async def get_session_timeline(days: int = 30):
    """Get session activity timeline"""
    return analytics_service.get_session_timeline(days)


@router.get("/popular-searches")
async def get_popular_searches(limit: int = 10):
    """Get most popular search terms"""
    return analytics_service.get_popular_searches(limit)


@router.get("/job-stats")
async def get_job_statistics():
    """Get job-level statistics"""
    return analytics_service.get_job_statistics()