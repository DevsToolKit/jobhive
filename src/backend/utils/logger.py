import logging
import sys
from datetime import datetime
from pathlib import Path

from utils.env import is_dev
from utils.paths import get_data_dir


def setup_logger(name: str = "jobhive") -> logging.Logger:
    logger = logging.getLogger(name)

    if logger.handlers:
        return logger

    logger.setLevel(logging.DEBUG if is_dev() else logging.INFO)

    # -----------------------------
    # Console handler
    # -----------------------------
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.DEBUG if is_dev() else logging.INFO)

    console_formatter = logging.Formatter(
        "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)

    # -----------------------------
    # File handler (dev + prod)
    # -----------------------------
    log_dir: Path = get_data_dir() / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)

    log_file = log_dir / f"jobhive_{datetime.now():%Y%m%d}.log"

    file_handler = logging.FileHandler(log_file, encoding="utf-8")
    file_handler.setLevel(logging.DEBUG)

    file_formatter = logging.Formatter(
        "%(asctime)s | %(levelname)s | %(name)s | "
        "%(filename)s:%(lineno)d | %(message)s"
    )
    file_handler.setFormatter(file_formatter)
    logger.addHandler(file_handler)

    logger.propagate = False
    return logger


logger = setup_logger()
