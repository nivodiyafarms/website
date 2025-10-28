"""
Incident Management API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
import os
import base64
import uuid
from datetime import datetime

from app.database import get_db
from app.models.incident import Incident, IncidentStatus
from app.schemas.incident import (
    IncidentCreate,
    IncidentResponse,
    IncidentUpdate,
    VoiceIncidentCreate,
    VoiceIncidentPreview,
    IncidentFromTranscript,
    VoiceIncidentConfirm
)
from app.services.groq_service import GroqService
from app.auth.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/incidents", tags=["Incidents"])

# Directory for storing audio files
AUDIO_DIR = "uploads/audio"
os.makedirs(AUDIO_DIR, exist_ok=True)


@router.post("/manual", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
def create_incident_manual(
    incident: IncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create incident manually with form data
    """
    # Create incident
    db_incident = Incident(
        title=incident.title,
        description=incident.description,
        incident_type=incident.incident_type,
        severity=incident.severity,
        status=IncidentStatus.REPORTED,
        field_id=incident.field_id,
        location_description=incident.location_description,
        gps_lat=incident.gps_lat,
        gps_lng=incident.gps_lng,
        affected_area_acre=incident.affected_area_acre,
        estimated_loss=incident.estimated_loss,
        crop_affected=incident.crop_affected,
        incident_date=incident.incident_date,
        action_taken=incident.action_taken,
        reported_by_user_id=incident.reported_by_user_id,
        assigned_to_user_id=incident.assigned_to_user_id,
        is_voice_recorded="false"
    )
    
    db.add(db_incident)
    db.commit()
    db.refresh(db_incident)
    
    return db_incident


@router.post("/voice/upload", response_model=VoiceIncidentPreview)
async def upload_voice_incident(
    file: UploadFile = File(..., description="Audio file (WAV, MP3, M4A)"),
    reported_by_user_id: UUID = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload audio file, transcribe it, and extract incident data.
    Returns preview for user confirmation.
    """
    # Validate file type
    allowed_extensions = [".wav", ".mp3", ".m4a", ".ogg", ".webm"]
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Save audio file
    file_id = str(uuid.uuid4())
    audio_filename = f"{file_id}{file_ext}"
    audio_path = os.path.join(AUDIO_DIR, audio_filename)
    
    try:
        with open(audio_path, "wb") as audio_file:
            content = await file.read()
            audio_file.write(content)
        
        # Process with GROQ
        groq_service = GroqService()
        result = groq_service.process_voice_incident(audio_path)
        
        return VoiceIncidentPreview(
            transcript=result["transcript"],
            extracted_data=result["extracted_data"],
            audio_file_path=audio_path
        )
        
    except ValueError as e:
        # Clean up audio file on error
        if os.path.exists(audio_path):
            os.remove(audio_path)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Clean up audio file on error
        if os.path.exists(audio_path):
            os.remove(audio_path)
        raise HTTPException(status_code=500, detail=f"Error processing audio: {str(e)}")


@router.post("/voice/confirm", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
def confirm_voice_incident(
    data: VoiceIncidentConfirm,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Confirm and save voice-recorded incident after user review.
    User can modify extracted_data before confirming.
    """
    # Parse incident_date if provided
    incident_date = None
    if data.extracted_data.incident_date:
        try:
            incident_date = datetime.fromisoformat(data.extracted_data.incident_date.replace('Z', '+00:00'))
        except:
            pass
    
    # Create incident
    db_incident = Incident(
        title=data.extracted_data.title or "Untitled Incident",
        description=data.extracted_data.description or data.transcript,
        incident_type=data.extracted_data.incident_type if data.extracted_data.incident_type else "OTHER",
        severity=data.extracted_data.severity if data.extracted_data.severity else "MEDIUM",
        status=IncidentStatus.REPORTED,
        field_id=data.extracted_data.field_id,
        location_description=data.extracted_data.location_description,
        affected_area_acre=data.extracted_data.affected_area_acre,
        estimated_loss=data.extracted_data.estimated_loss,
        crop_affected=data.extracted_data.crop_affected,
        incident_date=incident_date,
        action_taken=data.extracted_data.action_taken,
        reported_by_user_id=data.reported_by_user_id,
        is_voice_recorded="true",
        audio_file_path=data.audio_file_path,
        transcript=data.transcript
    )
    
    db.add(db_incident)
    db.commit()
    db.refresh(db_incident)
    
    return db_incident


@router.get("/", response_model=List[IncidentResponse])
def get_incidents(
    skip: int = 0,
    limit: int = 100,
    status: Optional[IncidentStatus] = None,
    field_id: Optional[str] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get list of incidents with optional filters
    """
    query = db.query(Incident)
    
    if status:
        query = query.filter(Incident.status == status)
    if field_id:
        query = query.filter(Incident.field_id == field_id)
    if severity:
        query = query.filter(Incident.severity == severity)
    
    incidents = query.order_by(Incident.reported_at.desc()).offset(skip).limit(limit).all()
    return incidents


@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get specific incident by ID
    """
    incident = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    return incident


@router.put("/{incident_id}", response_model=IncidentResponse)
def update_incident(
    incident_id: int,
    incident_update: IncidentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update incident details
    """
    db_incident = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    
    if not db_incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    # Update fields
    update_data = incident_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_incident, field, value)
    
    # Set resolved_at if status changed to RESOLVED or CLOSED
    if incident_update.status in [IncidentStatus.RESOLVED, IncidentStatus.CLOSED]:
        if not db_incident.resolved_at:
            db_incident.resolved_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_incident)
    
    return db_incident


@router.delete("/{incident_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete incident (admin only)
    """
    db_incident = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    
    if not db_incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    # Delete associated audio file if exists
    if db_incident.audio_file_path and os.path.exists(db_incident.audio_file_path):
        os.remove(db_incident.audio_file_path)
    
    db.delete(db_incident)
    db.commit()
    
    return None

