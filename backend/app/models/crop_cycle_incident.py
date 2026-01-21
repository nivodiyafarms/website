"""
CropCycleIncident model - Matches crop_cycle_incidents table in database
Note: There are two tables - crop_cycles and crop_cycle_incidents
Tasks table references crop_cycle_incidents.incident_id
"""
from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, foreign
import uuid
import enum
from datetime import datetime
from app.database import Base
from app.models.crop_cycle import CropStage, CropCycleStatus


class CropCycleIncident(Base):
    """
    Crop Cycle Incident - Represents a crop cycle incident in the database
    Matches the crop_cycle_incidents table schema exactly
    This is the table that tasks reference via foreign key
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
    current_stage = Column(String(11), nullable=False)
    status = Column(String(6), nullable=False)
    
    # Supervisor
    supervisor_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    
    # Descriptions
    short_description = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Timestamps
    opened_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)
    
    # Voice recording
    is_voice_recorded = Column(String(10), nullable=False, default="no")
    audio_file_path = Column(String(500), nullable=True)
    transcript = Column(Text, nullable=True)
    
    # Relationships
    tasks = relationship("Task", foreign_keys="Task.crop_cycle_id", viewonly=True)
    field = relationship("Field", foreign_keys=[field_id], viewonly=True)
    supervisor = relationship("User", foreign_keys=[supervisor_id], viewonly=True)
    
    # Property aliases for backward compatibility
    @property
    def id(self):
        """Alias for incident_id"""
        return self.incident_id
    
    @property
    def crop_cycle_id(self):
        """Alias for incident_id"""
        return self.incident_id


# Export enums for backward compatibility
__all__ = ["CropCycleIncident", "CropStage", "CropCycleStatus"]
