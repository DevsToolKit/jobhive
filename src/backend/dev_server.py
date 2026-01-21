# src/backend/dev_server.py
import uvicorn
from pathlib import Path
import os

def main():

    os.environ.setdefault("BACKEND_PORT", "8000")
    os.environ.setdefault(
        "DATA_DIR",
        str(Path(__file__).parent / ".dev-data")
    )

    uvicorn.run(
        "app:app",
        host="127.0.0.1",
        port=int(os.environ["BACKEND_PORT"]),
        reload=True,
        log_level="debug",
    )

if __name__ == "__main__":
    main()
