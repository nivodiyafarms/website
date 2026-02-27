from sqlalchemy import (
    Column,
    String,
    Text,
    DateTime
)
from sqlalchemy.dialects.postgresql import UUID, ENUM as PGEnum
from datetime import datetime
import uuid
import enum

from app.database import Base


class RelatedType(str, enum.Enum):
    CROP_CYCLE = "crop_cycle"
    TASK = "task"
    WORK_ORDER = "work_order"
    EXPENSE = "expense"


class Note(Base):
    __tablename__ = "notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    related_type = Column(
        PGEnum(
            RelatedType,
            name="related_type_enum",
            create_type=False,
            values_callable=lambda enum_cls: [e.value for e in enum_cls]
        ),
        nullable=True
    )

    related_id = Column(UUID(as_uuid=True), nullable=True)

    # ⚠ Make nullable for now to avoid FK crash
    author_id = Column(UUID(as_uuid=True), nullable=True)

    text = Column(Text, nullable=True)

    media_url = Column(String, nullable=True)
    media_type = Column(String(20), nullable=True)

    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)