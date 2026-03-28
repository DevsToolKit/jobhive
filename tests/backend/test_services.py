import csv
import io
import json
from datetime import datetime, timedelta

import pandas as pd
import pytest

from database.connection import get_db
from models.preset import PresetCreate
from models.scrape_config import JobSite, ScrapeConfig
from services.analytics_service import AnalyticsService
from services.preset_service import PresetService
from services.scraping_service import ScrapingService
from services.session_service import SessionService
from services.settings_service import SettingsService


def insert_session(
    session_id: str,
    *,
    search_term: str = "Python Developer",
    location: str = "Pune",
    created_at: str | None = None,
    completed_at: str | None = None,
    status: str = "completed",
    total_jobs: int = 0,
    error_message: str | None = None,
):
    created_at = created_at or datetime.now().isoformat()

    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO sessions (
                id, search_term, location, created_at, completed_at, status, total_jobs, config, error_message
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                session_id,
                search_term,
                location,
                created_at,
                completed_at,
                status,
                total_jobs,
                json.dumps({"search_term": search_term, "location": location}),
                error_message,
            ),
        )
        conn.commit()


def insert_job(
    session_id: str,
    *,
    site: str = "linkedin",
    title: str = "Backend Engineer",
    company: str = "Acme",
    location_city: str = "Pune",
    location_state: str = "MH",
    location_country: str = "India",
    is_remote: bool = False,
    description: str = "A" * 250,
    job_type: str = "fulltime",
    interval: str = "yearly",
    min_amount: float | None = 100000,
    max_amount: float | None = 120000,
    currency: str | None = "USD",
    date_posted: str | None = None,
    scraped_at: str | None = None,
):
    date_posted = date_posted or datetime.now().isoformat()
    scraped_at = scraped_at or datetime.now().isoformat()

    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO jobs (
                session_id, site, title, company, company_url, job_url,
                location_country, location_city, location_state, is_remote,
                description, tags, job_type, interval, min_amount, max_amount,
                currency, date_posted, scraped_at, emails, job_level, company_industry
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                session_id,
                site,
                title,
                company,
                "https://company.example",
                f"https://jobs.example/{session_id}/{site}",
                location_country,
                location_city,
                location_state,
                int(is_remote),
                description,
                json.dumps(["Python"]),
                job_type,
                interval,
                min_amount,
                max_amount,
                currency,
                date_posted,
                scraped_at,
                "hello@example.com",
                "senior",
                "Software",
            ),
        )
        conn.commit()


def test_settings_service_persists_and_serializes_settings(temp_db):
    service = SettingsService()

    initial = service.get_settings()
    assert initial.theme == "system"
    assert initial.default_sites == []

    updated = service.update_settings(
        {
            "theme": "dark",
            "default_location": "Bengaluru",
            "default_results_wanted": 30,
            "default_country_indeed": "india",
            "default_sites": ["linkedin", "google"],
        }
    )

    assert updated.theme == "dark"
    assert updated.default_location == "Bengaluru"
    assert updated.default_results_wanted == 30
    assert updated.default_sites == ["linkedin", "google"]

    with get_db() as conn:
        row = conn.execute("SELECT default_sites FROM app_settings WHERE id = 1").fetchone()

    assert row["default_sites"] == json.dumps(["linkedin", "google"])


def test_preset_service_crud_and_usage_tracking(temp_db):
    service = PresetService()

    created = service.create_preset(
        PresetCreate(
            name="Python Remote",
            search_term="Python Developer",
            location="Remote",
            config={"sites": ["linkedin"]},
        )
    )

    assert created.name == "Python Remote"
    assert created.use_count == 0

    with pytest.raises(ValueError, match="already exists"):
        service.create_preset(
            PresetCreate(
                name="Python Remote",
                search_term="Duplicate",
                location="Remote",
                config={},
            )
        )

    second = service.create_preset(
        PresetCreate(
            name="Data Roles",
            search_term="Data Engineer",
            location="Pune",
            config={"sites": ["google"]},
        )
    )

    service.update_preset_usage(created.id)

    summaries = service.get_all_presets()
    assert [summary.id for summary in summaries] == [created.id, second.id]

    fetched = service.get_preset(created.id)
    assert fetched is not None
    assert fetched.use_count == 1
    assert fetched.last_used is not None

    assert service.delete_preset(created.id) is True
    assert service.get_preset(created.id) is None


def test_session_service_and_analytics_reflect_seeded_data(temp_db):
    recent = datetime.now() - timedelta(days=1)
    old = datetime.now() - timedelta(days=10)

    insert_session("s-recent", created_at=recent.isoformat(), total_jobs=2, status="completed")
    insert_session(
        "s-old",
        search_term="Data Engineer",
        location="Mumbai",
        created_at=old.isoformat(),
        completed_at=old.isoformat(),
        total_jobs=1,
        status="failed",
        error_message="network issue",
    )

    insert_job("s-recent", site="linkedin", is_remote=True, scraped_at=(recent + timedelta(hours=1)).isoformat())
    insert_job("s-recent", site="indeed", scraped_at=(recent + timedelta(hours=2)).isoformat())
    insert_job("s-old", site="linkedin", location_city="Mumbai", location_state="MH", is_remote=False)

    session_service = SessionService()
    analytics_service = AnalyticsService()

    sessions = session_service.get_all_sessions()
    assert [session.id for session in sessions] == ["s-recent", "s-old"]

    recent_session = session_service.get_session("s-recent")
    assert recent_session is not None
    assert recent_session.total_jobs == 2
    assert recent_session.error_message is None

    jobs = session_service.get_session_jobs("s-recent")
    assert [job.site for job in jobs] == ["indeed", "linkedin"]

    csv_rows = list(csv.DictReader(io.StringIO(session_service.export_session_csv("s-recent"))))
    assert len(csv_rows) == 2
    assert csv_rows[0]["site"] == "indeed"

    dashboard = analytics_service.get_dashboard_stats()
    assert dashboard["total_sessions"] == 2
    assert dashboard["total_jobs"] == 3
    assert dashboard["status_breakdown"] == {"completed": 1, "failed": 1}
    assert dashboard["jobs_by_site"] == {"linkedin": 2, "indeed": 1}
    assert dashboard["recent_sessions_7d"] == 1

    timeline = analytics_service.get_session_timeline(days=30)
    assert [entry["count"] for entry in timeline] == [1, 1]

    popular = analytics_service.get_popular_searches()
    assert {entry["search_term"] for entry in popular} == {"Python Developer", "Data Engineer"}

    job_stats = analytics_service.get_job_statistics()
    assert job_stats["remote_distribution"] == {"remote": 1, "onsite": 2}
    assert len(job_stats["salary_by_type"]) == 1
    assert job_stats["top_locations"][0]["city"] in {"Pune", "Mumbai"}

    assert session_service.delete_session("s-recent") is True
    assert session_service.get_session("s-recent") is None
    assert session_service.get_session_jobs("s-recent") == []


def test_scraping_service_saves_jobs_with_enrichment_and_progress(temp_db):
    insert_session("scrape-session", status="running")

    jobs_df = pd.DataFrame(
        [
            {
                "site": "linkedin",
                "title": "Senior Python Developer",
                "company": "Acme",
                "company_url": "https://company.example",
                "job_url": "https://jobs.example/1",
                "location": "Pune, MH, India",
                "is_remote": True,
                "description": """
                **Senior Python Developer**
                Build APIs and data pipelines with Python and SQL.
                Compensation: $120,000 to $150,000 yearly.
                About us: ignore this footer completely.
                """,
                "job_type": "fulltime",
                "interval": None,
                "min_amount": None,
                "max_amount": None,
                "currency": None,
                "date_posted": datetime.now().isoformat(),
                "emails": "hr@example.com",
                "job_level": "senior",
                "company_industry": "Software",
            },
            {
                "site": "indeed",
                "title": "Data Engineer",
                "company": "Beta",
                "company_url": "https://company.example/beta",
                "job_url": "https://jobs.example/2",
                "location": "Mumbai, MH, India",
                "is_remote": False,
                "description": "A" * 300,
                "job_type": "contract",
                "interval": "yearly",
                "min_amount": "95000",
                "max_amount": "110000",
                "currency": "USD",
                "date_posted": datetime.now().isoformat(),
                "emails": None,
                "job_level": None,
                "company_industry": "Data",
            },
        ]
    )

    events = []
    service = ScrapingService()

    saved = service._save_jobs_to_db(
        "scrape-session",
        jobs_df,
        events.append,
        start_time=datetime.now().timestamp() - 2,
        total_jobs=2,
    )

    assert saved == 2
    assert events[-1]["status"] == "completed"
    assert events[-1]["successful_jobs"] == 2

    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT site, location_city, location_state, location_country, is_remote,
                   description, min_amount, max_amount, currency, interval, tags
            FROM jobs
            WHERE session_id = ?
            ORDER BY site ASC
            """,
            ("scrape-session",),
        ).fetchall()

    indeed_row, linkedin_row = rows
    assert indeed_row["site"] == "indeed"
    assert indeed_row["min_amount"] == 95000
    assert indeed_row["max_amount"] == 110000
    assert linkedin_row["location_city"] == "Pune"
    assert linkedin_row["location_state"] == "MH"
    assert linkedin_row["location_country"] == "India"
    assert linkedin_row["is_remote"] == 1
    assert linkedin_row["min_amount"] == 120000
    assert linkedin_row["max_amount"] == 150000
    assert linkedin_row["currency"] == "USD"
    assert linkedin_row["interval"] == "year"
    assert "About us" not in linkedin_row["description"]
    assert "Python" in json.loads(linkedin_row["tags"])


def test_scraping_service_tracks_status_during_start_and_cancel(temp_db, monkeypatch):
    service = ScrapingService()
    callback_events = []
    captured = {}

    def fake_scrape_and_save(session_id, config, progress_callback, start_time):
        captured["session_id"] = session_id
        captured["config"] = config
        progress_callback({"status": "processing", "completed_jobs": 1})

    monkeypatch.setattr(service, "_scrape_and_save", fake_scrape_and_save)

    config = ScrapeConfig(
        search_term="Python Developer",
        location="Remote",
        sites=[JobSite.LINKEDIN],
        results_wanted=20,
        country_indeed="india",
    )

    service.start_scrape(config, "active-session", callback_events.append)

    status = service.get_session_status("active-session")
    assert status["status"] == "completed"
    assert captured["session_id"] == "active-session"
    assert callback_events[-1]["status"] == "completed"

    insert_session("cancel-me", status="running")
    service.active_sessions["cancel-me"] = {"status": "running", "progress": 10}
    assert service.cancel_scrape("cancel-me") is True
    assert service.get_session_status("cancel-me")["status"] == "cancelled"
