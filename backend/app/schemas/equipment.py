from pydantic import BaseModel
from typing import Optional
from app.models.equipment import EquipmentType


class EquipmentCreate(BaseModel):
    name: str
    type: EquipmentType
    hourly_rate: Optional[float] = None
    plate_no: Optional[str] = None


class EquipmentResponse(BaseModel):
    id: int
    name: str
    type: EquipmentType
    hourly_rate: Optional[float]
    plate_no: Optional[str]

    class Config:
        from_attributes = True

