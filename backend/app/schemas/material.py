from pydantic import BaseModel
from typing import Optional
from app.models.material import MaterialCategory


class MaterialCreate(BaseModel):
    name: str
    category: MaterialCategory
    default_unit: str
    safety_notes: Optional[str] = None


class MaterialResponse(BaseModel):
    id: int
    name: str
    category: MaterialCategory
    default_unit: str
    safety_notes: Optional[str]

    class Config:
        from_attributes = True

