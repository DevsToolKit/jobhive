from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database.connection import init_database

from api.health import router as HealthRouter
from api.presets import router as PresetsRouter
from api.scrapping import router as ScrapeRouter
from api.settings import router as SettingsRouter
from api.sessions import router as SessionsRouter

from utils.logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for startup and shutdown"""
    # Startup
    logger.info("Starting JobHive Backend...")
    
    # Initialize database
    try:
        init_database()
        logger.info("Database initialized")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down JobHive Backend...")
    # task_manager.shutdown()
    logger.info("Task manager shut down")


def create_app() -> FastAPI:
    """Create and configure FastAPI application"""
    
    app = FastAPI(
        title="JobHive Backend",
        description="Backend API for JobHive job scraping application",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan
    )

    app.include_router(HealthRouter)
    app.include_router(PresetsRouter)
    app.include_router(ScrapeRouter)
    app.include_router(SettingsRouter)
    app.include_router(SessionsRouter)
    
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    logger.info("All routes registered")
    
    return app


app = create_app()
