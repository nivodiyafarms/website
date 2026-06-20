import enum
import uuid
from datetime import datetime

from sqlalchemy import Column, Text, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID, ENUM as PGEnum

from app.database import Base


class WorkerRole(str, enum.Enum):
    WORKER = "worker"
    SUPERVISOR = "supervisor"
    OWNER = "owner"


class Worker(Base):
    """
    Farm worker / supervisor / owner who can be assigned work orders
    and interact with the WhatsApp agent.
    whatsapp_number is personal data — never expose in URLs or public surfaces.
    """
    __tablename__ = "workers"

    worker_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    whatsapp_number = Column(Text, nullable=True)
    role = Column(
        PGEnum(WorkerRole, name="worker_role_enum", create_type=False,
               values_callable=lambda e: [m.value for m in e]),
        nullable=False,
    )
    active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=True)
