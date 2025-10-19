"""
Request Queue Manager for Diagnostic System
Manages concurrent diagnostic requests with position tracking and estimated wait times
"""

import time
import uuid
from typing import Dict, List, Optional
from threading import Lock
from datetime import datetime, timedelta


class DiagnosticRequest:
    """Represents a single diagnostic request in the queue."""
    
    def __init__(self, request_id: str, alert_text: str):
        self.request_id = request_id
        self.alert_text = alert_text
        self.created_at = datetime.now()
        self.started_at: Optional[datetime] = None
        self.completed_at: Optional[datetime] = None
        self.status = "queued"  # queued, processing, completed, failed
        self.result = None
        self.error = None
        self.estimated_duration = 15  # Default 15 seconds
    
    def start_processing(self):
        """Mark request as started."""
        self.started_at = datetime.now()
        self.status = "processing"
    
    def complete(self, result):
        """Mark request as completed successfully."""
        self.completed_at = datetime.now()
        self.status = "completed"
        self.result = result
        # Update estimated duration based on actual time
        if self.started_at:
            actual_duration = (self.completed_at - self.started_at).total_seconds()
            self.estimated_duration = int(actual_duration)
    
    def fail(self, error):
        """Mark request as failed."""
        self.completed_at = datetime.now()
        self.status = "failed"
        self.error = str(error)
    
    def get_wait_time(self) -> int:
        """Get total wait time in seconds."""
        if self.started_at:
            return int((self.started_at - self.created_at).total_seconds())
        return 0
    
    def get_processing_time(self) -> int:
        """Get processing time in seconds."""
        if self.started_at and self.completed_at:
            return int((self.completed_at - self.started_at).total_seconds())
        elif self.started_at:
            return int((datetime.now() - self.started_at).total_seconds())
        return 0
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for API response."""
        return {
            "request_id": self.request_id,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "wait_time": self.get_wait_time(),
            "processing_time": self.get_processing_time(),
            "estimated_duration": self.estimated_duration,
        }


class RequestQueueManager:
    """
    Manages the queue of diagnostic requests.
    Thread-safe singleton for tracking concurrent requests.
    """
    
    _instance = None
    _lock = Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        self.requests: Dict[str, DiagnosticRequest] = {}
        self.active_requests: List[str] = []  # Currently processing
        self.queue: List[str] = []  # Waiting to be processed
        self.completed_requests: List[str] = []  # Recently completed
        self.max_concurrent = 3  # Maximum concurrent diagnoses
        self.max_completed_history = 20  # Keep last 20 completed
        self.request_lock = Lock()
        self._initialized = True
        
        print("🎯 Request Queue Manager initialized")
        print(f"   Max concurrent requests: {self.max_concurrent}")
    
    def create_request(self, alert_text: str) -> str:
        """Create a new diagnostic request and add to queue."""
        request_id = str(uuid.uuid4())
        
        with self.request_lock:
            request = DiagnosticRequest(request_id, alert_text)
            self.requests[request_id] = request
            self.queue.append(request_id)
            
            print(f"📝 New request created: {request_id[:8]}... (Queue position: {len(self.queue)})")
        
        return request_id
    
    def can_process_now(self, request_id: str) -> bool:
        """Check if request can be processed immediately."""
        with self.request_lock:
            return len(self.active_requests) < self.max_concurrent and request_id in self.queue
    
    def start_processing(self, request_id: str) -> bool:
        """Move request from queue to active processing."""
        with self.request_lock:
            if request_id not in self.requests:
                return False
            
            if request_id in self.queue:
                self.queue.remove(request_id)
            
            if len(self.active_requests) >= self.max_concurrent:
                # Put back in queue if we can't process now
                if request_id not in self.queue:
                    self.queue.insert(0, request_id)
                return False
            
            self.active_requests.append(request_id)
            self.requests[request_id].start_processing()
            
            print(f"🔄 Processing started: {request_id[:8]}... (Active: {len(self.active_requests)})")
            return True
    
    def complete_request(self, request_id: str, result):
        """Mark request as completed and remove from active."""
        with self.request_lock:
            if request_id not in self.requests:
                return
            
            self.requests[request_id].complete(result)
            
            if request_id in self.active_requests:
                self.active_requests.remove(request_id)
            
            self.completed_requests.append(request_id)
            
            # Keep only recent completions
            if len(self.completed_requests) > self.max_completed_history:
                old_id = self.completed_requests.pop(0)
                if old_id in self.requests:
                    del self.requests[old_id]
            
            print(f"✅ Request completed: {request_id[:8]}... (Active: {len(self.active_requests)}, Queue: {len(self.queue)})")
    
    def fail_request(self, request_id: str, error):
        """Mark request as failed."""
        with self.request_lock:
            if request_id not in self.requests:
                return
            
            self.requests[request_id].fail(error)
            
            if request_id in self.active_requests:
                self.active_requests.remove(request_id)
            if request_id in self.queue:
                self.queue.remove(request_id)
            
            print(f"❌ Request failed: {request_id[:8]}... - {error}")
    
    def get_position(self, request_id: str) -> int:
        """Get position in queue (0 = processing, -1 = not found)."""
        with self.request_lock:
            if request_id in self.active_requests:
                return 0  # Currently processing
            if request_id in self.queue:
                return self.queue.index(request_id) + 1  # Position in queue (1-based)
            return -1  # Not found or completed
    
    def get_estimated_wait(self, request_id: str) -> int:
        """Get estimated wait time in seconds."""
        with self.request_lock:
            position = self.get_position(request_id)
            
            if position == 0:
                return 0  # Already processing
            
            if position == -1:
                return 0  # Not in queue
            
            # Calculate based on average processing time and position
            avg_time = self._get_average_processing_time()
            # Account for currently processing requests
            requests_ahead = position - 1 + len(self.active_requests)
            estimated = int(avg_time * (requests_ahead / max(self.max_concurrent, 1)))
            
            return max(estimated, 5)  # Minimum 5 seconds
    
    def _get_average_processing_time(self) -> float:
        """Calculate average processing time from recent completions."""
        with self.request_lock:
            if not self.completed_requests:
                return 15.0  # Default
            
            # Get last 5 completed requests
            recent = self.completed_requests[-5:]
            times = [
                self.requests[rid].get_processing_time()
                for rid in recent
                if rid in self.requests
            ]
            
            if not times:
                return 15.0
            
            return sum(times) / len(times)
    
    def get_status(self) -> Dict:
        """Get overall queue status."""
        with self.request_lock:
            return {
                "active_count": len(self.active_requests),
                "queue_length": len(self.queue),
                "max_concurrent": self.max_concurrent,
                "average_processing_time": int(self._get_average_processing_time()),
                "is_busy": len(self.active_requests) >= self.max_concurrent,
            }
    
    def get_request_status(self, request_id: str) -> Optional[Dict]:
        """Get status of specific request."""
        with self.request_lock:
            if request_id not in self.requests:
                return None
            
            request = self.requests[request_id]
            status = request.to_dict()
            status["position"] = self.get_position(request_id)
            status["estimated_wait"] = self.get_estimated_wait(request_id)
            status["queue_status"] = self.get_status()
            
            return status
    
    def cleanup_old_requests(self, max_age_minutes: int = 30):
        """Clean up old completed/failed requests."""
        with self.request_lock:
            now = datetime.now()
            to_remove = []
            
            for request_id, request in self.requests.items():
                if request.status in ["completed", "failed"]:
                    age = (now - request.created_at).total_seconds() / 60
                    if age > max_age_minutes:
                        to_remove.append(request_id)
            
            for request_id in to_remove:
                if request_id in self.completed_requests:
                    self.completed_requests.remove(request_id)
                del self.requests[request_id]
            
            if to_remove:
                print(f"🧹 Cleaned up {len(to_remove)} old requests")


# Global instance
queue_manager = RequestQueueManager()

