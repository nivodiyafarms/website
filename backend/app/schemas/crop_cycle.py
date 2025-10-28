from pydantic import BaseModel, Field, field_validator
from typing import Optional
from uuid import UUID
from datetime import date, datetime
from app.models.crop_cycle import CropStage, CropCycleStatus
from app.schemas.field import FieldResponse
from app.schemas.user import UserResponse


class CropCycleCreate(BaseModel):
    field_id: str
    crop: str
    variety: Optional[str] = None
    sowing_date: date
    expected_harvest: Optional[date] = None
    stage: CropStage = CropStage.SOWING
    status: CropCycleStatus = CropCycleStatus.OPEN
    supervisor_id: UUID
    notes: Optional[str] = None
    geo_context_lat: Optional[float] = None
    geo_context_lng: Optional[float] = None

    @field_validator('expected_harvest')
    @classmethod
    def validate_harvest_date(cls, v, info):
        if v and info.data.get('sowing_date') and v < info.data['sowing_date']:
            raise ValueError('expected_harvest must be >= sowing_date')
        return v


class CropCycleUpdate(BaseModel):
    field_id: Optional[str] = None
    crop: Optional[str] = None
    variety: Optional[str] = None
    sowing_date: Optional[date] = None
    expected_harvest: Optional[date] = None
    stage: Optional[CropStage] = None
    status: Optional[CropCycleStatus] = None
    supervisor_id: Optional[UUID] = None
    notes: Optional[str] = None
    geo_context_lat: Optional[float] = None
    geo_context_lng: Optional[float] = None


class CropCycleResponse(BaseModel):
    crop_cycle_id: UUID
    field_id: str
    crop: str
    variety: Optional[str]
    sowing_date: date
    expected_harvest: Optional[date]
    stage: CropStage
    status: CropCycleStatus
    supervisor_id: UUID
    notes: Optional[str]
    geo_context_lat: Optional[float]
    geo_context_lng: Optional[float]
    created_at: datetime
    updated_at: datetime
    field: Optional[FieldResponse] = None
    supervisor: Optional[UserResponse] = None

    class Config:
        from_attributes = True

