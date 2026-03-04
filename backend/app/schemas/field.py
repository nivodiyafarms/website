from pydantic import BaseModel, Field
from typing import Optional
from app.models.field import OwnershipType


class FieldCreate(BaseModel):
    field_id: str
    name: str = Field(..., min_length=2, max_length=64)
    area_acre: float = Field(..., gt=0)
    gps_centroid_lat: Optional[float] = None
    gps_centroid_lng: Optional[float] = None
    village: Optional[str] = None
    ownership: Optional[str] = None


class FieldUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=64)
    area_acre: Optional[float] = Field(None, gt=0)
    gps_centroid_lat: Optional[float] = None
    gps_centroid_lng: Optional[float] = None
    village: Optional[str] = None
    ownership: Optional[str] = None


class FieldResponse(BaseModel):
    field_id: str
    name: str
    area_acre: float
    gps_centroid_lat: Optional[float] = None
    gps_centroid_lng: Optional[float] = None
    village: Optional[str] = None
    ownership: Optional[str] = None

    class Config:
        from_attributes = True
