from pathlib import Path
import sys
import types
import uuid
import sqlite3

import pytest


ROOT_DIR = Path(__file__).resolve().parents[2]
BACKEND_DIR = ROOT_DIR / "src" / "backend"

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

config_module = types.ModuleType("config")
config_module.settings = types.SimpleNamespace(DB_PATH=ROOT_DIR / "tests" / "jobhive-test.db")
sys.modules.setdefault("config", config_module)


@pytest.fixture
def temp_db(monkeypatch):
    from database import connection

    db_uri = f"file:jobhive-test-{uuid.uuid4()}?mode=memory&cache=shared"

    def test_connect():
        conn = sqlite3.connect(db_uri, uri=True)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn

    master_connection = test_connect()
    monkeypatch.setattr(connection, "_connect", test_connect)
    monkeypatch.setattr(connection, "DB_PATH", Path("memory:jobhive-test.db"))
    connection.init_database()
    try:
        yield db_uri
    finally:
        master_connection.close()
