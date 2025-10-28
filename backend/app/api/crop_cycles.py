from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app.models.crop_cycle import CropCycle
from app.models.user import User
from app.schemas.crop_cycle import CropCycleCreate, CropCycleUpdate, CropCycleResponse
from app.auth.security import get_current_user

router = APIRouter(prefix="/api/crop-cycles", tags=["crop-cycles"])


@router.get("/", response_model=List[CropCycleResponse])
def get_crop_cycles(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    crop_cycles = db.query(CropCycle).all()
    return crop_cycles


@router.get("/{crop_cycle_id}", response_model=CropCycleResponse)
def get_crop_cycle(
    crop_cycle_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    crop_cycle = db.query(CropCycle).filter(CropCycle.crop_cycle_id == crop_cycle_id).first()
    if not crop_cycle:
        raise HTTPException(status_code=404, detail="Crop cycle not found")
    return crop_cycle


@router.post("/", response_model=CropCycleResponse, status_code=status.HTTP_201_CREATED)
def create_crop_cycle(
    crop_cycle: CropCycleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_crop_cycle = CropCycle(**crop_cycle.model_dump())
    db.add(db_crop_cycle)
    db.commit()
    db.refresh(db_crop_cycle)
    return db_crop_cycle


@router.put("/{crop_cycle_id}", response_model=CropCycleResponse)
def update_crop_cycle(
    crop_cycle_id: UUID,
    crop_cycle_update: CropCycleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_crop_cycle = db.query(CropCycle).filter(CropCycle.crop_cycle_id == crop_cycle_id).first()
    if not db_crop_cycle:
        raise HTTPException(status_code=404, detail="Crop cycle not found")
    
    update_data = crop_cycle_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_crop_cycle, key, value)
    
    db.commit()
    db.refresh(db_crop_cycle)
    return db_crop_cycle


@router.delete("/{crop_cycle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_crop_cycle(
    crop_cycle_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_crop_cycle = db.query(CropCycle).filter(CropCycle.crop_cycle_id == crop_cycle_id).first()
    if not db_crop_cycle:
        raise HTTPException(status_code=404, detail="Crop cycle not found")
    
    db.delete(db_crop_cycle)
    db.commit()
    return None

