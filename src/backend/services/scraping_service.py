import uuid
import json
from datetime import datetime
from typing import Optional, Callable
from jobspy import scrape_jobs
import pandas as pd

from database.connection import get_db
from models.scrape_config import ScrapeConfig
from models.session import SessionStatus
from models.job import Job

class ScrapingService:
    def __init__(self):
        self.active_sessions = {}  # Track active scraping sessions
    
    def start_scrape(
        self,
        config: ScrapeConfig,
        progress_callback: Optional[Callable] = None
    ) -> str:
        """
        Start a new scraping session
        
        Args:
            config: Scrape configuration
            progress_callback: Function to call with progress updates
            
        Returns:
            session_id: Unique identifier for this scrape session
        """
        # Generate session ID
        session_id = str(uuid.uuid4())
        
        # Save session to database
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO sessions (id, search_term, location, status, config)
                VALUES (?, ?, ?, ?, ?)
            """, (
                session_id,
                config.search_term,
                config.location,
                SessionStatus.RUNNING.value,
                json.dumps(config.dict())
            ))
            conn.commit()
        
        # Track as active
        self.active_sessions[session_id] = {
            'status': SessionStatus.RUNNING,
            'progress': 0,
            'total': 0,
            'current_site': None
        }
        
        try:
            # Perform scraping
            self._scrape_and_save(session_id, config, progress_callback)
            
            # Mark as completed
            self._update_session_status(session_id, SessionStatus.COMPLETED)
            
        except Exception as e:
            # Mark as failed
            self._update_session_status(
                session_id,
                SessionStatus.FAILED,
                error_message=str(e)
            )
            raise
        finally:
            # Remove from active sessions
            if session_id in self.active_sessions:
                del self.active_sessions[session_id]
        
        return session_id
    
    def _scrape_and_save(
        self,
        session_id: str,
        config: ScrapeConfig,
        progress_callback: Optional[Callable] = None
    ):
        """Execute scraping and save results to database"""
        
        # Convert site enums to strings
        site_names = [site.value for site in config.sites]
        
        # Prepare JobSpy parameters
        scrape_params = {
            'site_name': site_names,
            'search_term': config.search_term,
            'results_wanted': config.results_wanted,
            'country_indeed': config.country_indeed,
        }
        
        # Add optional parameters
        if config.location:
            scrape_params['location'] = config.location
        if config.distance:
            scrape_params['distance'] = config.distance
        if config.job_type:
            scrape_params['job_type'] = config.job_type.value
        if config.is_remote is not None:
            scrape_params['is_remote'] = config.is_remote
        if config.hours_old:
            scrape_params['hours_old'] = config.hours_old
        if config.offset:
            scrape_params['offset'] = config.offset
        
        # Progress tracking
        total_sites = len(site_names)
        current_site_index = 0
        
        # Callback for progress updates
        if progress_callback:
            progress_callback({
                'session_id': session_id,
                'status': 'scraping',
                'message': f'Starting scrape for {config.search_term}...',
                'progress': 0,
                'total_sites': total_sites,
                'current_site': site_names[0] if site_names else None
            })
        
        # Execute scraping
        try:
            jobs_df = scrape_jobs(**scrape_params)
            
            if jobs_df is None or jobs_df.empty:
                if progress_callback:
                    progress_callback({
                        'session_id': session_id,
                        'status': 'completed',
                        'message': 'No jobs found',
                        'jobs_count': 0
                    })
                return
            
            # Save jobs to database
            jobs_saved = self._save_jobs_to_db(session_id, jobs_df, progress_callback)
            
            # Update session with total count
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE sessions 
                    SET total_jobs = ?
                    WHERE id = ?
                """, (jobs_saved, session_id))
                conn.commit()
            
            # Final progress update
            if progress_callback:
                progress_callback({
                    'session_id': session_id,
                    'status': 'completed',
                    'message': f'Scraping complete! Found {jobs_saved} jobs',
                    'jobs_count': jobs_saved,
                    'progress': 100
                })
        
        except Exception as e:
            if progress_callback:
                progress_callback({
                    'session_id': session_id,
                    'status': 'error',
                    'message': f'Scraping failed: {str(e)}',
                    'error': str(e)
                })
            raise
    
    def _save_jobs_to_db(
        self,
        session_id: str,
        jobs_df: pd.DataFrame,
        progress_callback: Optional[Callable] = None
    ) -> int:
        """Save jobs from DataFrame to database"""
        
        total_jobs = len(jobs_df)
        jobs_saved = 0
        
        with get_db() as conn:
            cursor = conn.cursor()
            
            for idx, row in jobs_df.iterrows():
                # Parse location
                location_parts = str(row.get('location', '')).split(', ')
                location_city = location_parts[0] if len(location_parts) > 0 else None
                location_state = location_parts[1] if len(location_parts) > 1 else None
                location_country = location_parts[2] if len(location_parts) > 2 else None
                
                # Insert job
                cursor.execute("""
                    INSERT INTO jobs (
                        session_id, site, title, company, company_url, job_url,
                        location_country, location_city, location_state,
                        is_remote, description, job_type, interval,
                        min_amount, max_amount, currency, date_posted,
                        emails, job_level, company_industry
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    session_id,
                    str(row.get('site', '')),
                    str(row.get('title', '')),
                    str(row.get('company', '')) if pd.notna(row.get('company')) else None,
                    str(row.get('company_url', '')) if pd.notna(row.get('company_url')) else None,
                    str(row.get('job_url', '')) if pd.notna(row.get('job_url')) else None,
                    location_country,
                    location_city,
                    location_state,
                    bool(row.get('is_remote', False)),
                    str(row.get('description', '')) if pd.notna(row.get('description')) else None,
                    str(row.get('job_type', '')) if pd.notna(row.get('job_type')) else None,
                    str(row.get('interval', '')) if pd.notna(row.get('interval')) else None,
                    float(row.get('min_amount')) if pd.notna(row.get('min_amount')) else None,
                    float(row.get('max_amount')) if pd.notna(row.get('max_amount')) else None,
                    str(row.get('currency', '')) if pd.notna(row.get('currency')) else None,
                    row.get('date_posted') if pd.notna(row.get('date_posted')) else None,
                    str(row.get('emails', '')) if pd.notna(row.get('emails')) else None,
                    str(row.get('job_level', '')) if pd.notna(row.get('job_level')) else None,
                    str(row.get('company_industry', '')) if pd.notna(row.get('company_industry')) else None,
                ))
                
                jobs_saved += 1
                
                # Send progress update every 10 jobs
                if progress_callback and jobs_saved % 10 == 0:
                    progress_callback({
                        'session_id': session_id,
                        'status': 'saving',
                        'message': f'Saved {jobs_saved}/{total_jobs} jobs...',
                        'jobs_count': jobs_saved,
                        'progress': int((jobs_saved / total_jobs) * 100)
                    })
            
            conn.commit()
        
        return jobs_saved
    
    def _update_session_status(
        self,
        session_id: str,
        status: SessionStatus,
        error_message: Optional[str] = None
    ):
        """Update session status in database"""
        with get_db() as conn:
            cursor = conn.cursor()
            
            if status == SessionStatus.COMPLETED:
                cursor.execute("""
                    UPDATE sessions 
                    SET status = ?, completed_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (status.value, session_id))
            else:
                cursor.execute("""
                    UPDATE sessions 
                    SET status = ?, error_message = ?, completed_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (status.value, error_message, session_id))
            
            conn.commit()
    
    def cancel_scrape(self, session_id: str) -> bool:
        """Cancel an active scraping session"""
        if session_id in self.active_sessions:
            self.active_sessions[session_id]['status'] = SessionStatus.CANCELLED
            self._update_session_status(session_id, SessionStatus.CANCELLED)
            return True
        return False
    
    def get_session_status(self, session_id: str) -> dict:
        """Get current status of a scraping session"""
        if session_id in self.active_sessions:
            return self.active_sessions[session_id]
        
        # Check database
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT status, total_jobs, error_message
                FROM sessions
                WHERE id = ?
            """, (session_id,))
            
            row = cursor.fetchone()
            if row:
                return {
                    'status': row['status'],
                    'total_jobs': row['total_jobs'],
                    'error_message': row['error_message']
                }
        
        return None