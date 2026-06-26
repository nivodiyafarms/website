import re
import uuid as _uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from app.auth.security import get_current_user
from app.database import get_db
from app.models.user import User
from app.models.worker import Worker, WorkerRole

router = APIRouter(prefix="/api/workers", tags=["workers"])

# E.164: +[country-code][number], 8–16 chars total, no leading zero after +
_E164 = re.compile(r'^\+[1-9]\d{6,14}$')


# ── Schemas ────────────────────────────────────────────────────────────────────

class WorkerCreate(BaseModel):
    name: str
    whatsapp_number: Optional[str] = None
    role: str

    @field_validator("name")
    @classmethod
    def name_required(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("नाम ज़रूरी है")
        return v.strip()

    @field_validator("whatsapp_number")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if not v or not v.strip():
            return None
        cleaned = v.strip()
        if not _E164.match(cleaned):
            raise ValueError("नंबर E.164 फ़ॉर्मैट में होना चाहिए (जैसे +919876543210 या +12025551234)")
        return cleaned

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        try:
            WorkerRole(v)
        except ValueError:
            raise ValueError("भूमिका worker / supervisor / owner में से एक होनी चाहिए")
        return v


class WorkerUpdate(BaseModel):
    name: Optional[str] = None
    whatsapp_number: Optional[str] = None
    role: Optional[str] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("नाम ज़रूरी है")
        return v.strip() if v else v

    @field_validator("whatsapp_number")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if not v or not v.strip():
            return None
        cleaned = v.strip()
        if not _E164.match(cleaned):
            raise ValueError("नंबर E.164 फ़ॉर्मैट में होना चाहिए (जैसे +919876543210 या +12025551234)")
        return cleaned

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        try:
            WorkerRole(v)
        except ValueError:
            raise ValueError("भूमिका worker / supervisor / owner में से एक होनी चाहिए")
        return v


class WorkerResponse(BaseModel):
    worker_id: str
    name: str
    whatsapp_number: Optional[str] = None
    role: str
    active: bool
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── Helpers ────────────────────────────────────────────────────────────────────

def _to_resp(w: Worker) -> WorkerResponse:
    return WorkerResponse(
        worker_id=str(w.worker_id),
        name=w.name,
        whatsapp_number=w.whatsapp_number,
        role=w.role.value if hasattr(w.role, "value") else str(w.role),
        active=w.active,
        created_at=w.created_at,
    )


def _get_or_404(db: Session, worker_id: str) -> Worker:
    try:
        uid = _uuid.UUID(worker_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="कर्मचारी नहीं मिला")
    w = db.query(Worker).filter(Worker.worker_id == uid).first()
    if not w:
        raise HTTPException(status_code=404, detail="कर्मचारी नहीं मिला")
    return w


def _check_duplicate_phone(db: Session, phone: str, exclude_id: Optional[_uuid.UUID] = None):
    q = db.query(Worker).filter(Worker.whatsapp_number == phone)
    if exclude_id:
        q = q.filter(Worker.worker_id != exclude_id)
    if q.first():
        raise HTTPException(status_code=400, detail="यह WhatsApp नंबर पहले से दर्ज है")


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[WorkerResponse])
def list_workers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workers = db.query(Worker).order_by(Worker.active.desc(), Worker.name).all()
    return [_to_resp(w) for w in workers]


@router.post("/", response_model=WorkerResponse, status_code=201)
def create_worker(
    body: WorkerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.whatsapp_number:
        _check_duplicate_phone(db, body.whatsapp_number)

    w = Worker(
        worker_id=_uuid.uuid4(),
        name=body.name,
        whatsapp_number=body.whatsapp_number,
        role=WorkerRole(body.role),
        active=True,
    )
    db.add(w)
    db.commit()
    db.refresh(w)
    return _to_resp(w)


@router.put("/{worker_id}", response_model=WorkerResponse)
def update_worker(
    worker_id: str,
    body: WorkerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    w = _get_or_404(db, worker_id)

    if body.whatsapp_number:
        _check_duplicate_phone(db, body.whatsapp_number, exclude_id=w.worker_id)

    if body.name is not None:
        w.name = body.name
    if body.whatsapp_number is not None:
        w.whatsapp_number = body.whatsapp_number
    if body.role is not None:
        w.role = WorkerRole(body.role)

    db.commit()
    db.refresh(w)
    return _to_resp(w)


@router.patch("/{worker_id}/deactivate", response_model=WorkerResponse)
def deactivate_worker(
    worker_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    w = _get_or_404(db, worker_id)
    w.active = False
    db.commit()
    db.refresh(w)
    return _to_resp(w)


@router.patch("/{worker_id}/activate", response_model=WorkerResponse)
def activate_worker(
    worker_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    w = _get_or_404(db, worker_id)
    w.active = True
    db.commit()
    db.refresh(w)
    return _to_resp(w)
