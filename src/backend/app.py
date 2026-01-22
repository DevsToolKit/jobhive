from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from api.health import router as health_router
from api.scraping import router as scraping_router
from api.sessions import router as sessions_router
from api.presets import router as presets_router
from api.analytics import router as analytics_router
from api.jobs import router as jobs_router
from database.connection import init_database
from core.task_manager import task_manager
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
    task_manager.shutdown()
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
    
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Include all routers
    app.include_router(health_router)
    app.include_router(scraping_router)
    app.include_router(sessions_router)
    app.include_router(presets_router)
    app.include_router(analytics_router)
    app.include_router(jobs_router)
    
    logger.info("All routes registered")
    
    return app


app = create_app()
