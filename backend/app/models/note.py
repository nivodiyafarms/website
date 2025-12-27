# app/models/note.py

from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base
import uuid


class Note(Base):
    """
    Generic Notes / Chat table.
    Used for CropCycle, Task, WorkOrder, GeneralExpense.
    Supports text + attachments (photos, audio, docs).
    """
    __tablename__ = "notes"

    # Primary key
    note_uuid = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Polymorphic reference
    related_type = Column(String(50), index=True, nullable=False)
    related_id = Column(UUID(as_uuid=True), index=True, nullable=False)

    # Content
    message = Column(String, nullable=False)
    attachments = Column(String, nullable=True)  # JSON string (URLs, metadata)

    # Author
    created_by_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id"),
        nullable=False
    )

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())