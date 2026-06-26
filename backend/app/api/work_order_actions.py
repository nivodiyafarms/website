"""
Work-order lifecycle actions: assign, submit-completion, close, reopen.
Separate router at /api/work-orders/{id}/... so no task_id needed in URL.
"""
import uuid as _uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.security import get_current_user
from app.database import get_db
from app.models.user import User
from app.models.worker import Worker
from app.models.work_order import WorkOrder, WorkOrderStatus
from app.schemas.work_order import WorkOrderResponse

router = APIRouter(prefix="/api/work-orders", tags=["work-order-actions"])


# ── Request schemas ────────────────────────────────────────────────────────────

class AssignRequest(BaseModel):
    worker_id: str  # UUID string of the worker to assign


class CompletionRequest(BaseModel):
    notes: Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_wo(db: Session, work_order_id: str) -> WorkOrder:
    try:
        uid = _uuid.UUID(work_order_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Work order not found")
    wo = db.query(WorkOrder).filter(WorkOrder.work_order_id == uid).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    return wo


def _to_resp(wo: WorkOrder) -> WorkOrderResponse:
    return WorkOrderResponse(
        work_order_id=wo.work_order_id,
        work_order_number=wo.work_order_number,
        task_id=wo.task_id,
        short_description=wo.short_description,
        description=wo.description,
        assigned_to=wo.assigned_to,
        created_by=wo.created_by,
        status=wo.status,
        due_date=wo.due_date,
        created_at=wo.created_at,
        updated_at=wo.updated_at,
        closed_at=wo.closed_at,
    )


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.patch("/{work_order_id}/assign", response_model=WorkOrderResponse)
def assign_worker(
    work_order_id: str,
    body: AssignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Assign an active worker to a work order."""
    wo = _get_wo(db, work_order_id)

    try:
        w_uid = _uuid.UUID(body.worker_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="worker_id is not a valid UUID")

    worker = db.query(Worker).filter(Worker.worker_id == w_uid).first()
    if not worker:
        raise HTTPException(status_code=404, detail="कर्मचारी नहीं मिला")
    if not worker.active:
        raise HTTPException(status_code=400, detail="यह कर्मचारी निष्क्रिय है — किसी सक्रिय कर्मचारी को सौंपो")

    wo.assigned_to = w_uid
    db.commit()
    db.refresh(wo)
    return _to_resp(wo)


@router.patch("/{work_order_id}/submit-completion", response_model=WorkOrderResponse)
def submit_completion(
    work_order_id: str,
    body: CompletionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Worker marks WO done → status moves to pending_review. Cannot close."""
    wo = _get_wo(db, work_order_id)

    if wo.status in (WorkOrderStatus.CLOSED, WorkOrderStatus.CANCELLED):
        raise HTTPException(
            status_code=400,
            detail="बंद या रद्द काम को दोबारा सबमिट नहीं किया जा सकता"
        )

    wo.status = WorkOrderStatus.PENDING_REVIEW
    db.commit()
    db.refresh(wo)
    return _to_resp(wo)


@router.patch("/{work_order_id}/close", response_model=WorkOrderResponse)
def close_work_order(
    work_order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Supervisor closes a pending_review WO."""
    wo = _get_wo(db, work_order_id)

    if wo.status != WorkOrderStatus.PENDING_REVIEW:
        raise HTTPException(
            status_code=400,
            detail="केवल 'समीक्षा बाकी' काम को बंद किया जा सकता है"
        )

    wo.status = WorkOrderStatus.CLOSED
    wo.closed_at = datetime.utcnow()
    db.commit()
    db.refresh(wo)
    return _to_resp(wo)


@router.patch("/{work_order_id}/reopen", response_model=WorkOrderResponse)
def reopen_work_order(
    work_order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Supervisor sends a pending_review WO back to open for rework."""
    wo = _get_wo(db, work_order_id)

    if wo.status != WorkOrderStatus.PENDING_REVIEW:
        raise HTTPException(
            status_code=400,
            detail="केवल 'समीक्षा बाकी' काम को वापस भेजा जा सकता है"
        )

    wo.status = WorkOrderStatus.OPEN
    db.commit()
    db.refresh(wo)
    return _to_resp(wo)


@router.get("/{work_order_id}/assigned-worker")
def get_assigned_worker(
    work_order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the name of the assigned worker (if any)."""
    wo = _get_wo(db, work_order_id)
    if not wo.assigned_to:
        return {"assigned": False, "worker": None}
    worker = db.query(Worker).filter(Worker.worker_id == wo.assigned_to).first()
    if not worker:
        return {"assigned": False, "worker": None}
    return {
        "assigned": True,
        "worker": {
            "worker_id": str(worker.worker_id),
            "name": worker.name,
            "role": worker.role.value if hasattr(worker.role, "value") else str(worker.role),
            "active": worker.active,
        }
    }
