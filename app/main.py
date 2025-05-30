from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from pathlib import Path

from core.config import settings
from core.logging_config import setup_logging
from core.security import RateLimitMiddleware, SecurityHeadersMiddleware
from api.routes import router as api_router

# Setup logging
logger = setup_logging()

# Get the directory paths
current_dir = Path(__file__).parent
static_dir = current_dir / "static"

# If static directory doesn't exist in app/, look in parent directory
if not static_dir.exists():
    static_dir = current_dir.parent / "static"

# Create FastAPI application
app = FastAPI(
    title="Apollo.io Lead Scraper",
    description="Production-ready web scraper for Apollo.io with Google Sheets and Notion integration",
    version="1.0.0",
    docs_url="/docs" if os.getenv("DEBUG", "false").lower() == "true" else None,
    redoc_url="/redoc" if os.getenv("DEBUG", "false").lower() == "true" else None
)

# Add security middleware
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    RateLimitMiddleware,
    calls=getattr(settings, 'rate_limit_requests', 100),
    period=getattr(settings, 'rate_limit_window', 60)
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Mount static files with correct path
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")
    logger.info(f"Static files mounted from: {static_dir}")
else:
    logger.warning(f"Static directory not found at: {static_dir}")

# Include API routes
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def serve_frontend():
    """Serve the main frontend application"""
    index_path = static_dir / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    else:
        return {"message": "Tiz Lead Scraper API is running", "version": "1.0.0", "docs": "/docs"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        return {
            "status": "healthy",
            "timestamp": "2024-01-01T00:00:00Z",
            "version": "1.0.0",
            "services": {
                "apify": "ready" if settings.apify_api_token else "not_configured",
                "google_sheets": "ready" if settings.google_sheets_credentials else "not_configured",
                "notion": "ready" if settings.notion_token else "not_configured"
            }
        }
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        return {"status": "unhealthy", "error": str(e)}

@app.on_event("startup")
async def startup_event():
    """Application startup event"""
    logger.info("Apollo.io Lead Scraper starting up", version="1.0.0")

@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event"""
    logger.info("Apollo.io Lead Scraper shutting down")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=5000,
        reload=os.getenv("DEBUG", "false").lower() == "true",
        access_log=True
    )
