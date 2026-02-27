from pydantic import BaseModel, Field
from typing import Optional, Union
from datetime import date as date_type, datetime
from uuid import UUID


class GeneralExpenseBase(BaseModel):
    """Base schema for General Expense"""
    category: Optional[str] = None
    subcategory: Optional[str] = None
    description: Optional[str] = None
    date: Optional[date_type] = None
    qty: Optional[float] = None
    unit: Optional[str] = None
    unit_rate: Optional[float] = None
    total_cost: Optional[float] = None
    related_type: Optional[str] = None
    related_id: Optional[UUID] = None


class GeneralExpenseCreate(GeneralExpenseBase):
    """Schema for creating a general expense"""
    # Frontend fields that need mapping
    expense_code: Optional[str] = None
    resource_type: Optional[str] = None
    resource_code: Optional[str] = None
    quantity: Optional[float] = None
    rate: Optional[float] = None
    total_amount: Optional[float] = None
    expense_date: Optional[date_type] = None
    vendor_name: Optional[str] = None
    invoice_no: Optional[str] = None
    notes: Optional[str] = None


class GeneralExpenseUpdate(BaseModel):
    """Schema for updating a general expense"""
    category: Optional[str] = None
    subcategory: Optional[str] = None
    description: Optional[str] = None
    date: Optional[date_type] = None
    qty: Optional[float] = None
    unit: Optional[str] = None
    unit_rate: Optional[float] = None
    total_cost: Optional[float] = None
    related_type: Optional[str] = None
    related_id: Optional[UUID] = None


class GeneralExpenseResponse(BaseModel):
    """Schema for general expense response"""
    general_expense_id: UUID
    category: Optional[str] = None
    subcategory: Optional[str] = None
    description: Optional[str] = None
    date: Optional[date_type] = None
    qty: Optional[float] = None
    unit: Optional[str] = None
    unit_rate: Optional[float] = None
    total_cost: Optional[float] = None
    related_type: Optional[str] = None
    related_id: Optional[UUID] = None
    created_by: Optional[UUID] = None
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

