from datetime import datetime, timedelta

import pytest

from core.validators import ScrapeValidationError, validate_scrape_config
from models.app_settings import AppSettingsUpdate
from models.scrape_config import JobSite, JobType, ScrapeConfig
from utils.clean_description import clean_description
from utils.compensation_extractor import extract_compensation_from_text
from utils.job_tags import extract_tags
from utils.number_utils import safe_float


def test_clean_description_strips_noise_and_boilerplate():
    raw = """
    **Senior Python Developer**
    Build APIs, automate workflows, and own backend systems.
    Visit https://example.com/jobs for details.
    About Us: this section should disappear entirely.
    """

    cleaned = clean_description(raw)

    assert cleaned is not None
    assert "**" not in cleaned
    assert "https://example.com/jobs" not in cleaned
    assert "About Us" not in cleaned
    assert cleaned.startswith("Senior Python Developer")


@pytest.mark.parametrize("value", [None, "", "tiny text"])
def test_clean_description_returns_none_for_empty_or_too_short_values(value):
    assert clean_description(value) is None


def test_extract_compensation_from_range_and_single_values():
    assert extract_compensation_from_text("$120,000 to $150,000 yearly") == (
        120000.0,
        150000.0,
        "USD",
        "year",
    )

    assert extract_compensation_from_text("85,000 per year") == (
        85000.0,
        None,
        "INR",
        "year",
    )

    assert extract_compensation_from_text("compensation depends on experience") == (
        None,
        None,
        None,
        None,
    )


@pytest.mark.parametrize(
    ("raw_value", "expected"),
    [
        (120000, 120000.0),
        ("120,000", 120000.0),
        ("N/A", None),
        ("", None),
        (None, None),
    ],
)
def test_safe_float_handles_numbers_and_empty_values(raw_value, expected):
    assert safe_float(raw_value) == expected


def test_extract_tags_prioritizes_skill_role_and_work_mode():
    tags = extract_tags(
        {
            "title": "Python Backend Engineer",
            "description": "Create backend services with Python in a remote role.",
            "is_remote": True,
            "date_posted": (datetime.now() - timedelta(days=1)).isoformat(),
        }
    )

    assert "Python" in tags
    assert "Backend" in tags
    assert "Remote" in tags


def test_app_settings_update_normalizes_payload():
    changes = AppSettingsUpdate(
        default_location="  Pune  ",
        default_country_indeed="  INDIA ",
        default_sites=["linkedin", "invalid-site", "google"],
    )

    assert changes.normalized() == {
        "default_location": "Pune",
        "default_country_indeed": "india",
        "default_sites": ["linkedin", "google"],
    }


def test_validate_scrape_config_allows_supported_filters():
    config = ScrapeConfig(
        search_term="Python Developer",
        location="Remote",
        sites=[JobSite.LINKEDIN, JobSite.INDEED],
        country_indeed="india",
        hours_old=24,
    )

    validate_scrape_config(config)


def test_validate_scrape_config_rejects_conflicting_indeed_filters():
    config = ScrapeConfig(
        search_term="Python Developer",
        location="Remote",
        sites=[JobSite.INDEED],
        country_indeed="india",
        hours_old=24,
        job_type=JobType.FULLTIME,
        is_remote=True,
    )

    with pytest.raises(ScrapeValidationError, match="allow only ONE"):
        validate_scrape_config(config)


def test_validate_scrape_config_requires_country_for_indeed():
    config = ScrapeConfig(
        search_term="Python Developer",
        location="Remote",
        sites=[JobSite.INDEED],
        country_indeed="",
    )

    with pytest.raises(ScrapeValidationError, match="country_indeed is required"):
        validate_scrape_config(config)
