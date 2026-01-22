# src/backend/dev_server.py

import os
import uvicorn
from config import settings
from utils.logger import setup_logger


def main():
    os.environ.setdefault("ENV", "development")
    os.environ.setdefault("LOG_LEVEL", "DEBUG")

    logger = setup_logger()
    logger.info("Starting backend dev server")
    logger.debug(f"ENV={settings.ENV}")
    logger.debug(f"DATA_DIR={settings.DATA_DIR}")
    logger.debug(f"DB_PATH={settings.DB_PATH}")

    uvicorn.run(
        "app:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
        log_level="debug",
    )


if __name__ == "__main__":
    main()
