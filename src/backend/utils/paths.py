# src/backend/utils/paths.py

from pathlib import Path
from utils.env import is_dev


def get_data_dir() -> Path:
    """
    Dev:
      backend/.dev-data

    Prod:
      ~/.jobhive  (Windows/macOS/Linux)
    """
    if is_dev():
        base_dir = Path(__file__).resolve().parents[2]  # src/backend
        path = base_dir / ".dev-data"
    else:
        path = Path.home() / ".jobhive"

    path.mkdir(parents=True, exist_ok=True)
    return path


def get_db_path() -> Path:
    data_dir = get_data_dir()
    return data_dir / "jobs.db"
