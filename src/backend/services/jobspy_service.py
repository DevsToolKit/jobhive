# src/backend/services/jobspy_service.py
from typing import List, Dict, Any
from jobspy import scrape_jobs
from models.scrape_config import ScrapeConfig


def run_jobspy(config: ScrapeConfig) -> List[Dict[str, Any]]:
    """
    Executes JobSpy and returns raw job records as dicts.
    No validation, no persistence, no events.
    """

    jobs_df = scrape_jobs(
        site_name=config.sources,
        search_term=config.job_title,
        google_search_term=config.google_search_term,
        location=config.location,
        results_wanted=config.max_results,
        job_type=config.job_type,
        is_remote=config.is_remote,
        hours_old=config.hours_old,
        country_indeed=config.country_indeed,
        linkedin_fetch_description=config.linkedin_fetch_description,
        verbose=0, 
    )

    # Convert DataFrame → list of dicts
    return jobs_df.to_dict("records")
