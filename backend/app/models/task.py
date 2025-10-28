from sqlalchemy import Column, String, Float, DateTime, Text, ForeignKey, Enum as SQLEnum, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid
from app.database import Base


class TaskType(str, enum.Enum):
    IRRIGATION = "IRRIGATION"
    FERTILIZER = "FERTILIZER"
    PESTICIDE = "PESTICIDE"
    FUNGICIDE = "FUNGICIDE"
    HERBICIDE = "HERBICIDE"
    WEEDING = "WEEDING"
    LABOR = "LABOR"
    SPRAY = "SPRAY"
    SCOUTING = "SCOUTING"
    TRANSPORT = "TRANSPORT"
    HARVEST = "HARVEST"
    STORAGE_IN = "STORAGE_IN"
    STORAGE_OUT = "STORAGE_OUT"
    SALE = "SALE"
    PAYMENT = "PAYMENT"
    OTHER = "OTHER"


class TaskStatus(str, enum.Enum):
    NEW = "NEW"
    IN_PROGRESS = "IN_PROGRESS"
    ON_HOLD = "ON_HOLD"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"
    REOPENED = "REOPENED"
    CANCELLED = "CANCELLED"


class SeverityLevel(str, enum.Enum):
    SEV_1 = "SEV_1"  # Critical (>50,000)
    SEV_2 = "SEV_2"  # High (20,000-50,000)
    SEV_3 = "SEV_3"  # Medium (5,000-20,000)
    SEV_4 = "SEV_4"  # Low (<5,000)


class Task(Base):
    """
    Child Incident - Task within a Crop Cycle
    Represents individual activities and their resources
    """
    __tablename__ = "tasks"

    # Primary Key
    task_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Parent Crop Cycle
    crop_cycle_id = Column(UUID(as_uuid=True), ForeignKey("crop_cycle_incidents.incident_id"), nullable=False)
    
    # Task Information
    task_type = Column(SQLEnum(TaskType), nullable=False)
    short_description = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # Assignment
    assigned_to_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    approved_by_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    
    # Execution Details
    occurred_at = Column(DateTime, nullable=True)
    
    # Resource Summary
    labor_count = Column(Integer, nullable=True)
    labor_hours = Column(Float, nullable=True)
    total_cost = Column(Float, nullable=False, default=0.0)
    
    # Outcome
    outcome_observation = Column(Text, nullable=True)
    severity = Column(SQLEnum(SeverityLevel), nullable=True)
    
    # Status Management
    status = Column(SQLEnum(TaskStatus), nullable=False, default=TaskStatus.NEW)
    on_hold_reason = Column(Text, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    
    # Location
    gps_lat = Column(Float, nullable=True)
    gps_lng = Column(Float, nullable=True)
    
    # Attachments
    attachments = Column(Text, nullable=True)  # JSON array of file paths
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)
    
    # Voice Recording Metadata
    is_voice_recorded = Column(String(10), nullable=False, default="false")
    audio_file_path = Column(String(500), nullable=True)
    transcript = Column(Text, nullable=True)
    
    # Relationships
    crop_cycle = relationship("CropCycleIncident", back_populates="tasks")
    assigned_to = relationship("User", foreign_keys=[assigned_to_id], backref="assigned_tasks")
    created_by = relationship("User", foreign_keys=[created_by_id], backref="created_tasks")
    approved_by = relationship("User", foreign_keys=[approved_by_id], backref="approved_tasks")
    resources = relationship("TaskResource", back_populates="task", cascade="all, delete-orphan")


class ResourceType(str, enum.Enum):
    LABOR = "LABOR"
    EQUIPMENT = "EQUIPMENT"
    MATERIAL = "MATERIAL"
    WATER = "WATER"
    FUEL = "FUEL"


class TaskResource(Base):
    """
    Resources used in a task (labor, equipment, materials, etc.)
    """
    __tablename__ = "task_resources"

    # Primary Key
    resource_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Parent Task
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.task_id"), nullable=False)
    
    # Resource Information
    resource_type = Column(SQLEnum(ResourceType), nullable=False)
    name = Column(String(200), nullable=False)  # e.g., "DAP 18-46-0", "Tractor"
    quantity = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False)  # kg, L, hr, acre, mm
    cost_per_unit = Column(Float, nullable=True)
    total_cost = Column(Float, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    task = relationship("Task", back_populates="resources")


