from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.user import UserLogin
from app.schemas.token import Token
from app.auth.security import create_access_token
from app.core.config import settings
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=Token)
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """
    DEMO MODE LOGIN
    Phone-based login only.
    If phone exists in users table -> allow login.
    Password is ignored for now.
    """

    print(f"Login attempt: phone={user_credentials.phone}")

    user = (
        db.query(User)
        .filter(User.phone == user_credentials.phone)
        .first()
    )

    if not user:
        print(f"Login failed: phone not found -> {user_credentials.phone}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    access_token = create_access_token(
        data={"sub": str(user.user_id)},
        expires_delta=access_token_expires,
    )

    print(f"Login successful: {user.name} ({user.phone})")

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }
