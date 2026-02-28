# backend/app/api/notes.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.models.user import User
from app.database import get_db
from app.models.note import Note
from app.auth.security import get_current_user
router = APIRouter(prefix="/api/notes", tags=["notes"])


# -----------------------------
# Get Notes
# -----------------------------
@router.get("/{related_type}/{related_id}")
def get_notes(
    related_type: str,
    related_id: UUID,
    db: Session = Depends(get_db)
):
    notes = (
        db.query(Note)
        .filter(
            Note.related_type == related_type,
            Note.related_id == related_id
        )
        .order_by(Note.created_at.desc())
        .all()
    )

    return notes


# -----------------------------
# Create Note
# -----------------------------
@router.post("/")
def create_note(
    related_type: str,
    related_id: UUID,
    text: str = None,
    media_url: str = None,
    media_type: str = None,
    db: Session = Depends(get_db),
):
    if not text and not media_url:
        raise HTTPException(status_code=400, detail="Note cannot be empty")

    note = Note(
        related_type=related_type,
        related_id=related_id,
        text=text,
        media_url=media_url,
        media_type=media_type,
        author_id=None  # keep null for now
    )

    db.add(note)
    db.commit()
    db.refresh(note)

    return note



@router.delete("/{note_id}", status_code=204)
def delete_note(
    note_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note = db.query(Note).filter(Note.id == note_id).first()

    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    # Optional: Only allow author to delete
    if note.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this note")

    db.delete(note)
    db.commit()

    return None
