from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Enum as SQLEnum, Numeric, Integer, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, foreign
from datetime import datetime
import enum
import uuid
from app.database import Base


class TaskType(str, enum.Enum):
    """Task types - used for validation, stored as VARCHAR(11) in database"""
    IRRIGATION = "irrigation"
    ELECTRICAL = "electrical"  # Added for frontend compatibility
    ROAD = "road"  # Added for frontend compatibility
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
    Matches the actual tasks table schema in database
    """
    __tablename__ = "tasks"

    # Primary Key - database uses task_id, not id
    task_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Parent Crop Cycle - references crop_cycle_incidents table
    crop_cycle_id = Column(UUID(as_uuid=True), ForeignKey("crop_cycle_incidents.incident_id"), nullable=False)
    
    # Task Information
    task_type = Column(String(11), nullable=False)  # Database uses task_type, not type
    short_description = Column(String(200), nullable=False)  # NOT NULL in database
    description = Column(Text, nullable=True)
    
    # Assignment (FKs to users table, not auth.users)
    assigned_to_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)  # NOT NULL in database
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)  # NOT NULL in database
    approved_by_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    
    # Execution Details
    occurred_at = Column(DateTime, nullable=True)
    
    # Labor tracking
    labor_count = Column(Integer, nullable=True)
    labor_hours = Column(Float, nullable=True)
    
    # Cost
    total_cost = Column(Float, nullable=False)  # Database uses total_cost, NOT NULL
    
    # Outcome
    outcome_observation = Column(Text, nullable=True)
    
    # Severity
    severity = Column(String(5), nullable=True)  # VARCHAR(5) in database
    
    # Status
    status = Column(String(11), nullable=False)  # NOT NULL in database
    
    # Hold and resolution
    on_hold_reason = Column(Text, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    
    # GPS
    gps_lat = Column(Float, nullable=True)
    gps_lng = Column(Float, nullable=True)
    
    # Attachments
    attachments = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)  # NOT NULL in database
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)  # NOT NULL in database
    closed_at = Column(DateTime, nullable=True)  # Database uses closed_at, not resolved_at
    
    # Voice recording
    is_voice_recorded = Column(String(10), nullable=False, default="no")  # NOT NULL in database
    audio_file_path = Column(String(500), nullable=True)
    transcript = Column(Text, nullable=True)
    
    # Relationships
    # Note: crop_cycle_incidents table, not crop_cycles
    crop_cycle_incident = relationship("CropCycleIncident", foreign_keys=[crop_cycle_id], viewonly=True)
    work_orders = relationship("WorkOrder", back_populates="task", foreign_keys="WorkOrder.task_id")
    notes = relationship("Note", primaryjoin="and_(foreign(Note.related_id)==Task.task_id, Note.related_type=='task')", viewonly=True)
    assigned_to_user = relationship("User", foreign_keys=[assigned_to_id], viewonly=True)
    created_by_user = relationship("User", foreign_keys=[created_by_id], viewonly=True)
    approved_by_user = relationship("User", foreign_keys=[approved_by_id], viewonly=True)
    
    # Property aliases for backward compatibility
    @property
    def id(self):
        """Alias for task_id for backward compatibility"""
        return self.task_id
    
    @property
    def type(self):
        """Alias for task_type for backward compatibility"""
        return self.task_type
    
    @property
    def created_by(self):
        """Alias for created_by_id for backward compatibility"""
        return self.created_by_id
    
    @property
    def approved_by(self):
        """Alias for approved_by_id for backward compatibility"""
        return self.approved_by
    
    @property
    def cost(self):
        """Alias for total_cost for backward compatibility"""
        return self.total_cost
    
    @property
    def resolved_at(self):
        """Alias for closed_at for backward compatibility"""
        return self.closed_at
    
    @property
    def crop_cycle(self):
        """Alias for crop_cycle_incident for backward compatibility"""
        return self.crop_cycle_incident
