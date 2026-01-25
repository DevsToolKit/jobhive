import uuid
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse
import asyncio
import json
from typing import AsyncGenerator

from models.scrape_config import ScrapeRequest, ScrapeConfig
from services.scraping_service import ScrapingService
from core.task_manager import task_manager

router = APIRouter(prefix="/api/scrape", tags=["scraping"])

# Global scraping service instance
scraping_service = ScrapingService()

@router.post("/start")
async def start_scrape(request: ScrapeRequest):
    """
    Start a new scraping session
    
    Returns immediately with a session_id.
    Client should connect to /api/scrape/progress/{session_id} for real-time updates.
    """
    try:
        config = ScrapeConfig(**request.dict())
        
        # Create progress callback that sends to task manager
        def progress_callback(data: dict):
            task_manager.send_progress(data['session_id'], data)
        
        # Submit scraping task to background
        # Note: We'll get session_id from the service
        session_id = None
         
        def run_scrape():
            nonlocal session_id
            session_id = scraping_service.start_scrape(config, progress_callback)
            return session_id

        # Actually, let's make this simpler - return session ID immediately
        # and start scraping in background
        
        session_id = str(uuid.uuid4())
        
        # Submit task
        task_manager.submit_task(
            session_id,
            scraping_service.start_scrape,
            config,
            lambda data: task_manager.send_progress(session_id, data)
        )
        
        return {
            "session_id": session_id,
            "status": "started",
            "message": f"Scraping started. Connect to http://localhost:8765/api/scrape/progress/{session_id} for updates."
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/progress/{session_id}")
async def scrape_progress(session_id: str):
    """
    Server-Sent Events endpoint for real-time scraping progress
    
    Client should listen to this endpoint to receive updates.
    """
    
    async def event_generator() -> AsyncGenerator[str, None]:
        """Generate SSE events from progress queue"""
        
        progress_queue = task_manager.get_progress_queue(session_id)
        
        if not progress_queue:
            # Session not found or already completed
            # Check database for final status
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
        
        # Stream progress updates
        try:
            while True:
                # Check if task still active
                task_status = task_manager.get_task_status(session_id)
                
                if not task_status:
                    break
                
                # Try to get progress update (non-blocking with timeout)
                try:
                    progress_data = progress_queue.get(timeout=1)
                    
                    yield {
                        "event": "progress",
                        "data": json.dumps(progress_data)
                    }
                    
                    # Check if completed
                    if progress_data.get('status') in ['completed', 'error', 'cancelled']:
                        yield {
                            "event": "close",
                            "data": json.dumps({"message": "Scraping finished"})
                        }
                        break
                        
                except:
                    # No new progress, send keepalive
                    yield {
                        "event": "ping",
                        "data": json.dumps({"timestamp": asyncio.get_event_loop().time()})
                    }
                
                # Small delay to prevent tight loop
                await asyncio.sleep(0.5)
                
        finally:
            # Cleanup when client disconnects
            task_manager.cleanup_task(session_id)
    
    return EventSourceResponse(event_generator())


@router.get("/status/{session_id}")
async def get_scrape_status(session_id: str):
    """
    Get current status of a scraping session (polling alternative to SSE)
    """
    # First check active tasks
    task_status = task_manager.get_task_status(session_id)
    if task_status:
        return task_status
    
    # Then check database
    status = scraping_service.get_session_status(session_id)
    if status:
        return status
    
    raise HTTPException(status_code=404, detail="Session not found")


@router.post("/cancel/{session_id}")
async def cancel_scrape(session_id: str):
    """Cancel an active scraping session"""
    
    # Try to cancel in task manager
    if task_manager.cancel_task(session_id):
        scraping_service.cancel_scrape(session_id)
        return {"message": "Scraping cancelled", "session_id": session_id}
    
    raise HTTPException(status_code=404, detail="Active session not found")