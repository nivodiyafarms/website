from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.models.incident import IncidentSeverity, IncidentStatus, IncidentType


# Base schema with common fields
class IncidentBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10)
    incident_type: IncidentType
    severity: IncidentSeverity = IncidentSeverity.MEDIUM
    
    # Location
    field_id: Optional[str] = None
    location_description: Optional[str] = None
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None
    
    # Impact
    affected_area_acre: Optional[float] = None
    estimated_loss: Optional[float] = None
    crop_affected: Optional[str] = None
    
    # Timing
    incident_date: Optional[datetime] = None


# Schema for creating incident manually
class IncidentCreate(IncidentBase):
    reported_by_user_id: UUID
    assigned_to_user_id: Optional[UUID] = None
    action_taken: Optional[str] = None


# Schema for voice-based incident creation
class VoiceIncidentCreate(BaseModel):
    reported_by_user_id: UUID
    audio_base64: str = Field(..., description="Base64 encoded audio file (WAV/MP3)")


# Schema for GROQ API response
class IncidentFromTranscript(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    incident_type: Optional[IncidentType] = None
    severity: Optional[IncidentSeverity] = None
    field_id: Optional[str] = None
    location_description: Optional[str] = None
    affected_area_acre: Optional[float] = None
    estimated_loss: Optional[float] = None
    crop_affected: Optional[str] = None
    incident_date: Optional[str] = None  # ISO format string
    action_taken: Optional[str] = None


# Schema for updating incident
class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    incident_type: Optional[IncidentType] = None
    severity: Optional[IncidentSeverity] = None
    status: Optional[IncidentStatus] = None
    field_id: Optional[str] = None
    location_description: Optional[str] = None
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None
    affected_area_acre: Optional[float] = None
    estimated_loss: Optional[float] = None
    crop_affected: Optional[str] = None
    action_taken: Optional[str] = None
    resolution_notes: Optional[str] = None
    assigned_to_user_id: Optional[UUID] = None


# Schema for incident response
class IncidentResponse(IncidentBase):
    incident_id: int
    status: IncidentStatus
    reported_by_user_id: UUID
    assigned_to_user_id: Optional[UUID]
    reported_at: datetime
    resolved_at: Optional[datetime]
    is_voice_recorded: str
    transcript: Optional[str]
    action_taken: Optional[str]
    resolution_notes: Optional[str]
    
    class Config:
        from_attributes = True


# Schema for voice incident preview (before confirmation)
class VoiceIncidentPreview(BaseModel):
    transcript: str
    extracted_data: IncidentFromTranscript
    audio_file_path: str


# Schema for confirming voice incident
class VoiceIncidentConfirm(BaseModel):
    audio_file_path: str
    transcript: str
    extracted_data: IncidentFromTranscript
    reported_by_user_id: UUID

