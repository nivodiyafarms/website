from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.database import engine, Base
from app.api import auth, users, fields, crop_cycles, crops, materials, equipment, crop_cycle_incidents, crop_cycle_notes, chatbot, general_expenses
import os
from sqlalchemy import text

# Import all models to ensure they are registered with SQLAlchemy Base
from app.models import (
    User, Field, CropCatalog, Material, Equipment, CropCycle,
    CropCycleNote, CropCycleIncident, Task, WorkOrder, WorkOrderResource, Note, GeneralExpense
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

# Global exception handler to ensure CORS headers on errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Ensure CORS headers are sent even on errors"""
    import traceback
    error_details = traceback.format_exc()
    print(f"Unhandled exception: {exc}")
    print(f"Error details: {error_details}")
    
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": f"Internal server error: {str(exc)}",
            "data": None
        },
        headers={
            "Access-Control-Allow-Origin": "http://localhost:3000",
            "Access-Control-Allow-Credentials": "true",
        }
    )

# Validation error handler with CORS
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with CORS headers"""
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": "Validation error",
            "data": exc.errors()
        },
        headers={
            "Access-Control-Allow-Origin": "http://localhost:3000",
            "Access-Control-Allow-Credentials": "true",
        }
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
app.include_router(general_expenses.router)


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
