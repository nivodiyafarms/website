# backend/app/models/task_field.py
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class TaskField(Base):
    """Junction: one task can span multiple fields."""
    __tablename__ = "task_fields"

    task_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tasks.task_id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
    )
    field_id = Column(
        String,
        ForeignKey("fields.field_id", ondelete="RESTRICT"),
        primary_key=True,
        nullable=False,
    )

    task = relationship("Task", back_populates="task_fields")
    field = relationship("Field")
