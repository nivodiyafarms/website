from pydantic import BaseModel, Field, field_validator
from typing import Optional
from uuid import UUID
from app.models.user import UserRole, UserLanguage


class UserLogin(BaseModel):
    phone: str
    password: str


class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=64)
    phone: str
    password: str
    role: UserRole
    language: Optional[UserLanguage] = UserLanguage.EN_IN


class UserResponse(BaseModel):
    user_id: UUID
    name: str
    phone: str
    role: UserRole
    language: Optional[UserLanguage]

    class Config:
        from_attributes = True

