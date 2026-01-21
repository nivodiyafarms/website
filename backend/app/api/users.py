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
    from app.models.user import UserLanguage, UserRole
    from app.schemas.user import UserResponse
    
    users = db.query(User).all()
    # Convert each user's role and language strings to enums
    result = []
    for user in users:
        # Convert role string to enum
        role_enum = None
        if user.role:
            try:
                role_enum = UserRole(user.role)
            except ValueError:
                role_enum = UserRole.WORKER
        
        # Convert language string to enum
        language_enum = None
        if user.language:
            lang_str = str(user.language).upper()
            if lang_str in ["EN_IN", "EN-IN"]:
                language_enum = UserLanguage.EN_IN
            elif lang_str in ["HI_IN", "HI-IN"]:
                language_enum = UserLanguage.HI_IN
            else:
                try:
                    language_enum = UserLanguage(user.language)
                except ValueError:
                    language_enum = UserLanguage.EN_IN
        else:
            language_enum = UserLanguage.EN_IN
        
        result.append(UserResponse(
            user_id=user.user_id,
            name=user.name,
            phone=user.phone,
            role=role_enum or UserRole.WORKER,
            language=language_enum
        ))
    return result


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
    # Convert language string to enum for response
    from app.models.user import UserLanguage, UserRole
    
    # Convert role string to enum
    role_enum = None
    if current_user.role:
        try:
            role_enum = UserRole(current_user.role)
        except ValueError:
            role_enum = UserRole.WORKER  # Default fallback
    
    # Convert language string to enum
    language_enum = None
    if current_user.language:
        lang_str = str(current_user.language).upper()
        if lang_str in ["EN_IN", "EN-IN"]:
            language_enum = UserLanguage.EN_IN
        elif lang_str in ["HI_IN", "HI-IN"]:
            language_enum = UserLanguage.HI_IN
        else:
            try:
                language_enum = UserLanguage(current_user.language)
            except ValueError:
                language_enum = UserLanguage.EN_IN
    else:
        language_enum = UserLanguage.EN_IN
    
    # Return user data with converted enums
    return UserResponse(
        user_id=current_user.user_id,
        name=current_user.name,
        phone=current_user.phone,
        role=role_enum or UserRole.WORKER,
        language=language_enum
    )

