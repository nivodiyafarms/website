from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID
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
    """
    Verify password against hash.
    Handles both bcrypt hashes and plain text (for migration purposes).
    """
    if not plain_password or not hashed_password:
        return False
    
    # Truncate password to 72 bytes for bcrypt compatibility
    if isinstance(plain_password, str):
        plain_password = plain_password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    
    try:
        # Try to verify as bcrypt hash
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        # If hash verification fails, check if it's plain text (for migration)
        # This allows existing plain text passwords to work temporarily
        if hashed_password == plain_password:
            print(f"Warning: Plain text password detected for user. Please update to hashed password.")
            return True
        print(f"Password verification error: {e}")
        return False


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
    Authenticate user by phone and password from users table.
    """
    try:
        # Query user by phone from users table
        user = db.query(User).filter(User.phone == phone).first()
        if not user:
            print(f"Authentication failed: User with phone {phone} not found")
            return False
        
        # Debug: Check password format (first 20 chars only for security)
        password_preview = user.password[:20] if user.password else "None"
        print(f"Debug: User found. Password hash preview: {password_preview}...")
        
        # Verify password using bcrypt (or plain text fallback)
        password_valid = verify_password(password, user.password)
        if not password_valid:
            print(f"Authentication failed: Invalid password for user {phone}")
            return False
        
        # If password was plain text, update it to hashed (migration)
        if user.password == password:
            print(f"Updating plain text password to hashed for user {phone}")
            user.password = get_password_hash(password)
            db.commit()
            print(f"Password updated to hashed format")
        
        print(f"Authentication successful: User {user.name} ({user.phone})")
        return user
    except Exception as e:
        import traceback
        print(f"Authentication error: {e}")
        print(traceback.format_exc())
        return False


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
    
    # Database uses user_id as PK, not id
    user = db.query(User).filter(User.user_id == UUID(token_data.user_id)).first()
    if user is None:
        raise credentials_exception
    return user


async def get_current_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

