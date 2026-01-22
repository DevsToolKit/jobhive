# src/backend/core/validators.py
from models.scrape_config import ScrapeConfig

class ScrapeValidationError(Exception):
    pass


def validate_scrape_config(config: ScrapeConfig) -> None:
    """
    Enforces JobSpy site-specific constraints.
    Raises ScrapeValidationError if invalid.
    """

    # -------------------------
    # Indeed / Glassdoor rules
    # -------------------------
    if any(site in ["indeed", "glassdoor"] for site in config.sources):
        active_filters = [
            bool(config.hours_old),
            bool(config.job_type or config.is_remote),
        ]

        if sum(active_filters) > 1:
            raise ScrapeValidationError(
                "Indeed/Glassdoor allow only ONE of: "
                "hours_old OR job_type/is_remote"
            )

        if not config.country_indeed:
            raise ScrapeValidationError(
                "country_indeed is required for Indeed/Glassdoor"
            )

    # -------------------------
    # LinkedIn rules
    # -------------------------
    if "linkedin" in config.sources:
        if config.hours_old and config.linkedin_fetch_description:
            raise ScrapeValidationError(
                "LinkedIn allows only one of: hours_old OR linkedin_fetch_description"
            )

    # -------------------------
    # Google rules
    # -------------------------
    if "google" in config.sources and not config.google_search_term:
        raise ScrapeValidationError(
            "google_search_term is required when using Google jobs"
        )
