from datetime import date as DateType
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, field_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.security import get_current_user
from app.database import get_db
from app.models.crop_cycle import CropCycle
from app.models.sale import Sale, SaleChannel
from app.models.user import User

router = APIRouter(tags=["sales"])


# ── Shared field validators (used by both Create and Update) ──────────────────
class _SaleFields(BaseModel):
    sale_date: DateType
    quantity: float
    unit: str
    rate: float
    buyer: Optional[str] = None
    channel: SaleChannel
    notes: Optional[str] = None

    @field_validator("quantity")
    @classmethod
    def qty_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("मात्रा 0 से ज़्यादा होनी चाहिए")
        return v

    @field_validator("rate")
    @classmethod
    def rate_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("भाव 0 से ज़्यादा होना चाहिए")
        return v


class SaleCreate(_SaleFields):
    crop_cycle_id: UUID


class SaleUpdate(_SaleFields):
    """Full replacement — all editable fields required. crop_cycle_id cannot change."""
    pass


class SaleResponse(BaseModel):
    sale_id: str
    crop_cycle_id: str
    sale_date: str
    quantity: float
    unit: str
    rate: float
    total_amount: float
    buyer: Optional[str]
    channel: str
    notes: Optional[str]
    created_at: Optional[str]


def _to_resp(s: Sale) -> SaleResponse:
    ch = s.channel.value if hasattr(s.channel, "value") else str(s.channel)
    return SaleResponse(
        sale_id=str(s.sale_id),
        crop_cycle_id=str(s.crop_cycle_id),
        sale_date=str(s.sale_date),
        quantity=float(s.quantity),
        unit=s.unit,
        rate=float(s.rate),
        total_amount=float(s.total_amount),
        buyer=s.buyer,
        channel=ch,
        notes=s.notes,
        created_at=s.created_at.isoformat() if s.created_at else None,
    )


def _check_total(quantity: float, rate: float) -> float:
    total = quantity * rate
    if total <= 0:
        raise HTTPException(status_code=400, detail="कुल रकम 0 से ज़्यादा होनी चाहिए")
    return total


@router.get("/api/sales", response_model=List[SaleResponse])
def list_sales(
    crop_cycle_id: UUID = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(Sale)
        .filter(Sale.crop_cycle_id == crop_cycle_id)
        .order_by(Sale.sale_date.desc())
        .all()
    )
    return [_to_resp(s) for s in rows]


@router.post("/api/sales", response_model=SaleResponse, status_code=201)
def create_sale(
    body: SaleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cc = db.get(CropCycle, body.crop_cycle_id)
    if not cc:
        raise HTTPException(status_code=404, detail="Crop cycle not found")

    total = _check_total(body.quantity, body.rate)
    sale = Sale(
        crop_cycle_id=body.crop_cycle_id,
        sale_date=body.sale_date,
        quantity=body.quantity,
        unit=body.unit,
        rate=body.rate,
        total_amount=total,
        buyer=body.buyer or None,
        channel=body.channel,
        notes=body.notes or None,
        created_by=None,  # TODO(auth): set from current_user.user_id once auth wired
    )
    db.add(sale)
    db.commit()
    db.refresh(sale)
    return _to_resp(sale)


@router.put("/api/sales/{sale_id}", response_model=SaleResponse)
def update_sale(
    sale_id: UUID,
    body: SaleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sale = db.get(Sale, sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="बिक्री नहीं मिली")

    total = _check_total(body.quantity, body.rate)
    sale.sale_date    = body.sale_date
    sale.quantity     = body.quantity
    sale.unit         = body.unit
    sale.rate         = body.rate
    sale.total_amount = total
    sale.buyer        = body.buyer or None
    sale.channel      = body.channel
    sale.notes        = body.notes or None
    db.commit()
    db.refresh(sale)
    return _to_resp(sale)


@router.delete("/api/sales/{sale_id}", status_code=204)
def delete_sale(
    sale_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sale = db.get(Sale, sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="बिक्री नहीं मिली")
    db.delete(sale)
    db.commit()


@router.get("/api/buyers/recent")
def recent_buyers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Distinct non-null buyers ordered by most recent sale date, up to 10."""
    rows = db.execute(
        select(Sale.buyer, Sale.sale_date)
        .where(Sale.buyer.isnot(None))
        .where(Sale.buyer != "")
        .order_by(Sale.sale_date.desc())
    ).all()
    seen: list[str] = []
    for (buyer, _) in rows:
        if buyer and buyer not in seen:
            seen.append(buyer)
        if len(seen) >= 10:
            break
    return {"buyers": seen}
