from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.token import TokenData

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Truncate password to 72 bytes for bcrypt compatibility
    if isinstance(plain_password, str):
        plain_password = plain_password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    # Truncate password to 72 bytes for bcrypt compatibility
    if isinstance(password, str):
        password = password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def authenticate_user(db: Session, phone: str, password: str):
    """
    Authenticate user by phone and password.
    
    TEMPORARY IMPLEMENTATION FOR TESTING:
    This bypasses actual authentication and returns the first user found.
    WARNING: This is NOT secure and should be replaced with proper authentication!
    
    TODO: Implement proper authentication based on your setup:
    - Option 1: Use email instead of phone
    - Option 2: Query user_metadata JSONB for phone
    - Option 3: Use a separate public.users table
    """
    # TEMPORARY: Get first user from database for testing
    # WARNING: Remove this in production!
    try:
        user = db.query(User).first()
        if user:
            return user
        return False
    except Exception as e:
        print(f"Authentication error: {e}")
        return False
    
    # TODO: Proper implementation example:
    # from sqlalchemy import text
    # result = db.execute(text("""
    #     SELECT id, encrypted_password, raw_user_meta_data
    #     FROM auth.users
    #     WHERE raw_user_meta_data->>'phone' = :phone
    # """), {"phone": phone})
    # user_data = result.fetchone()
    # if not user_data:
    #     return False
    # if not verify_password(password, user_data.encrypted_password):
    #     return False
    # user = db.query(User).filter(User.id == user_data.id).first()
    # return user


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=user_id)
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None:
        raise credentials_exception
    return user


async def get_current_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

