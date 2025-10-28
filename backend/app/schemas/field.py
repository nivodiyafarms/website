from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any
from app.models.field import SoilType


class FieldCreate(BaseModel):
    field_id: str
    name: str = Field(..., min_length=2, max_length=64)
    area_acre: float = Field(..., gt=0)
    soil_type: Optional[SoilType] = None
    gps_polygon: Optional[Dict[str, Any]] = None
    gps_centroid_lat: Optional[float] = None
    gps_centroid_lng: Optional[float] = None
    village: Optional[str] = None


class FieldUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=64)
    area_acre: Optional[float] = Field(None, gt=0)
    soil_type: Optional[SoilType] = None
    gps_polygon: Optional[Dict[str, Any]] = None
    gps_centroid_lat: Optional[float] = None
    gps_centroid_lng: Optional[float] = None
    village: Optional[str] = None


class FieldResponse(BaseModel):
    field_id: str
    name: str
    area_acre: float
    soil_type: Optional[SoilType]
    gps_polygon: Optional[Dict[str, Any]]
    gps_centroid_lat: Optional[float]
    gps_centroid_lng: Optional[float]
    village: Optional[str]

    class Config:
        from_attributes = True

