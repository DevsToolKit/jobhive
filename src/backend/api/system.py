import os
import sqlite3
from fastapi import APIRouter, HTTPException

from database.connection import get_db
from utils.paths import get_db_path

router = APIRouter(prefix="/api/system", tags=["system"])


@router.get("/stats")
async def get_system_stats():
    """Get system and database storage statistics"""
    db_path = get_db_path()
    size_bytes = os.path.getsize(db_path) if db_path.exists() else 0
    size_mb = round(size_bytes / (1024 * 1024), 2)

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as c FROM sessions")
        total_sessions = cursor.fetchone()["c"]

        cursor.execute("SELECT COUNT(*) as c FROM jobs")
        total_jobs = cursor.fetchone()["c"]

        cursor.execute("SELECT COUNT(*) as c FROM presets")
        total_presets = cursor.fetchone()["c"]

        cursor.execute("SELECT sqlite_version()")
        sqlite_version = cursor.fetchone()[0]

    return {
        "db_path": str(db_path),
        "db_size_mb": size_mb,
        "db_size_bytes": size_bytes,
        "total_sessions": total_sessions,
        "total_jobs": total_jobs,
        "total_presets": total_presets,
        "sqlite_version": sqlite_version,
    }


@router.post("/optimize")
async def optimize_database():
    """Run VACUUM and ANALYZE on SQLite database to reclaim disk space and optimize queries"""
    try:
        with get_db() as conn:
            conn.execute("PRAGMA optimize")
            conn.execute("VACUUM")
        return {"ok": True, "message": "Database optimized successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
