# src/backend/utils/paths.py

import sys
import os
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
        path = Path.cwd() / ".dev-data"
    else:
        if sys.platform == "win32":
            base = os.environ.get("APPDATA")
        elif sys.platform == "darwin":
            base = Path.home() / "Library" / "Application Support"
        else:
            base = Path.home() / ".config"

        app_dir = Path(base) / 'jobhive'
        app_dir.mkdir(parents=True, exist_ok=True)

        path = app_dir / "data"
    
    path.mkdir(parents=True, exist_ok=True)
    return path

def get_db_path() -> Path:
    data_dir = get_data_dir()
    return data_dir / "db" / "jobs.db"