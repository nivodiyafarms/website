# backend/app/schemas/work_order.py

from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import date, datetime

from app.models.work_order import WorkOrderStatus


# -----------------------------
# Create Work Order
# -----------------------------
class WorkOrderCreate(BaseModel):
    # task_id comes from URL path, not body
    short_description: str
    description: Optional[str] = None
    assigned_to: Optional[UUID] = None
    due_date: Optional[date] = None

    class Config:
        from_attributes = True


# -----------------------------
# Update Work Order (all optional)
# -----------------------------
class WorkOrderUpdate(BaseModel):
    short_description: Optional[str] = None
    description: Optional[str] = None
    assigned_to: Optional[UUID] = None
    due_date: Optional[date] = None
    status: Optional[WorkOrderStatus] = None

    class Config:
        from_attributes = True


# -----------------------------
# Work Order Response
# -----------------------------
class WorkOrderResponse(BaseModel):
    work_order_id: UUID
    work_order_number: str

    task_id: UUID
    short_description: str
    description: Optional[str]

    assigned_to: Optional[UUID] = None
    created_by: Optional[UUID] = None

    status: WorkOrderStatus
    due_date: Optional[date]

    created_at: datetime
    updated_at: Optional[datetime]
    closed_at: Optional[datetime]

    class Config:
        from_attributes = True
