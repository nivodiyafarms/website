from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import engine, Base
from app.api import auth, users, fields, crop_cycles, crops, materials, equipment, crop_cycle_incidents, crop_cycle_notes, chatbot
import os
from sqlalchemy import text

# Import all models to ensure they are registered with SQLAlchemy Base
from app.models import (
    User, Field, CropCatalog, Material, Equipment, CropCycle,
    CropCycleNote, CropCycleIncident, Task, WorkOrder, WorkOrderResource, Note
)

app = FastAPI(
    title="Nivodiya Farms KPI Dashboard API",
    description="Backend API for Nivodiya Farms management system",
    version="1.0.0"
)

# CORS configuration - MUST be before static files and routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Mount static files for uploads (images, audio, etc.)
if os.path.exists("uploads"):
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(fields.router)
app.include_router(crop_cycles.router)
app.include_router(crops.router)
app.include_router(materials.router)
app.include_router(equipment.router)
app.include_router(crop_cycle_incidents.router)
app.include_router(crop_cycle_notes.router)
app.include_router(chatbot.router)


@app.get("/")
def root():
    return {
        "success": True,
        "message": "Nivodiya Farms API is running",
        "data": {"version": "1.0.0"}
    }


@app.get("/health")
def health_check():
    """Health check endpoint that also tests database connection"""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "success": True,
        "message": "API is healthy",
        "database": db_status
    }
