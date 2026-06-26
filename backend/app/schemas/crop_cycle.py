# backend/app/schemas/crop_cycle.py

from pydantic import BaseModel, Field, field_validator, model_validator
from pydantic.config import ConfigDict
from typing import Optional, List
from uuid import UUID
from datetime import date, datetime

from .field import FieldResponse
from .user import UserResponse
from app.models.crop_cycle import CropStage, CropCycleStatus


# =========================
# FIELD JUNCTION (for new cycle creation)
# =========================
class CycleFieldIn(BaseModel):
    field_id: str
    allocated_acres: Optional[float] = None


class CycleFieldOut(BaseModel):
    field_id: str
    allocated_acres: Optional[float] = None
    model_config = ConfigDict(from_attributes=True)


# =========================
# CREATE
# =========================
class CropCycleCreate(BaseModel):
    # Core required fields
    crop_name: str
    sowing_date: date
    season: str

    # field_code: old single-field API (kept for backwards compat).
    # New callers send 'fields' list instead; field_code is derived from fields[0].
    field_code: Optional[str] = None
    fields: Optional[List[CycleFieldIn]] = None  # new multi-field + acres

    crop_year: Optional[int] = None

    # Optional fields
    incident_no: Optional[str] = None  # auto-generated if not provided
    seed_category: Optional[str] = None
    seed_quantity: Optional[float] = None
    cultivated_area: Optional[float] = None  # auto-set to sum of acres if fields provided
    expected_harvest_date: Optional[date] = None
    actual_harvest_date: Optional[date] = None
    current_stage: Optional[CropStage] = CropStage.SOWING
    status: Optional[CropCycleStatus] = CropCycleStatus.OPEN
    short_description: Optional[str] = None
    description: Optional[str] = None
    resolution_comments: Optional[str] = None
    observation: Optional[str] = None
    resolved_date: Optional[date] = None

    @model_validator(mode='after')
    def require_at_least_one_field(self):
        if not self.field_code and not self.fields:
            raise ValueError("At least one field must be provided (field_code or fields)")
        return self

    @field_validator("expected_harvest_date")
    @classmethod
    def validate_harvest_date(cls, v, info):
        sowing_date = info.data.get("sowing_date")
        if v and sowing_date and v < sowing_date:
            raise ValueError("expected_harvest_date must be >= sowing_date")
        return v


# =========================
# UPDATE
# =========================
class CropCycleUpdate(BaseModel):
    # All fields optional for updates
    field_code: Optional[str] = None
    crop_name: Optional[str] = None
    incident_no: Optional[str] = None
    season: Optional[str] = None
    seed_category: Optional[str] = None
    seed_quantity: Optional[float] = None
    cultivated_area: Optional[float] = None
    sowing_date: Optional[date] = None
    expected_harvest_date: Optional[date] = None
    actual_harvest_date: Optional[date] = None
    resolved_date: Optional[date] = None
    current_stage: Optional[CropStage] = None
    status: Optional[CropCycleStatus] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    resolution_comments: Optional[str] = None
    observation: Optional[str] = None
    total_expense: Optional[float] = None
    total_revenue: Optional[float] = None
    profit: Optional[float] = None
    
    # Validate that resolution fields are required when status is RESOLVED
    @model_validator(mode='after')
    def validate_resolution_fields(self):
        if self.status and str(self.status).lower() == "resolved":
            if not self.resolution_comments:
                raise ValueError("resolution_comments is required when status is 'resolved'")
            if not self.resolved_date:
                # Auto-set if not provided
                from datetime import date
                self.resolved_date = date.today()
        return self


# =========================
# RESPONSE
# =========================
class CropCycleResponse(BaseModel):
    # Standardized to crop_cycle_id (no alias)
    crop_cycle_id: UUID
    
    incident_no: str
    field_code: str
    crop_name: str
    
    seed_category: Optional[str] = None
    seed_quantity: Optional[float] = None
    
    cultivated_area: Optional[float] = None  # Matches model field name
    season: Optional[str] = None
    
    sowing_date: date
    expected_harvest_date: Optional[date] = None
    actual_harvest_date: Optional[date] = None
    resolved_date: Optional[date] = None  # Added missing field
    
    current_stage: Optional[CropStage] = None
    status: Optional[CropCycleStatus] = None
    
    short_description: Optional[str] = None
    description: Optional[str] = None
    
    created_by: Optional[UUID] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    # Resolution fields
    total_expense: Optional[float] = None
    total_revenue: Optional[float] = None
    profit: Optional[float] = None  # Added missing field
    resolution_comments: Optional[str] = None
    observation: Optional[str] = None

    crop_year: Optional[int] = None

    # Optional joins
    field: Optional["FieldResponse"] = None
    supervisor: Optional["UserResponse"] = None
    cycle_fields: Optional[List["CycleFieldOut"]] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
