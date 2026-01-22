import asyncio
import threading
from typing import Dict, Callable, Optional
from concurrent.futures import ThreadPoolExecutor
from queue import Queue
import uuid

class TaskManager:
    """Manages background scraping tasks"""
    
    def __init__(self, max_workers: int = 3):
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
        self.active_tasks: Dict[str, dict] = {}
        self.progress_queues: Dict[str, Queue] = {}
        self._lock = threading.Lock()
    
    def submit_task(self, task_id: str, func: Callable, *args, **kwargs) -> str:
        """Submit a background task"""
        
        # Create progress queue for this task
        progress_queue = Queue()
        
        with self._lock:
            self.progress_queues[task_id] = progress_queue
            self.active_tasks[task_id] = {
                'status': 'running',
                'progress': 0,
                'message': 'Starting...'
            }
        
        # Submit task to thread pool
        future = self.executor.submit(self._run_task, task_id, func, *args, **kwargs)
        
        return task_id
    
    def _run_task(self, task_id: str, func: Callable, *args, **kwargs):
        """Execute task and handle completion"""
        try:
            # Execute the actual function
            result = func(*args, **kwargs)
            
            # Mark as completed
            with self._lock:
                if task_id in self.active_tasks:
                    self.active_tasks[task_id]['status'] = 'completed'
                    self.active_tasks[task_id]['result'] = result
            
            return result
            
        except Exception as e:
            # Mark as failed
            with self._lock:
                if task_id in self.active_tasks:
                    self.active_tasks[task_id]['status'] = 'failed'
                    self.active_tasks[task_id]['error'] = str(e)
            
            raise
    
    def send_progress(self, task_id: str, progress_data: dict):
        """Send progress update for a task"""
        if task_id in self.progress_queues:
            self.progress_queues[task_id].put(progress_data)
            
            # Update cached status
            with self._lock:
                if task_id in self.active_tasks:
                    self.active_tasks[task_id].update(progress_data)
    
    def get_progress_queue(self, task_id: str) -> Optional[Queue]:
        """Get progress queue for a task"""
        return self.progress_queues.get(task_id)
    
    def get_task_status(self, task_id: str) -> Optional[dict]:
        """Get current task status"""
        with self._lock:
            return self.active_tasks.get(task_id)
    
    def cancel_task(self, task_id: str) -> bool:
        """Cancel a running task"""
        with self._lock:
            if task_id in self.active_tasks:
                self.active_tasks[task_id]['status'] = 'cancelled'
                return True
        return False
    
    def cleanup_task(self, task_id: str):
        """Clean up task resources"""
        with self._lock:
            if task_id in self.active_tasks:
                del self.active_tasks[task_id]
            if task_id in self.progress_queues:
                del self.progress_queues[task_id]
    
    def shutdown(self):
        """Shutdown the task manager"""
        self.executor.shutdown(wait=True)

# Global task manager instance
task_manager = TaskManager(max_workers=3)