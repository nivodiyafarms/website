from sqlalchemy import Column, String, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
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
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(64), nullable=False)
    phone = Column(String(15), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.WORKER)
    language = Column(SQLEnum(UserLanguage), nullable=True, default=UserLanguage.EN_IN)

