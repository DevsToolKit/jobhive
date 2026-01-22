import os
import sys
import uvicorn

from config import settings
from utils.logger import setup_logger


def main():
    # Production / Electron startup
    os.environ.setdefault("ENV", "production")

    # These MUST be provided by Electron
    if not os.getenv("BACKEND_PORT") or not os.getenv("DATA_DIR"):
        print("ERROR: BACKEND_PORT and DATA_DIR must be set by Electron", file=sys.stderr)
        sys.exit(1)

    logger = setup_logger()
    logger.info("Starting backend (production mode)")
    logger.info(f"ENV={settings.ENV}")
    logger.info(f"DATA_DIR={settings.DATA_DIR}")
    logger.info(f"DB_PATH={settings.DB_PATH}")
    logger.info(f"PORT={settings.PORT}")

    # ⚠️ CRITICAL: This message tells Electron the server is ready
    print(f"Server started on http://{settings.HOST}:{settings.PORT}", flush=True)
    sys.stdout.flush()

    uvicorn.run(
        "app:app",
        host=settings.HOST,
        port=settings.PORT,
        log_level="info",
        access_log=False,
    )


if __name__ == "__main__":
    main()