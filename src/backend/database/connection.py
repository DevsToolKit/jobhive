import sqlite3
from pathlib import Path
from contextlib import contextmanager

from config import settings


# Single source of truth
DB_PATH: Path = settings.DB_PATH

# Ensure directory exists (safe, idempotent)
DB_PATH.parent.mkdir(parents=True, exist_ok=True)


def get_db_path() -> str:
    """Return database file path as string"""
    return str(DB_PATH)


def init_database():
    """Initialize database using schema.sql"""
    schema_path = Path(__file__).parent / "schema.sql"

    with schema_path.open("r", encoding="utf-8") as f:
        schema = f.read()

    conn = sqlite3.connect(DB_PATH)
    conn.executescript(schema)
    conn.commit()
    conn.close()

    print(f"Database initialized at: {DB_PATH}")


@contextmanager
def get_db():
    """Context manager for database connections"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def get_connection():
    """Direct database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn
