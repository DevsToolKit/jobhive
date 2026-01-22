# src/backend/main.py
import os
import sys
import uvicorn

def main():
    PORT = os.getenv("BACKEND_PORT")
    DATA_DIR = os.getenv("DATA_DIR")

    if not PORT or DATA_DIR:
        print("❌ BACKEND_PORT or DATA_DIR missing", file=sys.stderr)
        sys.exit(1)

    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=PORT,
        log_level="info",
    )

if __name__ == "__main__":
    main()