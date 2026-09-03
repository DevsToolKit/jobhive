from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from utils.paths import get_data_dir, get_db_path


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore"
    )

    # -----------------------------
    # Environment
    # -----------------------------
    ENV: str = "development"

    # -----------------------------
    # Server
    # -----------------------------
    HOST: str = "127.0.0.1"
    PORT: int = 8765

    # -----------------------------
    # Paths (resolved externally)
    # -----------------------------
    DATA_DIR: Path = get_data_dir()
    DB_PATH: Path = get_db_path()

    # -----------------------------
    # Scraping defaults
    # -----------------------------
    DEFAULT_RESULTS_WANTED: int = 50
    DEFAULT_DISTANCE: int = 50
    MAX_RESULTS_PER_SITE: int = 200

    # -----------------------------
    # Task management
    # -----------------------------
    MAX_CONCURRENT_SCRAPES: int = 3
    SCRAPE_TIMEOUT: int = 300

    # -----------------------------
    # Rate limiting
    # -----------------------------
    RATE_LIMIT_ENABLED: bool = False
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_PERIOD: int = 60


settings = Settings()
