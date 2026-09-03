from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.analytics import router as AnalyticsRouter
from api.health import router as HealthRouter
from api.jobs import router as JobsRouter
from api.presets import router as PresetsRouter
from api.scraping import router as ScrapeRouter
from api.sessions import router as SessionsRouter
from api.settings import router as SettingsRouter
from api.system import router as SystemRouter
from core.task_manager import task_manager
from database.connection import init_database
from utils.logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for startup and shutdown"""
    logger.info("Starting JobHive Backend...")

    try:
        init_database()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise

    yield

    logger.info("Shutting down JobHive Backend...")
    try:
        task_manager.shutdown(wait=False)
        logger.info("Task manager shut down cleanly")
    except Exception as e:
        logger.warning(f"Error shutting down task manager: {e}")


def create_app() -> FastAPI:
    """Create and configure FastAPI application"""
    app = FastAPI(
        title="JobHive Backend",
        description="Backend API for JobHive job scraping and local search application",
        version="1.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # Core routes
    app.include_router(HealthRouter)
    app.include_router(PresetsRouter)
    app.include_router(ScrapeRouter)
    app.include_router(SettingsRouter)
    app.include_router(SessionsRouter)

    # New enhanced feature routes
    app.include_router(AnalyticsRouter)
    app.include_router(JobsRouter)
    app.include_router(SystemRouter)

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    logger.info("All routes registered successfully")
    return app


app = create_app()
