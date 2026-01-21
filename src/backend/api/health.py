# src/backend/api/health.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
def health():
    return {
        "status": "ok",
        "service": "job-scraper-backend",
    }
