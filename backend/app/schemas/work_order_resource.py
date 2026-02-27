# backend/app/schemas/work_order_resource.py

from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


# -----------------------------
# Create Resource (WO-scoped)
# -----------------------------
class WorkOrderResourceCreate(BaseModel):
    resource_type: str          # enum from DB (LABOR, FUEL, etc.)
    name: str                   # display name
    qty: float
    unit: str
    rate: Optional[float] = None
    cost: Optional[float] = None  # Optional - computed server-side when rate exists

    class Config:
        from_attributes = True


# -----------------------------
# Update Resource (all optional; cost computed server-side when rate provided)
# -----------------------------
class WorkOrderResourceUpdate(BaseModel):
    resource_type: Optional[str] = None
    name: Optional[str] = None
    qty: Optional[float] = None
    unit: Optional[str] = None
    rate: Optional[float] = None
    cost: Optional[float] = None

    class Config:
        from_attributes = True


# -----------------------------
# Resource Response
# -----------------------------
class WorkOrderResourceResponse(BaseModel):
    work_order_resources_id: UUID
    work_order_id: UUID

    resource_type: str
    name: str
    qty: float
    unit: str
    rate: Optional[float]
    cost: float

    created_at: datetime

    class Config:
        from_attributes = True
