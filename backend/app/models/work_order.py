from sqlalchemy import Column, String, Float, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid
from app.database import Base


class WorkOrderStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    PARTIALLY_COMPLETE = "PARTIALLY_COMPLETE"
    CANCELLED = "CANCELLED"


class WorkOrder(Base):
    """
    Work Order - Instructions/assignments for workers
    """
    __tablename__ = "work_orders"

    # Primary Key
    work_order_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Parent Crop Cycle
    crop_cycle_id = Column(UUID(as_uuid=True), ForeignKey("crop_cycle_incidents.incident_id"), nullable=False)
    
    # Work Order Details
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    instructions = Column(Text, nullable=True)
    
    # Assignment
    assigned_to_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    
    # Scheduling
    due_date = Column(DateTime, nullable=True)
    
    # Status
    status = Column(SQLEnum(WorkOrderStatus), nullable=False, default=WorkOrderStatus.OPEN)
    
    # Linked Tasks
    linked_task_ids = Column(Text, nullable=True)  # JSON array of task UUIDs
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)
    
    # Computed time taken (in hours)
    @property
    def time_taken_hours(self):
        if self.closed_at and self.created_at:
            delta = self.closed_at - self.created_at
            return round(delta.total_seconds() / 3600, 2)
        return None
    
    # Relationships
    crop_cycle = relationship("CropCycleIncident", back_populates="work_orders")
    assigned_to = relationship("User", foreign_keys=[assigned_to_id], backref="assigned_work_orders")
    created_by = relationship("User", foreign_keys=[created_by_id], backref="created_work_orders")


