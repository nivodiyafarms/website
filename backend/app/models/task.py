from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Enum as SQLEnum, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, foreign
from datetime import datetime
import enum
import uuid
from app.database import Base


class TaskType(str, enum.Enum):
    """Task types - used for validation, stored as TEXT in database"""
    IRRIGATION = "irrigation"
    FERTILIZER = "fertilizer"
    PESTICIDE = "pesticide"
    FUNGICIDE = "fungicide"
    HERBICIDE = "herbicide"
    WEEDING = "weeding"
    LABOR = "labor"
    SPRAY = "spray"
    SCOUTING = "scouting"
    TRANSPORT = "transport"
    HARVEST = "harvest"
    STORAGE_IN = "storage_in"
    STORAGE_OUT = "storage_out"
    SALE = "sale"
    PAYMENT = "payment"
    OTHER = "other"


class TaskStatus(str, enum.Enum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    RESOLVED = "resolved"
    CLOSED = "closed"
    REOPENED = "reopened"
    CANCELLED = "cancelled"


class SeverityLevel(str, enum.Enum):
    SEV_1 = "sev1"  # Critical
    SEV_2 = "sev2"  # High
    SEV_3 = "sev3"  # Medium
    SEV_4 = "sev4"  # Low


class ResourceType(str, enum.Enum):
    """Resource types - used for validation in work orders"""
    LABOR = "labor"
    EQUIPMENT = "equipment"
    MATERIAL = "material"
    WATER = "water"
    FUEL = "fuel"


class Task(Base):
    """
    Task - Represents a task within a crop cycle
    Matches the tasks table schema exactly
    """
    __tablename__ = "tasks"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Task Number
    task_no = Column(Text, nullable=True, unique=True)
    
    # Parent Crop Cycle
    crop_cycle_id = Column(UUID(as_uuid=True), ForeignKey("crop_cycles.id"), nullable=True)  # Changed FK and nullable
    
    # Task Information
    type = Column(Text, nullable=False)  # Changed from task_type
    sub_type = Column(Text, nullable=True)  # New field
    short_description = Column(Text, nullable=True)  # Changed from NOT NULL
    description = Column(Text, nullable=True)
    
    # Status
    status = Column(String(11), nullable=True)  # Changed from NOT NULL, enum type
    
    # Execution Details
    occurred_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)  # Changed from closed_at
    
    # Severity
    severity = Column(String(4), nullable=True)  # Changed from enum to VARCHAR
    
    # Cost
    cost = Column(Numeric, nullable=True, default=0)  # Changed from total_cost, Float to Numeric
    
    # Assignment (FKs to auth.users)
    created_by = Column(UUID(as_uuid=True), ForeignKey("auth.users.id"), nullable=True)  # Changed from created_by_id
    approved_by = Column(UUID(as_uuid=True), ForeignKey("auth.users.id"), nullable=True)  # Changed from approved_by_id
    
    # Timestamps
    created_at = Column(DateTime, nullable=True, default=datetime.utcnow)  # Changed from NOT NULL
    updated_at = Column(DateTime, nullable=True, default=datetime.utcnow, onupdate=datetime.utcnow)  # Changed from NOT NULL
    
    # Relationships
    crop_cycle = relationship("CropCycle", back_populates="tasks", foreign_keys=[crop_cycle_id])
    # Note: assigned_to relationship removed - not in database
    # Note: created_by and approved_by relationships point to auth.users
    work_orders = relationship("WorkOrder", back_populates="task", foreign_keys="WorkOrder.task_id")
    notes = relationship("Note", primaryjoin="and_(foreign(Note.related_id)==Task.id, Note.related_type=='task')", viewonly=True)
    
    # Property aliases for backward compatibility
    @property
    def task_id(self):
        """Alias for id for backward compatibility"""
        return self.id
    
    @property
    def task_type(self):
        """Alias for type for backward compatibility"""
        return self.type
    
    @property
    def created_by_id(self):
        """Alias for created_by for backward compatibility"""
        return self.created_by
    
    @property
    def approved_by_id(self):
        """Alias for approved_by for backward compatibility"""
        return self.approved_by
    
    @property
    def total_cost(self):
        """Alias for cost for backward compatibility"""
        return self.cost
    
    @property
    def closed_at(self):
        """Alias for resolved_at for backward compatibility"""
        return self.resolved_at
