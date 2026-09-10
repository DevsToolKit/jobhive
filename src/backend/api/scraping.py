import asyncio
from datetime import datetime, timezone
import json
from typing import AsyncGenerator
import uuid

from fastapi import APIRouter, HTTPException
from sse_starlette.sse import EventSourceResponse

from core.task_manager import task_manager
from core.validators import ScrapeValidationError, validate_scrape_config
from models.preset import PresetCreate
from models.scrape_config import ScrapeConfig, ScrapeRequest
from services.preset_service import PresetService
from services.scraping_service import ScrapingService
from utils.logger import logger

router = APIRouter(prefix="/api/scrape", tags=["scraping"])

scraping_service = ScrapingService()
preset_service = PresetService()


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.post("/start")
async def start_scrape(request: ScrapeRequest):
    """
    Start a new scraping session
    
    Validates configuration, optionally saves/updates presets,
    and submits the background task.
    Returns session_id immediately.
    """
    try:
        config = ScrapeConfig(**request.model_dump())
        validate_scrape_config(config)
    except ScrapeValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    try:
        session_id = str(uuid.uuid4())

        if request.save_as_preset and request.preset_name:
            preset_service.create_preset(
                PresetCreate(
                    name=request.preset_name,
                    search_term=request.search_term,
                    location=request.location,
                    config=config.model_dump(),
                )
            )

        if request.preset_id:
            preset_service.update_preset_usage(request.preset_id)

        task_manager.submit_task(
            session_id,
            scraping_service.start_scrape,
            config,
            session_id,
            lambda data: task_manager.send_progress(session_id, data)
        )

        return {
            "session_id": session_id,
            "status": "started",
            "started_at": utc_now_iso(),
            "message": f"Scraping started. Connect to /api/scrape/progress/{session_id} for updates."
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to start scrape: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/progress/{session_id}")
async def scrape_progress(session_id: str):
    """
    Server-Sent Events endpoint for real-time scraping progress
    """

    async def event_generator() -> AsyncGenerator[dict, None]:
        progress_queue = task_manager.get_progress_queue(session_id)

        if not progress_queue:
            status = scraping_service.get_session_status(session_id)
            if status:
                yield {
                    "event": "status",
                    "data": json.dumps(status)
                }
                yield {
                    "event": "close",
                    "data": json.dumps({"message": "Session completed"})
                }
            else:
                yield {
                    "event": "error",
                    "data": json.dumps({"error": "Session not found"})
                }
            return

        yield {
            "event": "connected",
            "data": json.dumps({
                "session_id": session_id,
                "timestamp": utc_now_iso()
            })
        }

        try:
            while True:
                task_status = task_manager.get_task_status(session_id)
                if not task_status:
                    break

                try:
                    progress_data = progress_queue.get_nowait()

                    enhanced_data = {
                        "session_id": session_id,
                        "timestamp": utc_now_iso(),
                        "status": progress_data.get("status", "processing"),
                        "search_term": progress_data.get("search_term", ""),
                        "location": progress_data.get("location", ""),
                        "target_jobs": progress_data.get("target_jobs", progress_data.get("total_jobs", 0)),
                        "total_jobs": progress_data.get("total_jobs", 0),
                        "completed_jobs": progress_data.get("completed_jobs", 0),
                        "successful_jobs": progress_data.get("successful_jobs", 0),
                        "failed_jobs": progress_data.get("failed_jobs", 0),
                        "skipped_jobs": progress_data.get("skipped_jobs", 0),
                        "progress_percent": progress_data.get("progress_percent", 0),
                        "current_job": progress_data.get("current_job", None),
                        "current_site": progress_data.get("current_site", None),
                        "site_statuses": progress_data.get("site_statuses", None),
                        "current_url": progress_data.get("current_url", None),
                        "current_operation": progress_data.get("current_operation", None),
                        "elapsed_time": progress_data.get("elapsed_time", 0),
                        "estimated_remaining": progress_data.get("estimated_remaining", None),
                        "average_job_time": progress_data.get("average_job_time", 0),
                        "jobs_per_second": progress_data.get("jobs_per_second", 0),
                        "success_rate": progress_data.get("success_rate", 0),
                        "recent_jobs": progress_data.get("recent_jobs", []),
                        "error_message": progress_data.get("error_message", None),
                        "error_details": progress_data.get("error_details", None),
                        "warnings": progress_data.get("warnings", []),
                        "results_summary": progress_data.get("results_summary", None),
                        "output_path": progress_data.get("output_path", None),
                    }

                    yield {
                        "event": "progress",
                        "data": json.dumps(enhanced_data)
                    }

                    if progress_data.get("status") in ["completed", "error", "cancelled"]:
                        yield {
                            "event": "close",
                            "data": json.dumps({
                                "message": "Scraping finished",
                                "final_status": progress_data.get("status"),
                                "timestamp": utc_now_iso()
                            })
                        }
                        break

                except Exception:
                    # No new event in queue, yield a keepalive ping
                    current_status = task_manager.get_task_status(session_id)
                    yield {
                        "event": "ping",
                        "data": json.dumps({
                            "timestamp": utc_now_iso(),
                            "session_active": bool(current_status)
                        })
                    }

                await asyncio.sleep(0.5)

        finally:
            # Only clean up resources if task is actually done
            task_manager.cleanup_task(session_id, force=False)

    return EventSourceResponse(event_generator())


@router.get("/status/{session_id}")
async def get_scrape_status(session_id: str):
    """Get current status of a scraping session (polling alternative)"""
    task_status = task_manager.get_task_status(session_id)
    if task_status:
        return {
            **task_status,
            "timestamp": utc_now_iso()
        }

    status = scraping_service.get_session_status(session_id)
    if status:
        return {
            **status,
            "timestamp": utc_now_iso()
        }

    raise HTTPException(status_code=404, detail="Session not found")


@router.post("/cancel/{session_id}")
async def cancel_scrape(session_id: str):
    """Cancel an active scraping session"""
    scraping_service.cancel_scrape(session_id)
    cancelled = task_manager.cancel_task(session_id)

    if cancelled or scraping_service.get_session_status(session_id):
        return {
            "message": "Scraping cancelled",
            "session_id": session_id,
            "timestamp": utc_now_iso()
        }

    raise HTTPException(status_code=404, detail="Active session not found")
