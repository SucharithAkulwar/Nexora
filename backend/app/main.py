import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db
from app.api import (
    auth,
    patients,
    doctors,
    hospitals,
    appointments,
    ai_summary,
    records,
    notes,
    audit
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("nexora")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Nexora Healthcare Platform backend...")
    await init_db()
    logger.info("Nexora backend services initialized successfully.")
    yield
    logger.info("Shutting down Nexora backend services.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Nexora: AI-Assisted Clinical Healthcare & Kolhapur Hospital Discovery Platform. "
        "Provides pre-consultation patient intake summarization, Google Places hospital discovery, "
        "doctor appointment scheduling, and patient-isolated RAG retrieval."
    ),
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(patients.router, prefix=f"{settings.API_V1_STR}/patients", tags=["Patients"])
app.include_router(doctors.router, prefix=f"{settings.API_V1_STR}/doctors", tags=["Doctors"])
app.include_router(hospitals.router, prefix=f"{settings.API_V1_STR}/hospitals", tags=["Hospitals & Google Places"])
app.include_router(appointments.router, prefix=f"{settings.API_V1_STR}/appointments", tags=["Appointments"])
app.include_router(ai_summary.router, prefix=f"{settings.API_V1_STR}/ai-summary", tags=["AI Patient Summary"])
app.include_router(records.router, prefix=f"{settings.API_V1_STR}/records", tags=["Medical Records & RAG"])
app.include_router(notes.router, prefix=f"{settings.API_V1_STR}/notes", tags=["Doctor Consultation Notes"])
app.include_router(audit.router, prefix=f"{settings.API_V1_STR}/audit", tags=["Security & Audit"])


@app.get("/")
async def root():
    return {
        "platform": "Nexora - AI-Powered Healthcare Platform",
        "status": "online",
        "version": settings.VERSION,
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR
    }


from app.core.database import init_db, get_database_status


@app.get(f"{settings.API_V1_STR}/health")
async def health_check():
    db_status = get_database_status()
    return {
        "status": "healthy",
        "database": db_status["mode"],
        "is_connected_to_mongodb": db_status["is_connected_to_mongodb"],
        "mongodb_uri": db_status["mongodb_uri"],
        "database_name": db_status["database_name"],
        "google_places_configured": bool(settings.GOOGLE_MAPS_API_KEY),
        "ollama_configured": bool(settings.OLLAMA_BASE_URL),
        "kolhapur_active_region": True
    }


@app.get(f"{settings.API_V1_STR}/database/status")
async def database_status():
    return get_database_status()


@app.post(f"{settings.API_V1_STR}/database/reconnect")
async def database_reconnect():
    await init_db()
    return get_database_status()
