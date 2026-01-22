# src/backend/utils/env.py

import os


def get_env() -> str:
    return os.getenv("ENV", "development").lower()


def is_dev() -> bool:
    return get_env() in ("dev", "development")


def is_prod() -> bool:
    return get_env() in ("prod", "production")
