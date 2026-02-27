# backend/app/models/work_order.py
from sqlalchemy import (
    Column,
    String,
    Date,
    DateTime,
    Text,
    ForeignKey,
    Numeric,
    and_
)
from sqlalchemy.dialects.postgresql import UUID, ENUM as PGEnum
from sqlalchemy.orm import relationship, foreign
from datetime import datetime
import enum
import uuid

from app.database import Base


# -----------------------------
# Work Order Status
# -----------------------------
class WorkOrderStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    PARTIAL = "partial"
    CLOSED = "closed"
    CANCELLED = "cancelled"


# -----------------------------
# Work Order Model
# -----------------------------
class WorkOrder(Base):
    """
    Work Order = execution unit
    Linked strictly to a Task
    """
    __tablename__ = "work_orders"

    # Primary key (matches database: work_order_id)
    work_order_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Human-readable WO number (matches database: work_order_number)
    work_order_number = Column(String, unique=True, nullable=False, index=True)

    # Parent Task (correct hierarchy)
    task_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tasks.task_id", ondelete="CASCADE"),
        nullable=False
    )

    # Details
    short_description = Column(Text, nullable=False)
    description = Column(Text, nullable=True)

    # Assignment
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)

    # Status
    status = Column(
        PGEnum(WorkOrderStatus, name="work_order_status_enum", create_type=False, values_callable=lambda enum_cls: [e.value for e in enum_cls]),
        default=WorkOrderStatus.OPEN,
        nullable=True
    )

    # Scheduling (DATE, not datetime)
    due_date = Column(Date, nullable=True)

    # Audit
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    closed_at = Column(DateTime(timezone=True), nullable=True)

    # -----------------------------
    # Relationships
    # -----------------------------
    task = relationship("Task", foreign_keys=[task_id])

    resources = relationship(
        "WorkOrderResource",
        back_populates="work_order",
        cascade="all, delete-orphan"
    )

    notes = relationship(
        "Note",
        primaryjoin=lambda: and_(
            foreign(__import__("app.models.note", fromlist=["Note"]).Note.related_id) == WorkOrder.work_order_id,
            __import__("app.models.note", fromlist=["Note"]).Note.related_type == "work_order"
        ),
        viewonly=True
    )

    assigned_to_user = relationship("User", foreign_keys=[assigned_to])
    created_by_user = relationship("User", foreign_keys=[created_by])

    # -----------------------------
    # Computed (read-only)
    # -----------------------------
    @property
    def time_taken_hours(self):
        if self.closed_at and self.created_at:
            delta = self.closed_at - self.created_at
            return round(delta.total_seconds() / 3600, 2)
        return None
