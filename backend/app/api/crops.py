from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.crop_catalog import CropCatalog
from app.models.user import User
from app.schemas.crop_catalog import CropCatalogResponse
from app.auth.security import get_current_user

router = APIRouter(prefix="/api/crops", tags=["crops"])


@router.get("/", response_model=List[CropCatalogResponse])
def get_crops(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    crops = db.query(CropCatalog).all()
    return crops

