"""
Crop Cycle Notes API
Supports image uploads and cross-platform synchronization
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from uuid import UUID
import os
import uuid as uuid_lib
from datetime import datetime

from app.database import get_db
from app.models.crop_cycle_note import CropCycleNote
from app.models.crop_cycle_incident import CropCycleIncident
from app.models.user import User
from app.schemas.crop_cycle_note import CropCycleNoteCreate, CropCycleNoteUpdate, CropCycleNoteResponse
from app.auth.security import get_current_user

router = APIRouter(prefix="/crop-cycle-notes", tags=["Crop Cycle Notes"])

# Directory for storing note images
NOTES_IMAGE_DIR = "uploads/notes"
os.makedirs(NOTES_IMAGE_DIR, exist_ok=True)


@router.post("/{crop_cycle_id}/notes", response_model=CropCycleNoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    crop_cycle_id: UUID,
    content: str = Form(...),
    source: str = Form("web"),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new note for a crop cycle with optional image upload"""
    # Verify crop cycle exists
    cycle = db.query(CropCycleIncident).filter(CropCycleIncident.incident_id == crop_cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Crop cycle not found")
    
    image_path = None
    
    # Handle image upload
    if image and image.filename:
        # Validate file type
        allowed_extensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"]
        file_ext = os.path.splitext(image.filename)[1].lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid image type. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Save image file
        file_id = str(uuid_lib.uuid4())
        image_filename = f"{file_id}{file_ext}"
        image_path = os.path.join(NOTES_IMAGE_DIR, image_filename)
        
        try:
            with open(image_path, "wb") as img_file:
                img_content = await image.read()
                img_file.write(img_content)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error saving image: {str(e)}")
    
    # Create note
    note = CropCycleNote(
        crop_cycle_id=crop_cycle_id,
        user_id=current_user.user_id,
        content=content,
        image_path=image_path,
        source=source
    )
    
    db.add(note)
    db.commit()
    db.refresh(note)
    
    # Fetch with user details
    note_with_user = db.query(CropCycleNote).options(
        joinedload(CropCycleNote.user)
    ).filter(CropCycleNote.note_id == note.note_id).first()
    
    # Prepare response
    response = CropCycleNoteResponse.model_validate(note_with_user)
    response.user_name = note_with_user.user.name if note_with_user.user else None
    response.user_email = note_with_user.user.phone if note_with_user.user else None  # Using phone as identifier
    
    return response


@router.get("/{crop_cycle_id}/notes", response_model=List[CropCycleNoteResponse])
def get_notes(
    crop_cycle_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all notes for a crop cycle"""
    # Verify crop cycle exists
    cycle = db.query(CropCycleIncident).filter(CropCycleIncident.incident_id == crop_cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Crop cycle not found")
    
    # Fetch notes with user details
    notes = db.query(CropCycleNote).options(
        joinedload(CropCycleNote.user)
    ).filter(
        CropCycleNote.crop_cycle_id == crop_cycle_id
    ).order_by(
        CropCycleNote.created_at.asc()  # Oldest first for chat-like interface
    ).offset(skip).limit(limit).all()
    
    # Prepare responses
    responses = []
    for note in notes:
        response = CropCycleNoteResponse.model_validate(note)
        response.user_name = note.user.name if note.user else None
        response.user_email = note.user.phone if note.user else None  # Using phone as identifier
        responses.append(response)
    
    return responses


@router.get("/{crop_cycle_id}/notes/{note_id}", response_model=CropCycleNoteResponse)
def get_note(
    crop_cycle_id: UUID,
    note_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific note"""
    note = db.query(CropCycleNote).options(
        joinedload(CropCycleNote.user)
    ).filter(
        CropCycleNote.note_id == note_id,
        CropCycleNote.crop_cycle_id == crop_cycle_id
    ).first()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    response = CropCycleNoteResponse.model_validate(note)
    response.user_name = note.user.name if note.user else None
    response.user_email = note.user.phone if note.user else None  # Using phone as identifier
    
    return response


@router.put("/{crop_cycle_id}/notes/{note_id}", response_model=CropCycleNoteResponse)
async def update_note(
    crop_cycle_id: UUID,
    note_id: UUID,
    content: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a note (only by the creator)"""
    note = db.query(CropCycleNote).filter(
        CropCycleNote.note_id == note_id,
        CropCycleNote.crop_cycle_id == crop_cycle_id
    ).first()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Check if user is the creator
    if note.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="You can only edit your own notes")
    
    # Update content
    if content:
        note.content = content
    
    # Handle image upload
    if image and image.filename:
        # Delete old image if exists
        if note.image_path and os.path.exists(note.image_path):
            try:
                os.remove(note.image_path)
            except:
                pass
        
        # Validate and save new image
        allowed_extensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"]
        file_ext = os.path.splitext(image.filename)[1].lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid image type. Allowed: {', '.join(allowed_extensions)}"
            )
        
        file_id = str(uuid_lib.uuid4())
        image_filename = f"{file_id}{file_ext}"
        image_path = os.path.join(NOTES_IMAGE_DIR, image_filename)
        
        try:
            with open(image_path, "wb") as img_file:
                img_content = await image.read()
                img_file.write(img_content)
            note.image_path = image_path
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error saving image: {str(e)}")
    
    note.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(note)
    
    # Fetch with user details
    note_with_user = db.query(CropCycleNote).options(
        joinedload(CropCycleNote.user)
    ).filter(CropCycleNote.note_id == note.note_id).first()
    
    response = CropCycleNoteResponse.model_validate(note_with_user)
    response.user_name = note_with_user.user.name if note_with_user.user else None
    response.user_email = note_with_user.user.phone if note_with_user.user else None  # Using phone as identifier
    
    return response


@router.delete("/{crop_cycle_id}/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    crop_cycle_id: UUID,
    note_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a note (only by the creator)"""
    note = db.query(CropCycleNote).filter(
        CropCycleNote.note_id == note_id,
        CropCycleNote.crop_cycle_id == crop_cycle_id
    ).first()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Check if user is the creator
    if note.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="You can only delete your own notes")
    
    # Delete image if exists
    if note.image_path and os.path.exists(note.image_path):
        try:
            os.remove(note.image_path)
        except:
            pass
    
    db.delete(note)
    db.commit()
    return None

