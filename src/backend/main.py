import os
import sys
import subprocess
from pathlib import Path


def require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        print(f"ERROR: Required env var '{name}' not set by Electron", file=sys.stderr)
        sys.exit(1)
    return value


def main():
    require_env("ENV")
    require_env("BACKEND_PORT")
    require_env("DATA_DIR")

    port = os.environ["BACKEND_PORT"]

    # 🔥 Backend root (where app.py lives)
    backend_root = Path(__file__).parent.resolve()

    env = os.environ.copy()
    env["PYTHONPATH"] = str(backend_root)

    cmd = [
        sys.executable,
        "-m",
        "uvicorn",
        "app:app",
        "--host",
        "127.0.0.1",
        "--port",
        port,
        "--log-level",
        "info",
        "--no-access-log",
    ]

    # 🚀 Start uvicorn in the backend directory
    process = subprocess.Popen(
        cmd,
        cwd=str(backend_root),
        env=env,
    )

    # ✅ NOW we can safely notify Electron
    print(f"Server started on http://127.0.0.1:{port}", flush=True)

    process.wait()


if __name__ == "__main__":
    main()
