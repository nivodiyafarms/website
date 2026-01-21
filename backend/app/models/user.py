from sqlalchemy import Column, String, Enum as SQLEnum, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import object_session
import uuid
import enum
from app.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    SUPERVISOR = "SUPERVISOR"
    WORKER = "WORKER"


class UserLanguage(str, enum.Enum):
    EN_IN = "en-IN"
    HI_IN = "hi-IN"


class User(Base):
    """
    User model - Matches the users table in database
    Database uses user_id as primary key, not id
    """
    __tablename__ = "users"
    
    # Primary Key - database uses user_id, not id
    user_id = Column(UUID(as_uuid=True), primary_key=True)
    
    # User Information
    name = Column(String(64), nullable=False)
    phone = Column(String(15), nullable=False, unique=True)
    password = Column(String(255), nullable=False)
    role = Column(String(10), nullable=False)
    language = Column(String(5), nullable=True)
    
    # Property aliases for backward compatibility
    @property
    def id(self):
        """Alias for user_id for backward compatibility"""
        return self.user_id
    
    @property
    def language_enum(self):
        """Convert language string to UserLanguage enum"""
        if not self.language:
            return UserLanguage.EN_IN
        
        # Handle both enum names (EN_IN) and values (en-IN)
        lang_str = str(self.language).upper()
        if lang_str == "EN_IN" or lang_str == "EN-IN":
            return UserLanguage.EN_IN
        elif lang_str == "HI_IN" or lang_str == "HI-IN":
            return UserLanguage.HI_IN
        else:
            # Try to match by value
            try:
                return UserLanguage(self.language)
            except ValueError:
                return UserLanguage.EN_IN
