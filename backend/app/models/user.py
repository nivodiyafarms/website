# backend/app/models/user.py
from sqlalchemy import Column, String, text
from sqlalchemy.dialects.postgresql import UUID, JSONB, ENUM as PGEnum
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import object_session
import uuid
import enum
from app.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    SUPERVISOR = "supervisor"
    WORKER = "worker"


class UserLanguage(str, enum.Enum):
    EN_IN = "en_in"
    HI_IN = "hi_in"


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
    role = Column(PGEnum(UserRole, name="userrole", create_type=False, values_callable=lambda enum_cls: [e.value for e in enum_cls]), nullable=False)
    language = Column(PGEnum(UserLanguage, name="userlanguage", create_type=False, values_callable=lambda enum_cls: [e.value for e in enum_cls]), nullable=True)
    
    # Property aliases for backward compatibility
    @property
    def id(self):
        """Alias for user_id for backward compatibility"""
        return self.user_id
