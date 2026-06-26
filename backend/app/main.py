# backend/app/main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy import text
import os
import logging

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
from app.api.pnl import router as pnl_router
from app.api.prep_cost_allocations import router as prep_cost_allocations_router
from app.api.sales import router as sales_router
from app.api.seasons import router as seasons_router
from app.api.yields import router as yields_router
from app.api.workers import router as workers_router
from app.routes.task import router as task_router
from app.routes.work_order import router as work_order_router
from app.routes.work_order_resource import router as work_order_resource_router

# ---------------------------
# REGISTER MODELS (STRICT)
# ---------------------------
from app.models.user import User
from app.models.field import Field
from app.models.crop_cycle import CropCycle
from app.models.crop_cycle_field import CropCycleField
from app.models.task import Task
from app.models.work_order import WorkOrder
from app.models.work_order_resource import WorkOrderResource
from app.models.general_expense import GeneralExpense
from app.models.note import Note
from app.models.worker import Worker
from app.models.sale import Sale
from app.models.yield_record import YieldRecord
from app.models.prep_cost_allocation import PrepCostAllocation

# ---------------------------
# APP INIT
# ---------------------------
app = FastAPI(
    title="Nivodiya Farms ERP API",
    description="Backend API for Nivodiya Farms",
    version="1.0.0",
)


@app.on_event("startup")
def _print_db_banner():
    from app.core.config import settings
    active  = (settings.DATABASE_URL or "").strip().rstrip("/")
    staging = (settings.STAGING_DATABASE_URL or "").strip().rstrip("/")

    is_staging = bool(staging) and active == staging

    logger = logging.getLogger("uvicorn")
    if is_staging:
        logger.info("")
        logger.info("✓  connected to STAGING db  ✓")
        logger.info("   (safe for testing — writes are throwaway)")
        logger.info("")
    else:
        logger.warning("")
        logger.warning("=" * 55)
        logger.warning("⚠️   CONNECTED TO PRODUCTION DB   ⚠️")
        logger.warning("    Do NOT run test / dummy data here.")
        logger.warning("    Start with DATABASE_URL=\"$STAGING_DATABASE_URL\"")
        logger.warning("    to use staging instead.")
        logger.warning("=" * 55)
        logger.warning("")

# ---------------------------
# CORS
# ---------------------------
vercel_frontend = os.getenv("FRONTEND_URL")
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:5173",
]
if vercel_frontend:
    origins.append(vercel_frontend.strip().rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
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
    # exc.errors() may contain non-serializable objects (e.g. ValueError) in ctx.
    # Stringify ctx values before returning.
    def _safe(err: dict) -> dict:
        out = {k: v for k, v in err.items() if k != "ctx"}
        if "ctx" in err:
            out["ctx"] = {k: str(v) for k, v in err["ctx"].items()}
        return out

    return JSONResponse(
        status_code=422,
        content={"success": False, "errors": [_safe(e) for e in exc.errors()]},
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
app.include_router(pnl_router)
app.include_router(prep_cost_allocations_router)
app.include_router(sales_router)
app.include_router(seasons_router)
app.include_router(yields_router)
app.include_router(task_router)
app.include_router(work_order_router)
app.include_router(work_order_resource_router)
app.include_router(general_expenses_router)
app.include_router(workers_router)
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
