# backend/app/schemas/task.py

from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.models.task import (
    TaskStatus,
    SeverityLevel,
    TaskCategory,
    TaskSubcategory,
)


class TaskCreate(BaseModel):
    category: Optional[TaskCategory] = None
    subcategory: Optional[TaskSubcategory] = None

    short_description: str
    description: Optional[str] = None

    assigned_to_id: Optional[UUID] = None  # defaults to current_user server-side
    field_id: Optional[str] = None         # legacy single-field (kept for compat)
    field_ids: Optional[List[str]] = None  # multi-field junction rows
    severity: Optional[SeverityLevel] = None

    model_config = {"from_attributes": True}


class TaskUpdate(BaseModel):
    # Classification
    category: Optional[TaskCategory] = None
    subcategory: Optional[TaskSubcategory] = None

    # Description fields
    short_description: Optional[str] = None
    description: Optional[str] = None

    # Assignment
    assigned_to_id: Optional[UUID] = None
    field_id: Optional[str] = None         # legacy single-field
    field_ids: Optional[List[str]] = None  # multi-field junction rows
    
    # Status and workflow
    status: Optional[TaskStatus] = None
    severity: Optional[SeverityLevel] = None
    on_hold_reason: Optional[str] = None
    
    # Resolution fields
    resolved_date: Optional[datetime] = None
    resolution_comments: Optional[str] = None
    observation: Optional[str] = None
    
    # Financial
    total_expense: Optional[float] = None

    model_config = {"from_attributes": True}


class TaskResponse(BaseModel):
    task_id: UUID
    task_number: Optional[str] = None
    crop_cycle_id: UUID

    category: Optional[TaskCategory]
    subcategory: Optional[TaskSubcategory]

    short_description: str
    description: Optional[str]
    field_id: Optional[str] = None

    assigned_to_id: UUID
    created_by_id: UUID

    status: TaskStatus
    severity: Optional[SeverityLevel]

    resolved_date: Optional[datetime]
    resolution_comments: Optional[str]
    observation: Optional[str]

    total_expense: float

    created_at: datetime
    updated_at: Optional[datetime]
    closed_at: Optional[datetime]

    model_config = {"from_attributes": True}
