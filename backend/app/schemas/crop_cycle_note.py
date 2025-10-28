from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class CropCycleNoteCreate(BaseModel):
    """Schema for creating a new crop cycle note"""
    content: str
    image_path: Optional[str] = None
    source: str = "web"  # 'web' or 'app'


class CropCycleNoteUpdate(BaseModel):
    """Schema for updating a crop cycle note"""
    content: Optional[str] = None
    image_path: Optional[str] = None


class CropCycleNoteResponse(BaseModel):
    """Schema for crop cycle note response"""
    note_id: UUID
    crop_cycle_id: UUID
    user_id: UUID
    content: str
    image_path: Optional[str]
    source: str
    created_at: datetime
    updated_at: datetime
    
    # Include user details in response
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    
    class Config:
        from_attributes = True


