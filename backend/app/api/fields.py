from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.field import Field
from app.models.user import User
from app.schemas.field import FieldCreate, FieldUpdate, FieldResponse
from app.auth.security import get_current_user

router = APIRouter(prefix="/api/fields", tags=["fields"])


@router.get("/", response_model=List[FieldResponse])
def get_fields(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    fields = db.query(Field).all()
    return fields


@router.get("/{field_id}", response_model=FieldResponse)
def get_field(field_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    field = db.query(Field).filter(Field.field_id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    return field


@router.post("/", response_model=FieldResponse, status_code=status.HTTP_201_CREATED)
def create_field(field: FieldCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if field_id already exists
    db_field = db.query(Field).filter(Field.field_id == field.field_id).first()
    if db_field:
        raise HTTPException(status_code=400, detail="Field ID already exists")
    
    db_field = Field(**field.model_dump())
    db.add(db_field)
    db.commit()
    db.refresh(db_field)
    return db_field


@router.put("/{field_id}", response_model=FieldResponse)
def update_field(
    field_id: str,
    field_update: FieldUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_field = db.query(Field).filter(Field.field_id == field_id).first()
    if not db_field:
        raise HTTPException(status_code=404, detail="Field not found")
    
    update_data = field_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_field, key, value)
    
    db.commit()
    db.refresh(db_field)
    return db_field


@router.delete("/{field_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_field(field_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_field = db.query(Field).filter(Field.field_id == field_id).first()
    if not db_field:
        raise HTTPException(status_code=404, detail="Field not found")
    
    db.delete(db_field)
    db.commit()
    return None

