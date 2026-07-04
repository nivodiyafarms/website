from pydantic import BaseModel
from typing import Optional
from datetime import date as date_type, datetime
from uuid import UUID


class GeneralExpenseCreate(BaseModel):
    category: str
    subcategory: Optional[str] = None
    description: Optional[str] = None
    date: Optional[date_type] = None
    qty: Optional[float] = None
    unit: Optional[str] = None
    unit_rate: Optional[float] = None
    total_cost: float  # required; zero rejected server-side


class GeneralExpenseUpdate(BaseModel):
    category: Optional[str] = None
    subcategory: Optional[str] = None
    description: Optional[str] = None
    date: Optional[date_type] = None
    qty: Optional[float] = None
    unit: Optional[str] = None
    unit_rate: Optional[float] = None
    total_cost: Optional[float] = None


class GeneralExpenseResponse(BaseModel):
    general_expense_id: UUID
    expense_no: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    description: Optional[str] = None
    date: Optional[date_type] = None
    qty: Optional[float] = None
    unit: Optional[str] = None
    unit_rate: Optional[float] = None
    total_cost: Optional[float] = None
    review_status: Optional[str] = None
    void_reason: Optional[str] = None
    created_by: Optional[UUID] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
