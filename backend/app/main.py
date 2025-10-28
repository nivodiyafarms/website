from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import engine, Base
from app.api import auth, users, fields, crop_cycles, crops, materials, equipment, incidents, crop_cycle_incidents, crop_cycle_notes
import os

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Nivodiya Farms KPI Dashboard API",
    description="Backend API for Nivodiya Farms management system",
    version="1.0.0"
)

# CORS configuration - MUST be before static files and routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
app.include_router(incidents.router)
app.include_router(crop_cycle_incidents.router)
app.include_router(crop_cycle_notes.router)


@app.get("/")
def root():
    return {
        "success": True,
        "message": "Nivodiya Farms API is running",
        "data": {"version": "1.0.0"}
    }


@app.get("/health")
def health_check():
    return {"success": True, "message": "API is healthy"}

