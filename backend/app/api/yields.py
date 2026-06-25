from datetime import date as DateType
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from app.auth.security import get_current_user
from app.database import get_db
from app.models.crop_cycle import CropCycle
from app.models.crop_cycle_field import CropCycleField
from app.models.field import Field
from app.models.user import User
from app.models.yield_record import YieldRecord

router = APIRouter(tags=["yields"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class _YieldFields(BaseModel):
    harvest_date: DateType
    quantity: float
    unit: str
    field_id: Optional[str] = None
    quality_grade: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("quantity")
    @classmethod
    def qty_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("मात्रा 0 से ज़्यादा होनी चाहिए")
        return v


class YieldCreate(_YieldFields):
    crop_cycle_id: UUID


class YieldUpdate(_YieldFields):
    """Full replacement — all editable fields required. crop_cycle_id cannot change."""
    pass


class YieldResponse(BaseModel):
    yield_id: str
    crop_cycle_id: str
    harvest_date: str
    quantity: float
    unit: str
    field_id: Optional[str]
    quality_grade: Optional[str]
    notes: Optional[str]
    created_at: Optional[str]


class CycleFieldItem(BaseModel):
    field_id: str
    name: Optional[str]
    allocated_acres: Optional[float]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _to_resp(y: YieldRecord) -> YieldResponse:
    return YieldResponse(
        yield_id=str(y.yield_id),
        crop_cycle_id=str(y.crop_cycle_id),
        harvest_date=str(y.harvest_date),
        quantity=float(y.quantity),
        unit=y.unit,
        field_id=y.field_id,
        quality_grade=y.quality_grade,
        notes=y.notes,
        created_at=y.created_at.isoformat() if y.created_at else None,
    )


def _get_cycle_or_404(db: Session, crop_cycle_id: UUID) -> CropCycle:
    cc = db.get(CropCycle, crop_cycle_id)
    if not cc:
        raise HTTPException(status_code=404, detail="Crop cycle not found")
    return cc


def _validate_field(db: Session, crop_cycle_id: UUID, field_id: str) -> None:
    """Ensure field_id belongs to this cycle's junction rows."""
    row = (
        db.query(CropCycleField)
        .filter(
            CropCycleField.crop_cycle_id == crop_cycle_id,
            CropCycleField.field_id == field_id,
        )
        .first()
    )
    if not row:
        raise HTTPException(
            status_code=400,
            detail=f"खेत '{field_id}' इस फसल चक्र से जुड़ा नहीं है"
        )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/api/crop-cycles/{crop_cycle_id}/fields", response_model=List[CycleFieldItem])
def cycle_fields(
    crop_cycle_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return fields attached to this cycle (for the yield-form field picker)."""
    _get_cycle_or_404(db, crop_cycle_id)
    rows = (
        db.query(CropCycleField, Field)
        .join(Field, Field.field_id == CropCycleField.field_id)
        .filter(CropCycleField.crop_cycle_id == crop_cycle_id)
        .all()
    )
    return [
        CycleFieldItem(
            field_id=ccf.field_id,
            name=f.name,
            allocated_acres=float(ccf.allocated_acres) if ccf.allocated_acres else None,
        )
        for ccf, f in rows
    ]


@router.get("/api/yields", response_model=List[YieldResponse])
def list_yields(
    crop_cycle_id: UUID = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(YieldRecord)
        .filter(YieldRecord.crop_cycle_id == crop_cycle_id)
        .order_by(YieldRecord.harvest_date.desc())
        .all()
    )
    return [_to_resp(r) for r in rows]


@router.post("/api/yields", response_model=YieldResponse, status_code=201)
def create_yield(
    body: YieldCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_cycle_or_404(db, body.crop_cycle_id)
    if body.field_id:
        _validate_field(db, body.crop_cycle_id, body.field_id)

    record = YieldRecord(
        crop_cycle_id=body.crop_cycle_id,
        harvest_date=body.harvest_date,
        quantity=body.quantity,
        unit=body.unit,
        field_id=body.field_id or None,
        quality_grade=body.quality_grade or None,
        notes=body.notes or None,
        # TODO(auth): set created_by from current_user once auth wired (Slice 6)
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return _to_resp(record)


@router.put("/api/yields/{yield_id}", response_model=YieldResponse)
def update_yield(
    yield_id: UUID,
    body: YieldUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.get(YieldRecord, yield_id)
    if not record:
        raise HTTPException(status_code=404, detail="पैदावार नहीं मिली")

    if body.field_id:
        _validate_field(db, record.crop_cycle_id, body.field_id)

    record.harvest_date = body.harvest_date
    record.quantity = body.quantity
    record.unit = body.unit
    record.field_id = body.field_id or None
    record.quality_grade = body.quality_grade or None
    record.notes = body.notes or None
    db.commit()
    db.refresh(record)
    return _to_resp(record)


@router.delete("/api/yields/{yield_id}", status_code=204)
def delete_yield(
    yield_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.get(YieldRecord, yield_id)
    if not record:
        raise HTTPException(status_code=404, detail="पैदावार नहीं मिली")
    db.delete(record)
    db.commit()
