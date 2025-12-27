from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.auth.security import get_password_hash, get_current_user

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    users = db.query(User).all()
    return users


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user.
    Note: Supabase auth.users is managed by Supabase Auth API.
    Users should be created via Supabase Auth (signUp) and then
    custom fields (name, phone, role, language) should be stored
    in user_metadata or a separate public.users table.
    """
    raise HTTPException(
        status_code=501,
        detail="User creation via this endpoint is not supported. "
               "Users must be created via Supabase Auth API. "
               "After user creation, update user_metadata with custom fields."
    )
    
    # TODO: Implement user creation via Supabase Auth API
    # Example:
    # 1. Call Supabase Auth signUp API with email/password
    # 2. Update user_metadata with phone, name, role, language
    # 3. Or create a record in a separate public.users table


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

