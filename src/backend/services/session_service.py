import json
from typing import List, Optional
from datetime import datetime

from database.connection import get_db
from models.session import Session, SessionSummary, SessionStatus
from models.job import Job

class SessionService:
    
    def get_all_sessions(self, limit: int = 100) -> List[SessionSummary]:
        """Get all scraping sessions"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, search_term, location, created_at, status, total_jobs
                FROM sessions
                ORDER BY created_at DESC
                LIMIT ?
            """, (limit,))
            
            rows = cursor.fetchall()
            
            return [
                SessionSummary(
                    id=row['id'],
                    search_term=row['search_term'],
                    location=row['location'],
                    created_at=datetime.fromisoformat(row['created_at']),
                    status=SessionStatus(row['status']),
                    total_jobs=row['total_jobs']
                )
                for row in rows
            ]
    
    def get_session(self, session_id: str) -> Optional[Session]:
        """Get a specific session by ID"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT *
                FROM sessions
                WHERE id = ?
            """, (session_id,))
            
            row = cursor.fetchone()
            
            if not row:
                return None
            
            return Session(
                id=row['id'],
                search_term=row['search_term'],
                location=row['location'],
                created_at=datetime.fromisoformat(row['created_at']),
                completed_at=datetime.fromisoformat(row['completed_at']) if row['completed_at'] else None,
                status=SessionStatus(row['status']),
                total_jobs=row['total_jobs'],
                config=json.loads(row['config']),
                error_message=row['error_message']
            )
    
    def get_session_jobs(self, session_id: str, limit: int = 1000) -> List[Job]:
        """Get all jobs for a session"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT *
                FROM jobs
                WHERE session_id = ?
                ORDER BY scraped_at DESC
                LIMIT ?
            """, (session_id, limit))
            
            rows = cursor.fetchall()
            
            return [
                Job(
                    id=row['id'],
                    session_id=row['session_id'],
                    site=row['site'],
                    title=row['title'],
                    company=row['company'],
                    company_url=row['company_url'],
                    job_url=row['job_url'],
                    location_country=row['location_country'],
                    location_city=row['location_city'],
                    location_state=row['location_state'],
                    is_remote=bool(row['is_remote']),
                    description=row['description'],
                    tags=row['tags'],
                    job_type=row['job_type'],
                    interval=row['interval'],
                    min_amount=row['min_amount'],
                    max_amount=row['max_amount'],
                    currency=row['currency'],
                    date_posted=datetime.fromisoformat(row['date_posted']) if row['date_posted'] else None,
                    scraped_at=datetime.fromisoformat(row['scraped_at']),
                    emails=row['emails'],
                    job_level=row['job_level'],
                    company_industry=row['company_industry']
                )
                for row in rows
            ]
    
    def delete_session(self, session_id: str) -> bool:
        """Delete a session and all its jobs"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
            conn.commit()
            return cursor.rowcount > 0
    
    def export_session_csv(self, session_id: str) -> str:
        """Export session jobs to CSV format"""
        import csv
        import io
        
        jobs = self.get_session_jobs(session_id)
        
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=[
            'site', 'title', 'company', 'location_city', 'location_state',
            'job_type', 'min_amount', 'max_amount', 'job_url', 'description'
        ])
        
        writer.writeheader()
        for job in jobs:
            writer.writerow({
                'site': job.site,
                'title': job.title,
                'company': job.company,
                'location_city': job.location_city,
                'location_state': job.location_state,
                'job_type': job.job_type,
                'min_amount': job.min_amount,
                'max_amount': job.max_amount,
                'job_url': job.job_url,
                'description': job.description[:200] if job.description else ''
            })
        
        return output.getvalue()