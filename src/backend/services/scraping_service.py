import json
import time
from typing import Optional, Callable
from jobspy import scrape_jobs
import pandas as pd

from database.connection import get_db
from models.scrape_config import ScrapeConfig
from models.session import SessionStatus

from utils.clean_description import clean_description
from utils.job_tags import extract_tags
from utils.compensation_extractor import extract_compensation_from_text
from utils.number_utils import safe_float


class ScrapingService:
    def __init__(self):
        self.active_sessions = {}

    def start_scrape(
        self,
        config: ScrapeConfig,
        session_id: str,
        progress_callback: Optional[Callable] = None
    ) -> str:
        start_time = time.time()

        with get_db() as conn:
            conn.execute("""
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

        self.active_sessions[session_id] = {
            "status": SessionStatus.RUNNING,
            "progress": 0
        }

        try:
            # Send initial progress
            if progress_callback:
                progress_callback({
                    "session_id": session_id,
                    "status": "processing",
                    "total_jobs": 0,
                    "completed_jobs": 0,
                    "successful_jobs": 0,
                    "failed_jobs": 0,
                    "elapsed_time": 0,
                    "current_operation": "Initializing scrape...",
                })

            self._scrape_and_save(session_id, config, progress_callback, start_time)
            self._update_session_status(session_id, SessionStatus.COMPLETED)

            # Send final completion progress
            if progress_callback:
                elapsed = time.time() - start_time
                progress_callback({
                    "session_id": session_id,
                    "status": "completed",
                    "elapsed_time": elapsed,
                    "current_operation": "Scraping completed successfully",
                })

        except Exception as e:
            self._update_session_status(
                session_id,
                SessionStatus.FAILED,
                error_message=str(e)
            )
            
            if progress_callback:
                progress_callback({
                    "session_id": session_id,
                    "status": "error",
                    "error_message": str(e),
                })
            raise

        finally:
            self.active_sessions.pop(session_id, None)

        return session_id

    def _scrape_and_save(
        self,
        session_id: str,
        config: ScrapeConfig,
        progress_callback: Optional[Callable],
        start_time: float
    ):
        site_names = [site.value for site in config.sites]

        scrape_params = {
            "site_name": site_names,
            "search_term": config.search_term,
            "results_wanted": config.results_wanted,
            "country_indeed": config.country_indeed,
        }

        if "linkedin" in site_names:
            scrape_params.update({
                "linkedin_fetch_description": True,
                "verbose": 1,
            })

        if config.location:
            scrape_params["location"] = config.location
        if config.distance:
            scrape_params["distance"] = config.distance
        if config.job_type:
            scrape_params["job_type"] = config.job_type.value
        if config.is_remote is not None:
            scrape_params["is_remote"] = config.is_remote
        if config.hours_old:
            scrape_params["hours_old"] = config.hours_old
        if config.offset:
            scrape_params["offset"] = config.offset
        
        if progress_callback:
            elapsed = time.time() - start_time
            progress_callback({
                "session_id": session_id,
                "status": "processing",
                "elapsed_time": elapsed,
                "current_operation": f"Scraping jobs from {', '.join(site_names)}...",
            })

        jobs_df = scrape_jobs(**scrape_params)

        if jobs_df is None or jobs_df.empty:
            if progress_callback:
                progress_callback({
                    "session_id": session_id,
                    "status": "completed",
                    "total_jobs": 0,
                    "completed_jobs": 0,
                    "successful_jobs": 0,
                    "warnings": ["No jobs found matching the search criteria"],
                })
            return

        total_jobs = len(jobs_df)
        
        if progress_callback:
            elapsed = time.time() - start_time
            progress_callback({
                "session_id": session_id,
                "status": "processing",
                "total_jobs": total_jobs,
                "completed_jobs": 0,
                "elapsed_time": elapsed,
                "current_operation": f"Found {total_jobs} jobs, now saving to database...",
            })

        jobs_saved = self._save_jobs_to_db(
            session_id, jobs_df, progress_callback, start_time, total_jobs
        )

        with get_db() as conn:
            conn.execute("""
                UPDATE sessions SET total_jobs = ? WHERE id = ?
            """, (jobs_saved, session_id))
            conn.commit()

    def _save_jobs_to_db(
        self,
        session_id: str,
        jobs_df: pd.DataFrame,
        progress_callback: Optional[Callable],
        start_time: float,
        total_jobs: int
    ) -> int:

        # Normalization
        jobs_df = jobs_df.replace({pd.NaT: None})
        jobs_df = jobs_df.where(pd.notna(jobs_df), None)

        REQUIRED_COLUMNS = [
            "site", "title", "company", "company_url", "job_url",
            "location", "is_remote", "description", "job_type",
            "interval", "min_amount", "max_amount", "currency",
            "date_posted", "emails", "job_level", "company_industry"
        ]

        for col in REQUIRED_COLUMNS:
            if col not in jobs_df.columns:
                jobs_df[col] = None

        jobs_saved = 0
        failed_jobs = 0
        recent_jobs = []

        with get_db() as conn:
            cursor = conn.cursor()

            for idx, row in jobs_df.iterrows():
                job_start = time.time()
                try:
                    # Location parsing
                    city = state = country = None
                    if row["location"]:
                        parts = [p.strip() for p in row["location"].split(",")]
                        city = parts[0] if len(parts) > 0 else None
                        state = parts[1] if len(parts) > 1 else None
                        country = parts[2] if len(parts) > 2 else None

                    # Description cleaning
                    raw_desc = row["description"] or ""
                    cleaned_desc = clean_description(raw_desc)

                    # Salary extraction
                    min_amount = safe_float(row["min_amount"])
                    max_amount = safe_float(row["max_amount"])
                    currency = row["currency"]
                    interval = row["interval"]

                    if min_amount is None and max_amount is None:
                        extracted = extract_compensation_from_text(cleaned_desc)
                        if extracted:
                            min_amount, max_amount, currency, interval = extracted

                    # Date parsing
                    date_posted = None
                    if row["date_posted"]:
                        try:
                            date_posted = pd.to_datetime(row["date_posted"]).isoformat()
                        except Exception:
                            pass

                    # Remote flag
                    is_remote = bool(row["is_remote"]) if row["is_remote"] is not None else False

                    tags = json.dumps(extract_tags(row))

                    cursor.execute("""
                        INSERT INTO jobs (
                            session_id, site, title, company, company_url, job_url,
                            location_country, location_city, location_state,
                            is_remote, description, tags, job_type, interval,
                            min_amount, max_amount, currency, date_posted,
                            emails, job_level, company_industry
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        session_id, row["site"], row["title"], row["company"],
                        row["company_url"], row["job_url"], country, city, state,
                        is_remote, cleaned_desc, tags, row["job_type"], interval,
                        min_amount, max_amount, currency, date_posted,
                        row["emails"], row["job_level"], row["company_industry"],
                    ))

                    jobs_saved += 1
                    job_duration = time.time() - job_start
                    
                    # Track recent jobs
                    recent_jobs.append({
                        "id": str(idx),
                        "url": row["job_url"],
                        "status": "success",
                        "duration": job_duration
                    })
                    if len(recent_jobs) > 5:
                        recent_jobs.pop(0)

                    # Send progress update every job or every 5 jobs
                    if progress_callback and (jobs_saved % 5 == 0 or jobs_saved == total_jobs):
                        elapsed = time.time() - start_time
                        completed = jobs_saved + failed_jobs
                        progress_percent = (completed / total_jobs * 100) if total_jobs > 0 else 0
                        avg_time = elapsed / completed if completed > 0 else 0
                        remaining = (total_jobs - completed) * avg_time if avg_time > 0 else 0
                        
                        progress_callback({
                            "session_id": session_id,
                            "status": "processing",
                            "total_jobs": total_jobs,
                            "completed_jobs": completed,
                            "successful_jobs": jobs_saved,
                            "failed_jobs": failed_jobs,
                            "progress_percent": progress_percent,
                            "elapsed_time": elapsed,
                            "estimated_remaining": remaining,
                            "average_job_time": avg_time,
                            "jobs_per_second": completed / elapsed if elapsed > 0 else 0,
                            "success_rate": (jobs_saved / completed * 100) if completed > 0 else 0,
                            "current_operation": f"Saving job {completed}/{total_jobs}",
                            "current_url": row["job_url"],
                            "recent_jobs": recent_jobs.copy(),
                        })

                except Exception as e:
                    failed_jobs += 1
                    print(f"JOB SAVE FAILED: {row.get('site')} - {row.get('title')}")
                    print(e)
                    
                    job_duration = time.time() - job_start
                    recent_jobs.append({
                        "id": str(idx),
                        "url": row.get("job_url", "unknown"),
                        "status": "failed",
                        "duration": job_duration
                    })
                    if len(recent_jobs) > 5:
                        recent_jobs.pop(0)
                    continue

            conn.commit()

        # Final progress update
        if progress_callback:
            elapsed = time.time() - start_time
            progress_callback({
                "session_id": session_id,
                "status": "completed",
                "total_jobs": total_jobs,
                "completed_jobs": total_jobs,
                "successful_jobs": jobs_saved,
                "failed_jobs": failed_jobs,
                "progress_percent": 100,
                "elapsed_time": elapsed,
                "jobs_per_second": total_jobs / elapsed if elapsed > 0 else 0,
                "success_rate": (jobs_saved / total_jobs * 100) if total_jobs > 0 else 0,
                "current_operation": "All jobs saved successfully",
                "recent_jobs": recent_jobs,
            })

        return jobs_saved

    def _update_session_status(
        self,
        session_id: str,
        status: SessionStatus,
        error_message: Optional[str] = None
    ):
        with get_db() as conn:
            if status == SessionStatus.COMPLETED:
                conn.execute("""
                    UPDATE sessions
                    SET status = ?, completed_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (status.value, session_id))
            else:
                conn.execute("""
                    UPDATE sessions
                    SET status = ?, error_message = ?, completed_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (status.value, error_message, session_id))
            conn.commit()

    def cancel_scrape(self, session_id: str) -> bool:
        if session_id in self.active_sessions:
            self._update_session_status(session_id, SessionStatus.CANCELLED)
            self.active_sessions.pop(session_id, None)
            return True
        return False

    def get_session_status(self, session_id: str) -> dict:
        if session_id in self.active_sessions:
            return self.active_sessions[session_id]

        with get_db() as conn:
            row = conn.execute("""
                SELECT status, total_jobs, error_message
                FROM sessions WHERE id = ?
            """, (session_id,)).fetchone()

            if row:
                return dict(row)

        return None
