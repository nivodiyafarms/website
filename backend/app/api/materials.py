from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.material import Material
from app.models.user import User
from app.schemas.material import MaterialCreate, MaterialResponse
from app.auth.security import get_current_user

router = APIRouter(prefix="/api/materials", tags=["materials"])


@router.get("/", response_model=List[MaterialResponse])
def get_materials(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    materials = db.query(Material).all()
    return materials


@router.post("/", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
def create_material(
    material: MaterialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_material = Material(**material.model_dump())
    db.add(db_material)
    db.commit()
    db.refresh(db_material)
    return db_material

