import uuid
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse
import asyncio
import json
from typing import AsyncGenerator
from datetime import datetime

from models.scrape_config import ScrapeRequest, ScrapeConfig
from services.scraping_service import ScrapingService
from services.preset_service import PresetService
from models.preset import PresetCreate
from core.task_manager import task_manager

router = APIRouter(prefix="/api/scrape", tags=["scraping"])

# Global scraping service instance
scraping_service = ScrapingService()
preset_service = PresetService()

@router.post("/start")
async def start_scrape(request: ScrapeRequest):
    """
    Start a new scraping session
    
    Returns immediately with a session_id.
    Client should connect to /api/scrape/progress/{session_id} for real-time updates.
    """
    try:
        config = ScrapeConfig(**request.dict())
        session_id = str(uuid.uuid4())

        if request.save_as_preset and request.preset_name:
            preset_service.create_preset(
                PresetCreate(
                    name=request.preset_name,
                    search_term=request.search_term,
                    location=request.location,
                    config=config.dict(),
                )
            )

        if request.preset_id:
            preset_service.update_preset_usage(request.preset_id)
        
        # Submit task with enhanced progress tracking
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
            "started_at": datetime.utcnow().isoformat(),
            "message": f"Scraping started. Connect to /api/scrape/progress/{session_id} for updates."
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/progress/{session_id}")
async def scrape_progress(session_id: str):
    """
    Server-Sent Events endpoint for real-time scraping progress
    
    Enhanced with detailed progress metrics:
    - Total jobs and completed count
    - Success/failure breakdown
    - Current processing status
    - Estimated time remaining
    - Per-job details
    - Performance metrics
    """
    
    async def event_generator() -> AsyncGenerator[str, None]:
        """Generate SSE events from progress queue with enhanced data"""
        
        progress_queue = task_manager.get_progress_queue(session_id)
        
        if not progress_queue:
            # Session not found or already completed
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
        
        # Send initial connection acknowledgment
        yield {
            "event": "connected",
            "data": json.dumps({
                "session_id": session_id,
                "timestamp": datetime.utcnow().isoformat()
            })
        }
        
        # Stream progress updates
        try:
            while True:
                task_status = task_manager.get_task_status(session_id)
                
                if not task_status:
                    break
                
                try:
                    progress_data = progress_queue.get(timeout=1)
                    
                    # Enhanced progress data structure
                    enhanced_data = {
                        "session_id": session_id,
                        "timestamp": datetime.utcnow().isoformat(),
                        "status": progress_data.get('status', 'processing'),
                        
                        # Overall metrics
                        "total_jobs": progress_data.get('total_jobs', 0),
                        "completed_jobs": progress_data.get('completed_jobs', 0),
                        "successful_jobs": progress_data.get('successful_jobs', 0),
                        "failed_jobs": progress_data.get('failed_jobs', 0),
                        "skipped_jobs": progress_data.get('skipped_jobs', 0),
                        
                        # Progress percentage
                        "progress_percent": progress_data.get('progress_percent', 0),
                        
                        # Current operation
                        "current_job": progress_data.get('current_job', None),
                        "current_url": progress_data.get('current_url', None),
                        "current_operation": progress_data.get('current_operation', None),
                        
                        # Time tracking
                        "elapsed_time": progress_data.get('elapsed_time', 0),
                        "estimated_remaining": progress_data.get('estimated_remaining', None),
                        "average_job_time": progress_data.get('average_job_time', 0),
                        
                        # Performance metrics
                        "jobs_per_second": progress_data.get('jobs_per_second', 0),
                        "success_rate": progress_data.get('success_rate', 0),
                        
                        # Recent jobs (last 5)
                        "recent_jobs": progress_data.get('recent_jobs', []),
                        
                        # Error information (if any)
                        "error_message": progress_data.get('error_message', None),
                        "error_details": progress_data.get('error_details', None),
                        
                        # Resource usage (optional)
                        "memory_usage_mb": progress_data.get('memory_usage_mb', None),
                        "cpu_percent": progress_data.get('cpu_percent', None),
                        
                        # Warnings or alerts
                        "warnings": progress_data.get('warnings', []),
                        
                        # Final results (on completion)
                        "results_summary": progress_data.get('results_summary', None),
                        "output_path": progress_data.get('output_path', None)
                    }
                    
                    yield {
                        "event": "progress",
                        "data": json.dumps(enhanced_data)
                    }
                    
                    # Check if completed
                    if progress_data.get('status') in ['completed', 'error', 'cancelled']:
                        yield {
                            "event": "close",
                            "data": json.dumps({
                                "message": "Scraping finished",
                                "final_status": progress_data.get('status'),
                                "timestamp": datetime.utcnow().isoformat()
                            })
                        }
                        break
                        
                except:
                    # No new progress, send keepalive with current stats
                    current_status = task_manager.get_task_status(session_id)
                    yield {
                        "event": "ping",
                        "data": json.dumps({
                            "timestamp": datetime.utcnow().isoformat(),
                            "session_active": bool(current_status)
                        })
                    }
                
                await asyncio.sleep(0.5)
                
        finally:
            # Cleanup when client disconnects
            task_manager.cleanup_task(session_id)
    
    return EventSourceResponse(event_generator())


@router.get("/status/{session_id}")
async def get_scrape_status(session_id: str):
    """
    Get current status of a scraping session (polling alternative to SSE)
    Returns enhanced status information
    """
    # First check active tasks
    task_status = task_manager.get_task_status(session_id)
    if task_status:
        return {
            **task_status,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    # Then check database
    status = scraping_service.get_session_status(session_id)
    if status:
        return {
            **status,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    raise HTTPException(status_code=404, detail="Session not found")


@router.post("/cancel/{session_id}")
async def cancel_scrape(session_id: str):
    """Cancel an active scraping session"""
    
    if task_manager.cancel_task(session_id):
        scraping_service.cancel_scrape(session_id)
        return {
            "message": "Scraping cancelled",
            "session_id": session_id,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    raise HTTPException(status_code=404, detail="Active session not found")
