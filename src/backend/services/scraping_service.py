import uuid
import json
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

    # --------------------------------------------------
    # PUBLIC API (UNCHANGED)
    # --------------------------------------------------

    def start_scrape(
        self,
        config: ScrapeConfig,
        progress_callback: Optional[Callable] = None
    ) -> str:

        session_id = str(uuid.uuid4())

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
            self._scrape_and_save(session_id, config, progress_callback)
            self._update_session_status(session_id, SessionStatus.COMPLETED)

        except Exception as e:
            self._update_session_status(
                session_id,
                SessionStatus.FAILED,
                error_message=str(e)
            )
            raise

        finally:
            self.active_sessions.pop(session_id, None)

        return session_id

    # --------------------------------------------------
    # SCRAPING
    # --------------------------------------------------

    def _scrape_and_save(
        self,
        session_id: str,
        config: ScrapeConfig,
        progress_callback: Optional[Callable] = None
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
            progress_callback({
                "session_id": session_id,
                "status": "scraping",
                "message": f"Starting scrape for {config.search_term}",
            })

        jobs_df = scrape_jobs(**scrape_params)

        if jobs_df is None or jobs_df.empty:
            return

        jobs_saved = self._save_jobs_to_db(
            session_id, jobs_df, progress_callback
        )

        with get_db() as conn:
            conn.execute("""
                UPDATE sessions SET total_jobs = ? WHERE id = ?
            """, (jobs_saved, session_id))
            conn.commit()

    # --------------------------------------------------
    # SAVE (THIS IS WHERE THE BUGS WERE)
    # --------------------------------------------------

    def _save_jobs_to_db(
        self,
        session_id: str,
        jobs_df: pd.DataFrame,
        progress_callback: Optional[Callable] = None
    ) -> int:

        # 🔒 HARD NORMALIZATION (CRITICAL)
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

        total_jobs = len(jobs_df)
        jobs_saved = 0

        with get_db() as conn:
            cursor = conn.cursor()

            for _, row in jobs_df.iterrows():
                try:
                    # ---- LOCATION ----
                    city = state = country = None
                    if row["location"]:
                        parts = [p.strip() for p in row["location"].split(",")]
                        city = parts[0] if len(parts) > 0 else None
                        state = parts[1] if len(parts) > 1 else None
                        country = parts[2] if len(parts) > 2 else None

                    # ---- DESCRIPTION ----
                    raw_desc = row["description"] or ""
                    cleaned_desc = clean_description(raw_desc)

                    # ---- SALARY ----
                    min_amount = safe_float(row["min_amount"])
                    max_amount = safe_float(row["max_amount"])
                    currency = row["currency"]
                    interval = row["interval"]

                    if min_amount is None and max_amount is None:
                        extracted = extract_compensation_from_text(cleaned_desc)
                        if extracted:
                            min_amount, max_amount, currency, interval = extracted

                    # ---- DATE ----
                    date_posted = None
                    if row["date_posted"]:
                        try:
                            date_posted = pd.to_datetime(
                                row["date_posted"]
                            ).isoformat()
                        except Exception:
                            pass

                    # ---- REMOTE (FIXED) ----
                    is_remote = (
                        bool(row["is_remote"])
                        if row["is_remote"] is not None
                        else False
                    )

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
                        session_id,
                        row["site"],
                        row["title"],
                        row["company"],
                        row["company_url"],
                        row["job_url"],
                        country,
                        city,
                        state,
                        is_remote,
                        cleaned_desc,
                        tags,
                        row["job_type"],
                        interval,
                        min_amount,
                        max_amount,
                        currency,
                        date_posted,
                        row["emails"],
                        row["job_level"],
                        row["company_industry"],
                    ))

                    jobs_saved += 1

                    if progress_callback and jobs_saved % 10 == 0:
                        progress_callback({
                            "session_id": session_id,
                            "status": "saving",
                            "jobs_saved": jobs_saved,
                            "total": total_jobs,
                        })

                except Exception as e:
                    # 🔥 THIS WAS MISSING BEFORE
                    print("JOB SAVE FAILED:", row.get("site"), row.get("title"))
                    print(e)
                    continue

            conn.commit()

        return jobs_saved

    # --------------------------------------------------
    # SESSION STATUS (UNCHANGED)
    # --------------------------------------------------

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
