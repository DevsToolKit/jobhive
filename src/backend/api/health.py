from fastapi import APIRouter
from datetime import datetime
import sys
import platform

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "python_version": sys.version,
        "platform": platform.platform()
    }


@router.get("/api/health")
async def api_health_check():
    """API health check (alternative path)"""
    return {
        "status": "ok",
        "message": "JobHive API is running",
        "timestamp": datetime.now().isoformat()
    }