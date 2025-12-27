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
    User model - Points to auth.users table in Supabase
    Note: Supabase auth.users has limited columns: id, email, encrypted_password, etc.
    Custom fields (name, phone, role, language) are accessed via properties that may
    read from user_metadata JSONB or a separate table. For queries, only use columns
    that exist in auth.users.
    """
    __tablename__ = "users"
    __table_args__ = {'schema': 'auth'}  # Point to auth schema
    
    # Primary Key - matches auth.users.id (UUID)
    id = Column(UUID(as_uuid=True), primary_key=True)
    
    # Note: We can't directly map auth.users columns that we don't have access to
    # We'll use hybrid properties to query user_metadata JSONB
    
    # Property aliases for backward compatibility
    @property
    def user_id(self):
        """Alias for id for backward compatibility"""
        return self.id
    
    # Custom field properties - read from user_metadata JSONB
    @hybrid_property
    def name(self):
        """Get name from user_metadata JSONB"""
        try:
            session = object_session(self)
            if session:
                result = session.execute(text("""
                    SELECT raw_user_meta_data->>'name' as name
                    FROM auth.users
                    WHERE id = :user_id
                """), {"user_id": str(self.id)})
                row = result.fetchone()
                if row and row.name:
                    return row.name
        except Exception:
            pass
        return "Unknown User"  # Default value instead of None
    
    @hybrid_property
    def phone(self):
        """Get phone from user_metadata JSONB"""
        try:
            session = object_session(self)
            if session:
                result = session.execute(text("""
                    SELECT raw_user_meta_data->>'phone' as phone
                    FROM auth.users
                    WHERE id = :user_id
                """), {"user_id": str(self.id)})
                row = result.fetchone()
                if row and row.phone:
                    return row.phone
        except Exception:
            pass
        return "0000000000"  # Default value instead of None
    
    @property
    def password(self):
        """Get password - would need to access encrypted_password"""
        return None
    
    @hybrid_property
    def role(self):
        """Get role from user_metadata JSONB or return default"""
        try:
            session = object_session(self)
            if session:
                result = session.execute(text("""
                    SELECT raw_user_meta_data->>'role' as role
                    FROM auth.users
                    WHERE id = :user_id
                """), {"user_id": str(self.id)})
                row = result.fetchone()
                if row and row.role:
                    try:
                        return UserRole(row.role)
                    except ValueError:
                        pass
        except Exception:
            pass
        return UserRole.WORKER
    
    @hybrid_property
    def language(self):
        """Get language from user_metadata JSONB or return default"""
        try:
            session = object_session(self)
            if session:
                result = session.execute(text("""
                    SELECT raw_user_meta_data->>'language' as language
                    FROM auth.users
                    WHERE id = :user_id
                """), {"user_id": str(self.id)})
                row = result.fetchone()
                if row and row.language:
                    try:
                        return UserLanguage(row.language)
                    except ValueError:
                        pass
        except Exception:
            pass
        return UserLanguage.EN_IN
