# src/backend/app.py
from fastapi import FastAPI
from api.health import router as health_router

def create_app() -> FastAPI:
    app = FastAPI(
        title="JobHive Backend",
        docs_url="/docs",
        redoc_url="/redoc"
    )

    app.include_router(health_router)

    return app

app = create_app()