import sqlite3
from pathlib import Path
from contextlib import contextmanager

from utils.paths import get_db_path

DB_PATH: Path = get_db_path()


def _connect():
    db_path = get_db_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path, timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA synchronous = NORMAL")
    conn.execute("PRAGMA busy_timeout = 30000")
    return conn


def init_database():
    """Initialize database using schema.sql and configure pragmas"""
    schema_path = Path(__file__).parent / "schema.sql"

    with schema_path.open("r", encoding="utf-8") as f:
        schema = f.read()

    conn = _connect()
    try:
        conn.executescript(schema)
        conn.commit()
    finally:
        conn.close()

    print(f"Database initialized at: {get_db_path()}")


@contextmanager
def get_db():
    """Context manager for database connections"""
    conn = _connect()
    try:
        yield conn
    finally:
        conn.close()


def get_connection():
    """Direct database connection"""
    return _connect()
