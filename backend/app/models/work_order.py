from sqlalchemy import Column, String, Date, DateTime, Text, ForeignKey, Enum as SQLEnum, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, foreign
from datetime import datetime
import enum
import uuid
from app.database import Base


class WorkOrderStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    PARTIALLY_COMPLETE = "partially_complete"
    CANCELLED = "cancelled"


class WorkOrder(Base):
    """
    Work Order - Instructions/assignments for workers
    Matches the work_orders table schema exactly
    """
    __tablename__ = "work_orders"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Work Order Number
    work_order_no = Column(Text, nullable=True, unique=True)
    
    # Parent Task
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=True)  # Changed from crop_cycle_id
    
    # Work Order Details
    title = Column(Text, nullable=False)  # Changed from String(200)
    description = Column(Text, nullable=True)  # Changed from NOT NULL
    
    # Assignment (FKs to auth.users)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("auth.users.id"), nullable=True)  # Changed from assigned_to_id
    created_by = Column(UUID(as_uuid=True), ForeignKey("auth.users.id"), nullable=True)  # Changed from created_by_id
    
    # Status
    status = Column(String(11), nullable=True)  # Changed from NOT NULL, enum type
    
    # Scheduling
    due_date = Column(Date, nullable=True)  # Changed from DateTime
    
    # Timestamps
    created_at = Column(DateTime, nullable=True, default=datetime.utcnow)  # Changed from NOT NULL
    updated_at = Column(DateTime, nullable=True, default=datetime.utcnow, onupdate=datetime.utcnow)  # Changed from NOT NULL
    closed_at = Column(DateTime, nullable=True)
    
    # Relationships
    task = relationship("Task", back_populates="work_orders", foreign_keys=[task_id])
    # Note: assigned_to and created_by relationships point to auth.users
    resources = relationship("WorkOrderResource", back_populates="work_order")
    notes = relationship("Note", primaryjoin="and_(foreign(Note.related_id)==WorkOrder.id, Note.related_type=='work_order')", viewonly=True)
    
    # Property aliases for backward compatibility
    @property
    def work_order_id(self):
        """Alias for id for backward compatibility"""
        return self.id
    
    @property
    def assigned_to_id(self):
        """Alias for assigned_to for backward compatibility"""
        return self.assigned_to
    
    @property
    def created_by_id(self):
        """Alias for created_by for backward compatibility"""
        return self.created_by
    
    @property
    def crop_cycle_id(self):
        """Get crop_cycle_id from task if available"""
        if self.task and self.task.crop_cycle_id:
            return self.task.crop_cycle_id
        return None
    
    # Computed time taken (in hours)
    @property
    def time_taken_hours(self):
        if self.closed_at and self.created_at:
            delta = self.closed_at - self.created_at
            return round(delta.total_seconds() / 3600, 2)
        return None


class WorkOrderResource(Base):
    """
    Resources used in a work order (labor, equipment, materials, etc.)
    Matches the work_order_resources table schema exactly
    """
    __tablename__ = "work_order_resources"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Parent Work Order
    work_order_id = Column(UUID(as_uuid=True), ForeignKey("work_orders.id"), nullable=True)
    
    # Resource Information
    resource_type = Column(String(8), nullable=True)  # Changed from enum
    name = Column(Text, nullable=True)  # Changed from NOT NULL
    qty = Column(Numeric, nullable=True)  # Changed from quantity, Float to Numeric
    unit = Column(Text, nullable=True)  # Changed from NOT NULL
    rate = Column(Numeric, nullable=True)  # Changed from cost_per_unit, Float to Numeric
    cost = Column(Numeric, nullable=True)  # Changed from total_cost, Float to Numeric
    
    # Timestamps
    created_at = Column(DateTime, nullable=True, default=datetime.utcnow)  # Changed from NOT NULL
    
    # Relationships
    work_order = relationship("WorkOrder", back_populates="resources", foreign_keys=[work_order_id])
    
    # Property aliases for backward compatibility
    @property
    def quantity(self):
        """Alias for qty for backward compatibility"""
        return self.qty
    
    @property
    def cost_per_unit(self):
        """Alias for rate for backward compatibility"""
        return self.rate
    
    @property
    def total_cost(self):
        """Alias for cost for backward compatibility"""
        return self.cost
