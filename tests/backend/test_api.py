from datetime import datetime, timedelta
import json
import pytest
from starlette.testclient import TestClient

from app import create_app
from database.connection import get_db


@pytest.fixture
def client(temp_db):
    app = create_app()
    with TestClient(app) as test_client:
        yield test_client


def insert_mock_session(
    session_id: str,
    *,
    search_term: str = "Python Developer",
    location: str = "Pune",
    created_at: str | None = None,
    completed_at: str | None = None,
    status: str = "completed",
    total_jobs: int = 0,
):
    created_at = created_at or datetime.now().isoformat()
    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO sessions (
                id, search_term, location, created_at, completed_at, status, total_jobs, config
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
            ),
        )
        conn.commit()


def insert_mock_job(
    session_id: str,
    *,
    site: str = "linkedin",
    title: str = "Backend Engineer",
    company: str = "Acme Corp",
    location_city: str = "Pune",
    is_remote: bool = False,
    min_amount: float | None = 100000,
    max_amount: float | None = 120000,
    currency: str | None = "USD",
):
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
                "https://acme.example",
                f"https://jobs.example/{session_id}/{site}",
                "India",
                location_city,
                "MH",
                int(is_remote),
                "Job description with Python and SQL",
                json.dumps(["Python"]),
                "fulltime",
                "yearly",
                min_amount,
                max_amount,
                currency,
                datetime.now().isoformat(),
                datetime.now().isoformat(),
                "jobs@acme.example",
                "mid",
                "Software",
            ),
        )
        conn.commit()


def test_health_endpoints(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

    res_api = client.get("/api/health")
    assert res_api.status_code == 200
    assert res_api.json()["status"] == "ok"


def test_system_stats_and_optimize(client):
    res = client.get("/api/system/stats")
    assert res.status_code == 200
    data = res.json()
    assert "total_sessions" in data
    assert "total_jobs" in data
    assert "db_size_mb" in data

    res_opt = client.post("/api/system/optimize")
    assert res_opt.status_code == 200
    assert res_opt.json()["ok"] is True


def test_presets_crud_api(client):
    # Create
    create_res = client.post(
        "/api/presets",
        json={
            "name": "Python Remote Test",
            "search_term": "Python",
            "location": "Remote",
            "config": {"sites": ["linkedin"]},
        },
    )
    assert create_res.status_code == 201
    preset = create_res.json()
    preset_id = preset["id"]
    assert preset["name"] == "Python Remote Test"

    # List
    list_res = client.get("/api/presets")
    assert list_res.status_code == 200
    items = list_res.json()
    assert any(p["id"] == preset_id for p in items)

    # Get by ID
    get_res = client.get(f"/api/presets/{preset_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == preset_id

    # Mark used
    use_res = client.post(f"/api/presets/{preset_id}/use")
    assert use_res.status_code == 200
    assert use_res.json()["ok"] is True

    # Delete
    del_res = client.delete(f"/api/presets/{preset_id}")
    assert del_res.status_code == 200
    assert del_res.json()["ok"] is True

    # Get after delete -> 404
    assert client.get(f"/api/presets/{preset_id}").status_code == 404


def test_settings_api(client):
    # Get initial
    get_res = client.get("/api/settings")
    assert get_res.status_code == 200
    initial = get_res.json()
    assert initial["theme"] in ["light", "dark", "system"]

    # Update
    put_res = client.put(
        "/api/settings",
        json={
            "theme": "dark",
            "default_location": "Berlin",
            "default_results_wanted": 25,
            "default_country_indeed": "germany",
            "default_sites": ["linkedin"],
        },
    )
    assert put_res.status_code == 200
    updated = put_res.json()
    assert updated["theme"] == "dark"
    assert updated["default_location"] == "Berlin"


def test_sessions_and_export_api(client):
    insert_mock_session("sess-1", search_term="Frontend Lead", location="London", total_jobs=1)
    insert_mock_job("sess-1", site="linkedin", title="Frontend Lead", company="TechCorp")

    # List sessions
    list_res = client.get("/api/sessions")
    assert list_res.status_code == 200
    assert any(s["id"] == "sess-1" for s in list_res.json())

    # Get session detail
    detail_res = client.get("/api/sessions/sess-1")
    assert detail_res.status_code == 200
    assert detail_res.json()["search_term"] == "Frontend Lead"

    # Get session jobs
    jobs_res = client.get("/api/sessions/sess-1/jobs")
    assert jobs_res.status_code == 200
    assert len(jobs_res.json()) == 1
    assert jobs_res.json()[0]["title"] == "Frontend Lead"

    # Export CSV
    csv_res = client.get("/api/sessions/sess-1/export/csv")
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    assert "Frontend Lead" in csv_res.text

    # Export JSON
    json_res = client.get("/api/sessions/sess-1/export/json")
    assert json_res.status_code == 200
    json_data = json_res.json()
    assert json_data["total_jobs"] == 1
    assert json_data["jobs"][0]["company"] == "TechCorp"

    # Delete session
    del_res = client.delete("/api/sessions/sess-1")
    assert del_res.status_code == 200
    assert client.get("/api/sessions/sess-1").status_code == 404


def test_jobs_global_search_api(client):
    insert_mock_session("sess-jobs", total_jobs=3)
    insert_mock_job("sess-jobs", site="linkedin", title="Go Engineer", company="CloudInc", is_remote=True, min_amount=150000, max_amount=180000)
    insert_mock_job("sess-jobs", site="indeed", title="React Developer", company="WebCo", is_remote=False, min_amount=80000, max_amount=90000)
    insert_mock_job("sess-jobs", site="google", title="Staff Go Architect", company="ScaleOps", is_remote=True, min_amount=200000, max_amount=250000)

    # Search query "Go"
    res_q = client.get("/api/jobs?q=Go")
    assert res_q.status_code == 200
    data_q = res_q.json()
    assert data_q["total"] == 2
    assert all("Go" in j["title"] for j in data_q["items"])

    # Filter site = "indeed"
    res_site = client.get("/api/jobs?site=indeed")
    assert res_site.status_code == 200
    assert res_site.json()["total"] == 1
    assert res_site.json()["items"][0]["company"] == "WebCo"

    # Filter remote only
    res_remote = client.get("/api/jobs?is_remote=true")
    assert res_remote.status_code == 200
    assert res_remote.json()["total"] == 2

    # Filter min_amount = 120000
    res_sal = client.get("/api/jobs?min_amount=120000")
    assert res_sal.status_code == 200
    assert res_sal.json()["total"] == 2

    # Single job lookup
    first_job_id = data_q["items"][0]["id"]
    res_single = client.get(f"/api/jobs/{first_job_id}")
    assert res_single.status_code == 200
    assert res_single.json()["id"] == first_job_id


def test_analytics_api_endpoints(client):
    insert_mock_session("s-a1", search_term="Python", location="Pune", total_jobs=1)
    insert_mock_job("s-a1", site="linkedin", title="Python Dev", company="A1")

    # Dashboard
    dash_res = client.get("/api/analytics/dashboard")
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["total_sessions"] >= 1
    assert dash_data["total_jobs"] >= 1

    # Timeline
    timeline_res = client.get("/api/analytics/timeline?days=7")
    assert timeline_res.status_code == 200
    assert isinstance(timeline_res.json(), list)

    # Popular searches
    pop_res = client.get("/api/analytics/popular-searches")
    assert pop_res.status_code == 200
    assert any(item["search_term"] == "Python" for item in pop_res.json())

    # Job stats
    stats_res = client.get("/api/analytics/job-stats")
    assert stats_res.status_code == 200
    assert "remote_distribution" in stats_res.json()


def test_scrape_start_validates_input(client, monkeypatch):
    from core.task_manager import task_manager

    # Mock submit_task to prevent actually running JobSpy in tests
    monkeypatch.setattr(task_manager, "submit_task", lambda *args, **kwargs: "mock-task")

    # Invalid: conflicting Indeed filters (both hours_old and is_remote)
    bad_res = client.post(
        "/api/scrape/start",
        json={
            "search_term": "Python",
            "sites": ["indeed"],
            "country_indeed": "india",
            "hours_old": 24,
            "is_remote": True,
        },
    )
    assert bad_res.status_code == 422
    assert "allow only ONE" in bad_res.json()["detail"]

    # Invalid: missing country_indeed for Indeed
    missing_country_res = client.post(
        "/api/scrape/start",
        json={
            "search_term": "Python",
            "sites": ["indeed"],
            "country_indeed": "",
        },
    )
    assert missing_country_res.status_code == 422
    assert "country_indeed is required" in missing_country_res.json()["detail"]

    # Valid: should succeed and return session_id
    good_res = client.post(
        "/api/scrape/start",
        json={
            "search_term": "Python Engineer",
            "location": "Remote",
            "sites": ["linkedin"],
            "results_wanted": 10,
        },
    )
    assert good_res.status_code == 200
    assert "session_id" in good_res.json()
    assert good_res.json()["status"] == "started"
