from sqlalchemy import Column, String, Float, DateTime, Text, ForeignKey, Enum as SQLEnum, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid
from app.database import Base


class CropStage(str, enum.Enum):
    SOWING = "SOWING"
    GERMINATION = "GERMINATION"
    VEGETATIVE = "VEGETATIVE"
    FLOWERING = "FLOWERING"
    FRUITING = "FRUITING"
    HARVEST = "HARVEST"
    STORAGE = "STORAGE"
    SALE = "SALE"
    PAYMENT = "PAYMENT"


class CropCycleStatus(str, enum.Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"


class CropCycleIncident(Base):
    """
    Parent Incident - Crop Cycle Management
    Represents the complete lifecycle of a crop from sowing to payment
    """
    __tablename__ = "crop_cycle_incidents"

    # Primary Key
    incident_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Field Information
    field_id = Column(String(50), ForeignKey("fields.field_id"), nullable=False)
    
    # Crop Information
    crop_name = Column(String(100), nullable=False)
    crop_variety = Column(String(100), nullable=True)
    
    # Dates
    sowing_date = Column(DateTime, nullable=False)
    expected_harvest_date = Column(DateTime, nullable=True)
    
    # Current Status
    current_stage = Column(SQLEnum(CropStage), nullable=False, default=CropStage.SOWING)
    status = Column(SQLEnum(CropCycleStatus), nullable=False, default=CropCycleStatus.OPEN)
    
    # Assignment
    supervisor_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    
    # Descriptions
    short_description = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Timestamps
    opened_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)
    
    # Voice Recording Metadata (for voice-created incidents)
    is_voice_recorded = Column(String(10), nullable=False, default="false")
    audio_file_path = Column(String(500), nullable=True)
    transcript = Column(Text, nullable=True)
    
    # Relationships
    field = relationship("Field", backref="crop_cycle_incidents")
    supervisor = relationship("User", foreign_keys=[supervisor_id], backref="supervised_crop_cycles")
    tasks = relationship("Task", back_populates="crop_cycle", cascade="all, delete-orphan")
    work_orders = relationship("WorkOrder", back_populates="crop_cycle", cascade="all, delete-orphan")


