from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid
from app.database import Base


class IncidentSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class IncidentStatus(str, enum.Enum):
    REPORTED = "REPORTED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class IncidentType(str, enum.Enum):
    PEST_ATTACK = "PEST_ATTACK"
    DISEASE = "DISEASE"
    WEATHER_DAMAGE = "WEATHER_DAMAGE"
    EQUIPMENT_FAILURE = "EQUIPMENT_FAILURE"
    IRRIGATION_ISSUE = "IRRIGATION_ISSUE"
    THEFT = "THEFT"
    ANIMAL_DAMAGE = "ANIMAL_DAMAGE"
    SOIL_ISSUE = "SOIL_ISSUE"
    OTHER = "OTHER"


class Incident(Base):
    __tablename__ = "incidents"

    incident_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Basic Information
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    incident_type = Column(SQLEnum(IncidentType), nullable=False)
    severity = Column(SQLEnum(IncidentSeverity), nullable=False, default=IncidentSeverity.MEDIUM)
    status = Column(SQLEnum(IncidentStatus), nullable=False, default=IncidentStatus.REPORTED)
    
    # Location Information
    field_id = Column(String(50), ForeignKey("fields.field_id"), nullable=True)
    location_description = Column(String(500), nullable=True)
    gps_lat = Column(Float, nullable=True)
    gps_lng = Column(Float, nullable=True)
    
    # Impact Information
    affected_area_acre = Column(Float, nullable=True)
    estimated_loss = Column(Float, nullable=True)  # in currency
    crop_affected = Column(String(100), nullable=True)
    
    # Response Information
    action_taken = Column(Text, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    
    # People Involved
    reported_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    assigned_to_user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    
    # Timestamps
    reported_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    incident_date = Column(DateTime, nullable=True)  # When the incident actually occurred
    resolved_at = Column(DateTime, nullable=True)
    
    # Voice Recording Metadata
    is_voice_recorded = Column(String(10), nullable=False, default="false")  # "true" or "false"
    audio_file_path = Column(String(500), nullable=True)
    transcript = Column(Text, nullable=True)
    
    # Relationships
    field = relationship("Field", backref="incidents")
    reported_by = relationship("User", foreign_keys=[reported_by_user_id], backref="reported_incidents")
    assigned_to = relationship("User", foreign_keys=[assigned_to_user_id], backref="assigned_incidents")

