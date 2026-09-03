import threading
import time
from typing import Callable, Dict, Optional
from concurrent.futures import ThreadPoolExecutor
from queue import Queue


class TaskManager:
    """Manages background scraping tasks and progress queues safely"""

    def __init__(self, max_workers: int = 3):
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
        self.active_tasks: Dict[str, dict] = {}
        self.progress_queues: Dict[str, Queue] = {}
        self._lock = threading.Lock()

    def submit_task(self, task_id: str, func: Callable, *args, **kwargs) -> str:
        """Submit a background task"""
        progress_queue = Queue()

        with self._lock:
            self.progress_queues[task_id] = progress_queue
            self.active_tasks[task_id] = {
                "status": "running",
                "progress": 0,
                "message": "Starting...",
                "started_at": time.time(),
            }

        self.executor.submit(self._run_task, task_id, func, *args, **kwargs)
        return task_id

    def _run_task(self, task_id: str, func: Callable, *args, **kwargs):
        """Execute task and handle completion"""
        try:
            result = func(*args, **kwargs)
            with self._lock:
                if task_id in self.active_tasks:
                    self.active_tasks[task_id]["status"] = "completed"
                    self.active_tasks[task_id]["result"] = result
                    self.active_tasks[task_id]["completed_at"] = time.time()
            return result
        except Exception as e:
            with self._lock:
                if task_id in self.active_tasks:
                    self.active_tasks[task_id]["status"] = "failed"
                    self.active_tasks[task_id]["error"] = str(e)
                    self.active_tasks[task_id]["completed_at"] = time.time()
            raise

    def send_progress(self, task_id: str, progress_data: dict):
        """Send progress update for a task"""
        with self._lock:
            queue = self.progress_queues.get(task_id)
            if queue:
                queue.put(progress_data)
            if task_id in self.active_tasks:
                self.active_tasks[task_id].update(progress_data)

    def get_progress_queue(self, task_id: str) -> Optional[Queue]:
        """Get progress queue for a task"""
        with self._lock:
            return self.progress_queues.get(task_id)

    def get_task_status(self, task_id: str) -> Optional[dict]:
        """Get current task status"""
        with self._lock:
            status = self.active_tasks.get(task_id)
            return status.copy() if status else None

    def cancel_task(self, task_id: str) -> bool:
        """Cancel a running task"""
        with self._lock:
            if task_id in self.active_tasks:
                self.active_tasks[task_id]["status"] = "cancelled"
                self.active_tasks[task_id]["cancelled_at"] = time.time()
                queue = self.progress_queues.get(task_id)
                if queue:
                    queue.put({"status": "cancelled", "message": "Scrape cancelled by user"})
                return True
        return False

    def is_cancelled(self, task_id: str) -> bool:
        """Check if task has been cancelled"""
        with self._lock:
            task = self.active_tasks.get(task_id)
            return bool(task and task.get("status") == "cancelled")

    def cleanup_task(self, task_id: str, force: bool = False):
        """Clean up task resources only when finished or forced"""
        with self._lock:
            task = self.active_tasks.get(task_id)
            # Do not delete running task tracking on casual client disconnect unless forced
            if not force and task and task.get("status") == "running":
                return
            self.active_tasks.pop(task_id, None)
            self.progress_queues.pop(task_id, None)

    def shutdown(self, wait: bool = False):
        """Shutdown the task manager executor"""
        self.executor.shutdown(wait=wait, cancel_futures=True)


# Global task manager instance
task_manager = TaskManager(max_workers=3)