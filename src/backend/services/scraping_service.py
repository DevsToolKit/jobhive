import json
import math
import time
from typing import Callable, Optional
import pandas as pd
from jobspy import scrape_jobs

from database.connection import get_db
from models.scrape_config import ScrapeConfig
from models.session import SessionStatus
from utils.clean_description import clean_description
from utils.compensation_extractor import extract_compensation_from_text
from utils.job_tags import extract_tags
from utils.logger import logger
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
                json.dumps(config.model_dump())
            ))
            conn.commit()

        self.active_sessions[session_id] = {
            "status": SessionStatus.RUNNING,
            "progress": 0
        }

        try:
            site_names = [site.value for site in config.sites]
            site_statuses = {s: {"status": "queued", "found": 0} for s in site_names}

            # Send initial progress with accurate target_jobs
            if progress_callback:
                progress_callback({
                    "session_id": session_id,
                    "status": "processing",
                    "search_term": config.search_term,
                    "location": config.location or "",
                    "target_jobs": config.results_wanted,
                    "total_jobs": config.results_wanted,
                    "completed_jobs": 0,
                    "successful_jobs": 0,
                    "failed_jobs": 0,
                    "progress_percent": 0,
                    "elapsed_time": 0,
                    "site_statuses": site_statuses,
                    "current_operation": f"Preparing search across {len(site_names)} platform{'s' if len(site_names) > 1 else ''}...",
                })

            save_result = self._scrape_and_save(session_id, config, progress_callback, start_time)
            final_saved = save_result[0] if isinstance(save_result, tuple) else 0
            final_site_statuses = save_result[1] if isinstance(save_result, tuple) else site_statuses
            final_recent_jobs = save_result[2] if isinstance(save_result, tuple) else []
            final_warnings = save_result[3] if isinstance(save_result, tuple) else []

            if not self.is_cancelled(session_id):
                self._update_session_status(session_id, SessionStatus.COMPLETED)

                if progress_callback:
                    elapsed = time.time() - start_time
                    # Get final total from DB
                    with get_db() as conn:
                        row = conn.execute("SELECT total_jobs FROM sessions WHERE id = ?", (session_id,)).fetchone()
                        final_total = row["total_jobs"] if row and row["total_jobs"] is not None else final_saved

                    progress_callback({
                        "session_id": session_id,
                        "status": "completed",
                        "search_term": config.search_term,
                        "location": config.location or "",
                        "target_jobs": config.results_wanted,
                        "total_jobs": final_total,
                        "completed_jobs": final_total,
                        "successful_jobs": final_total,
                        "progress_percent": 100,
                        "elapsed_time": elapsed,
                        "current_operation": f"Scraping completed. {final_total} jobs saved.",
                        "site_statuses": final_site_statuses,
                        "recent_jobs": final_recent_jobs[-10:],
                        "warnings": final_warnings,
                    })

        except Exception as e:
            if not self.is_cancelled(session_id):
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
                        "current_operation": f"Scraping stopped due to an error: {e}",
                    })
            raise

        finally:
            self.active_sessions.pop(session_id, None)

        return session_id

    def is_cancelled(self, session_id: str) -> bool:
        session = self.active_sessions.get(session_id)
        return bool(session and session.get("status") == SessionStatus.CANCELLED)

    def _scrape_and_save(
        self,
        session_id: str,
        config: ScrapeConfig,
        progress_callback: Optional[Callable],
        start_time: float
    ):
        site_names = [site.value for site in config.sites]
        target_total = config.results_wanted
        site_statuses = {s: {"status": "queued", "found": 0} for s in site_names}
        warnings = []
        recent_jobs = []
        seen_urls = set()

        total_saved = 0
        total_failed = 0

        for site_idx, site in enumerate(site_names):
            if self.is_cancelled(session_id):
                logger.info(f"Scrape cancelled for session {session_id}")
                break

            # If we have reached target_total, skip remaining sites
            if total_saved >= target_total:
                site_statuses[site] = {"status": "skipped", "found": 0}
                continue

            remaining_needed = target_total - total_saved
            # Request all remaining needed jobs for this site so that any shortfall from other sites is fulfilled
            site_target = remaining_needed

            site_statuses[site]["status"] = "scraping"
            site_label = site.capitalize()

            if progress_callback:
                elapsed = time.time() - start_time
                progress_callback({
                    "session_id": session_id,
                    "status": "scraping",
                    "search_term": config.search_term,
                    "location": config.location or "",
                    "target_jobs": target_total,
                    "total_jobs": target_total,
                    "completed_jobs": total_saved,
                    "successful_jobs": total_saved,
                    "failed_jobs": total_failed,
                    "progress_percent": min(100, round((total_saved / target_total) * 100)) if target_total > 0 else 0,
                    "elapsed_time": elapsed,
                    "current_site": site,
                    "site_statuses": site_statuses,
                    "current_operation": f"Searching {site_label} for '{config.search_term}'...",
                    "recent_jobs": recent_jobs[-6:] if recent_jobs else [],
                    "warnings": warnings,
                })

            scrape_params = {
                "site_name": site,
                "search_term": config.search_term,
                "results_wanted": site_target,
                "country_indeed": config.country_indeed,
            }

            if site == "linkedin":
                scrape_params.update({
                    "linkedin_fetch_description": True,
                    "verbose": 0,
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

            try:
                jobs_df = scrape_jobs(**scrape_params)
            except Exception as e:
                logger.warning(f"Error scraping {site}: {e}")
                site_statuses[site]["status"] = "error"
                warnings.append(f"{site_label} error: {str(e)[:80]}")
                continue

            if self.is_cancelled(session_id):
                break

            if jobs_df is None or jobs_df.empty:
                site_statuses[site]["status"] = "no_results"
                warnings.append(f"No results returned from {site_label}")
                continue

            site_statuses[site]["status"] = "saving"
            site_saved = 0

            # Normalize DataFrame
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

            with get_db() as conn:
                cursor = conn.cursor()

                for idx, row in jobs_df.iterrows():
                    if self.is_cancelled(session_id) or total_saved >= target_total:
                        break

                    job_url = row.get("job_url") or f"{site}_{idx}_{time.time()}"
                    if job_url in seen_urls:
                        continue
                    seen_urls.add(job_url)

                    job_start = time.time()
                    try:
                        city = state = country = None
                        if row["location"]:
                            parts = [p.strip() for p in row["location"].split(",")]
                            city = parts[0] if len(parts) > 0 else None
                            state = parts[1] if len(parts) > 1 else None
                            country = parts[2] if len(parts) > 2 else None

                        raw_desc = row["description"] or ""
                        cleaned_desc = clean_description(raw_desc)

                        min_amount = safe_float(row["min_amount"])
                        max_amount = safe_float(row["max_amount"])
                        currency = row["currency"]
                        interval = row["interval"]

                        if min_amount is None and max_amount is None:
                            extracted = extract_compensation_from_text(cleaned_desc)
                            if extracted:
                                min_amount, max_amount, currency, interval = extracted

                        date_posted = None
                        if row["date_posted"]:
                            try:
                                date_posted = pd.to_datetime(row["date_posted"]).isoformat()
                            except Exception:
                                pass

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
                            session_id, row["site"] or site, row["title"], row["company"],
                            row["company_url"], row["job_url"], country, city, state,
                            is_remote, cleaned_desc, tags, row["job_type"], interval,
                            min_amount, max_amount, currency, date_posted,
                            row["emails"], row["job_level"], row["company_industry"],
                        ))

                        total_saved += 1
                        site_saved += 1
                        job_duration = time.time() - job_start

                        job_item = {
                            "id": str(total_saved),
                            "url": row["job_url"] or "",
                            "title": row["title"] or "Untitled Role",
                            "company": row["company"] or "Unknown Company",
                            "location": row["location"] or "",
                            "site": row["site"] or site,
                            "status": "success",
                            "duration": job_duration,
                        }
                        recent_jobs.append(job_item)
                        if len(recent_jobs) > 10:
                            recent_jobs.pop(0)

                        if progress_callback:
                            elapsed = time.time() - start_time
                            progress_percent = min(100, round((total_saved / target_total) * 100)) if target_total > 0 else 0
                            avg_time = elapsed / total_saved if total_saved > 0 else 0
                            remaining = (target_total - total_saved) * avg_time if avg_time > 0 else 0

                            site_statuses[site]["found"] = site_saved

                            progress_callback({
                                "session_id": session_id,
                                "status": "processing",
                                "search_term": config.search_term,
                                "location": config.location or "",
                                "target_jobs": target_total,
                                "total_jobs": target_total,
                                "completed_jobs": total_saved,
                                "successful_jobs": total_saved,
                                "failed_jobs": total_failed,
                                "progress_percent": progress_percent,
                                "elapsed_time": elapsed,
                                "estimated_remaining": remaining,
                                "average_job_time": avg_time,
                                "jobs_per_second": total_saved / elapsed if elapsed > 0 else 0,
                                "success_rate": 100,
                                "current_site": site,
                                "site_statuses": site_statuses,
                                "current_operation": f"Found: {row['title']} @ {row['company']} ({site_label})",
                                "current_url": row["job_url"],
                                "recent_jobs": recent_jobs[-6:],
                                "warnings": warnings,
                            })

                        # Subtle pause for smooth real-time stream feel
                        time.sleep(0.02)

                    except Exception as e:
                        total_failed += 1
                        logger.warning(f"Failed to save job {row.get('site')} - {row.get('title')}: {e}")
                        job_duration = time.time() - job_start
                        recent_jobs.append({
                            "id": str(total_saved + total_failed),
                            "url": row.get("job_url", "unknown"),
                            "title": row.get("title", "Unknown"),
                            "company": row.get("company", "Unknown"),
                            "site": row.get("site") or site,
                            "status": "failed",
                            "duration": job_duration
                        })
                        if len(recent_jobs) > 10:
                            recent_jobs.pop(0)

                conn.commit()

            site_statuses[site]["status"] = "completed"
            site_statuses[site]["found"] = site_saved

        # Final database total update
        with get_db() as conn:
            conn.execute("""
                UPDATE sessions SET total_jobs = ? WHERE id = ?
            """, (total_saved, session_id))
            conn.commit()

        if total_saved == 0 and warnings and progress_callback:
            progress_callback({
                "session_id": session_id,
                "status": "completed",
                "target_jobs": target_total,
                "total_jobs": 0,
                "completed_jobs": 0,
                "successful_jobs": 0,
                "progress_percent": 100,
                "warnings": warnings or ["No jobs found matching the search criteria"],
                "current_operation": "Search finished with no listings found.",
                "site_statuses": site_statuses,
                "recent_jobs": recent_jobs,
            })

        return (total_saved, site_statuses, recent_jobs, warnings)

    def _save_jobs_to_db(
        self,
        session_id: str,
        jobs_df: pd.DataFrame,
        progress_callback: Optional[Callable],
        start_time: float,
        total_jobs: int
    ) -> int:
        """Saves a dataframe of jobs to the DB and emits progress events."""
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
                if self.is_cancelled(session_id):
                    logger.info(f"Stopping job save loop for cancelled session {session_id}")
                    break

                job_start = time.time()
                try:
                    city = state = country = None
                    if row["location"]:
                        parts = [p.strip() for p in row["location"].split(",")]
                        city = parts[0] if len(parts) > 0 else None
                        state = parts[1] if len(parts) > 1 else None
                        country = parts[2] if len(parts) > 2 else None

                    raw_desc = row["description"] or ""
                    cleaned_desc = clean_description(raw_desc)

                    min_amount = safe_float(row["min_amount"])
                    max_amount = safe_float(row["max_amount"])
                    currency = row["currency"]
                    interval = row["interval"]

                    if min_amount is None and max_amount is None:
                        extracted = extract_compensation_from_text(cleaned_desc)
                        if extracted:
                            min_amount, max_amount, currency, interval = extracted

                    date_posted = None
                    if row["date_posted"]:
                        try:
                            date_posted = pd.to_datetime(row["date_posted"]).isoformat()
                        except Exception:
                            pass

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

                    recent_jobs.append({
                        "id": str(idx),
                        "url": row["job_url"],
                        "title": row.get("title", ""),
                        "company": row.get("company", ""),
                        "location": row.get("location", ""),
                        "site": row.get("site", ""),
                        "status": "success",
                        "duration": job_duration
                    })
                    if len(recent_jobs) > 10:
                        recent_jobs.pop(0)

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
                    logger.warning(f"Failed to save job {row.get('site')} - {row.get('title')}: {e}")

                    job_duration = time.time() - job_start
                    recent_jobs.append({
                        "id": str(idx),
                        "url": row.get("job_url", "unknown"),
                        "title": row.get("title", "Unknown"),
                        "company": row.get("company", "Unknown"),
                        "status": "failed",
                        "duration": job_duration
                    })
                    if len(recent_jobs) > 10:
                        recent_jobs.pop(0)
                    continue

            conn.commit()

        if progress_callback and not self.is_cancelled(session_id):
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
            self.active_sessions[session_id]["status"] = SessionStatus.CANCELLED
            return True
        return False

    def get_session_status(self, session_id: str) -> Optional[dict]:
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
