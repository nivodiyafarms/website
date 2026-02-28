# backend/app/main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy import text
import os

from app.database import engine

# ---------------------------
# API ROUTERS (ONLY REAL ONES)
# ---------------------------
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.fields import router as fields_router
from app.api.crop_cycles import router as crop_cycles_router
from app.api.general_expenses import router as general_expenses_router
from app.api import notes
from app.routes.task import router as task_router
from app.routes.work_order import router as work_order_router
from app.routes.work_order_resource import router as work_order_resource_router

# ---------------------------
# REGISTER MODELS (STRICT)
# ---------------------------
from app.models.user import User
from app.models.field import Field
from app.models.crop_cycle import CropCycle
from app.models.task import Task
from app.models.work_order import WorkOrder
from app.models.work_order_resource import WorkOrderResource
from app.models.general_expense import GeneralExpense
from app.models.note import Note

# ---------------------------
# APP INIT
# ---------------------------
app = FastAPI(
    title="Nivodiya Farms ERP API",
    description="Backend API for Nivodiya Farms",
    version="1.0.0",
)

# ---------------------------
# CORS
# ---------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# EXCEPTION HANDLERS
# ---------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    print(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": str(exc)},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"success": False, "errors": exc.errors()},
    )

# ---------------------------
# STATIC FILES
# ---------------------------
if os.path.exists("uploads"):
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ---------------------------
# ROUTES
# ---------------------------
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(fields_router)
app.include_router(crop_cycles_router)
app.include_router(task_router)
app.include_router(work_order_router)
app.include_router(work_order_resource_router)
app.include_router(general_expenses_router)
app.include_router(notes.router)

# ---------------------------
# HEALTH
# ---------------------------
@app.get("/")
def root():
    return {"success": True, "message": "Nivodiya Farms API running"}

@app.get("/health")
def health():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": str(e)}
