import os
from pathlib import Path
import sys
from utils.env import is_dev


def get_data_dir() -> Path:
    """
    Priority:
    1. DATA_DIR environment variable (set by Electron or test runner)
    2. Dev mode: Path.cwd() / ".dev-data"
    3. Production: OS-specific Application Support / AppData / .config folder
    """
    env_data_dir = os.environ.get("DATA_DIR")
    if env_data_dir:
        path = Path(env_data_dir)
    elif is_dev():
        path = Path.cwd() / ".dev-data"
    else:
        if sys.platform == "win32":
            base = os.environ.get("APPDATA") or Path.home() / "AppData" / "Roaming"
        elif sys.platform == "darwin":
            base = Path.home() / "Library" / "Application Support"
        else:
            base = Path.home() / ".config"

        app_dir = Path(base) / "jobhive"
        app_dir.mkdir(parents=True, exist_ok=True)
        path = app_dir / "data"

    path.mkdir(parents=True, exist_ok=True)
    return path


def get_db_path() -> Path:
    """
    Returns the SQLite database file path.
    Supports DB_PATH environment override if provided.
    """
    env_db = os.environ.get("DB_PATH")
    if env_db:
        return Path(env_db)
    data_dir = get_data_dir()
    db_file = data_dir / "db" / "jobs.db"
    db_file.parent.mkdir(parents=True, exist_ok=True)
    return db_file