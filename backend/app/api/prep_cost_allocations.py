# backend/app/api/prep_cost_allocations.py
"""
Prep-cost allocation endpoints.

Over-allocation guarantee (CLAUDE.md: "no over-allocation, no double-count"):
  - Only field-prep WOs (task.crop_cycle_id IS NULL, task.field_id SET) can be allocated.
    Allocating a crop-task WO would double-count that cost.
  - SUM(amount) for a WO must never exceed the WO's total resource cost.
  - Enforced with a row lock on the work_order so concurrent POSTs cannot both pass
    the sum check and over-allocate.

No DB CHECK enforces this (aggregates can't be checked per-row in PG) — this service
layer is the only guard.
"""
from decimal import Decimal
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, field_validator
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.auth.security import get_current_user
from app.database import get_db
from app.models.crop_cycle import CropCycle
from app.models.prep_cost_allocation import PrepCostAllocation
from app.models.task import Task
from app.models.user import User
from app.models.work_order import WorkOrder
from app.models.work_order_resource import WorkOrderResource

router = APIRouter(prefix="/api", tags=["prep-cost-allocations"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class PrepCostAllocationCreate(BaseModel):
    work_order_id: UUID
    crop_cycle_id: UUID
    amount: Decimal

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("amount must be > 0")
        return v


class PrepCostAllocationOut(BaseModel):
    id: UUID
    work_order_id: UUID
    crop_cycle_id: UUID
    amount: Optional[Decimal]
    # Human-readable helpers
    work_order_number: Optional[str] = None
    crop_cycle_incident_no: Optional[str] = None

    model_config = {"from_attributes": True}


class PrepAllocationSummary(BaseModel):
    work_order_id: UUID
    work_order_number: Optional[str]
    wo_cost: Decimal
    allocated_total: Decimal
    unallocated_remainder: Decimal
    allocations: list[PrepCostAllocationOut]


# ── Helpers ────────────────────────────────────────────────────────────────────

def _get_wo_or_404(work_order_id: UUID, db: Session) -> WorkOrder:
    wo = db.get(WorkOrder, work_order_id)
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    return wo


def _assert_prep_wo(wo: WorkOrder, db: Session) -> Task:
    """Verify the WO belongs to a field-prep task (crop_cycle_id IS NULL, field_id set).
    Raises 400 if it belongs to a crop task — allocating that would double-count."""
    if wo.task_id is None:
        raise HTTPException(
            status_code=400,
            detail={
                "reason": "work_order_not_linked_to_task",
                "message": (
                    f"Work order {wo.work_order_number} is not linked to any task "
                    "and cannot be allocated as a prep cost."
                ),
            },
        )
    task = db.get(Task, wo.task_id)
    if task is None:
        raise HTTPException(status_code=400, detail="Work order's task not found")

    if task.crop_cycle_id is not None:
        raise HTTPException(
            status_code=400,
            detail={
                "reason": "crop_task_wo_not_allocatable",
                "message": (
                    f"Work order {wo.work_order_number} belongs to task "
                    f"{task.task_number} which is already attributed to a crop cycle. "
                    "Allocating it as prep cost would double-count the expense."
                ),
            },
        )
    if task.field_id is None:
        raise HTTPException(
            status_code=400,
            detail={
                "reason": "prep_task_missing_field",
                "message": (
                    f"Task {task.task_number} has no field_id set. "
                    "A prep task must be tagged to a field."
                ),
            },
        )
    return task


def _wo_resource_total(work_order_id: UUID, db: Session) -> Decimal:
    row = db.execute(
        select(func.coalesce(func.sum(WorkOrderResource.cost), 0))
        .where(WorkOrderResource.work_order_id == work_order_id)
    ).scalar()
    return Decimal(str(row))


def _existing_allocated(work_order_id: UUID, db: Session) -> Decimal:
    row = db.execute(
        select(func.coalesce(func.sum(PrepCostAllocation.amount), 0))
        .where(PrepCostAllocation.work_order_id == work_order_id)
    ).scalar()
    return Decimal(str(row))


def _enrich(alloc: PrepCostAllocation, db: Session) -> dict:
    wo = db.get(WorkOrder, alloc.work_order_id)
    cc = db.get(CropCycle, alloc.crop_cycle_id)
    return {
        "id": alloc.id,
        "work_order_id": alloc.work_order_id,
        "crop_cycle_id": alloc.crop_cycle_id,
        "amount": alloc.amount,
        "work_order_number": wo.work_order_number if wo else None,
        "crop_cycle_incident_no": cc.incident_no if cc else None,
    }


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/prep-cost-allocations", status_code=201)
def create_prep_cost_allocation(
    body: PrepCostAllocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Allocate part of a field-prep WO's cost to a crop cycle.

    Enforcement (application-level, no DB aggregate CHECK possible):
      1. WO must be a prep task (crop_cycle_id IS NULL, field_id set).
      2. SUM(existing allocations) + new_amount must not exceed WO resource cost.

    Concurrent-safe: locks the work_order row (SELECT FOR UPDATE) before summing,
    so two simultaneous POSTs can't both pass the check and over-allocate.
    """
    # Lock the work_order row for this transaction to prevent concurrent over-allocation.
    locked_wo = db.execute(
        select(WorkOrder)
        .where(WorkOrder.work_order_id == body.work_order_id)
        .with_for_update()
    ).scalar_one_or_none()

    if locked_wo is None:
        raise HTTPException(status_code=404, detail="Work order not found")

    _assert_prep_wo(locked_wo, db)

    if not db.get(CropCycle, body.crop_cycle_id):
        raise HTTPException(status_code=404, detail="Crop cycle not found")

    wo_cost = _wo_resource_total(body.work_order_id, db)
    already_allocated = _existing_allocated(body.work_order_id, db)
    would_total = already_allocated + body.amount

    if would_total > wo_cost:
        raise HTTPException(
            status_code=400,
            detail={
                "reason": "over_allocation",
                "wo_cost": float(wo_cost),
                "already_allocated": float(already_allocated),
                "attempted": float(body.amount),
                "would_exceed_by": float(would_total - wo_cost),
                "message": (
                    f"Allocation of ₹{body.amount} would exceed the work order's "
                    f"total resource cost (₹{wo_cost}). "
                    f"Already allocated: ₹{already_allocated}. "
                    f"Maximum remaining: ₹{wo_cost - already_allocated}."
                ),
            },
        )

    alloc = PrepCostAllocation(
        work_order_id=body.work_order_id,
        crop_cycle_id=body.crop_cycle_id,
        amount=body.amount,
    )
    db.add(alloc)
    db.commit()
    db.refresh(alloc)
    return _enrich(alloc, db)


@router.get("/prep-cost-allocations")
def list_prep_cost_allocations(
    work_order_id: UUID = Query(..., description="Filter by prep work order"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all allocations for a given prep work order."""
    _get_wo_or_404(work_order_id, db)
    allocs = (
        db.query(PrepCostAllocation)
        .filter(PrepCostAllocation.work_order_id == work_order_id)
        .order_by(PrepCostAllocation.created_at)
        .all()
    )
    return [_enrich(a, db) for a in allocs]


@router.get("/work-orders/{work_order_id}/prep-allocation-summary")
def prep_allocation_summary(
    work_order_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Summary for a prep WO: total resource cost, how much is allocated,
    how much remains unattributed.
    """
    wo = _get_wo_or_404(work_order_id, db)
    _assert_prep_wo(wo, db)

    wo_cost = _wo_resource_total(work_order_id, db)
    allocated_total = _existing_allocated(work_order_id, db)
    remainder = wo_cost - allocated_total

    allocs = (
        db.query(PrepCostAllocation)
        .filter(PrepCostAllocation.work_order_id == work_order_id)
        .order_by(PrepCostAllocation.created_at)
        .all()
    )

    return {
        "work_order_id": str(work_order_id),
        "work_order_number": wo.work_order_number,
        "wo_cost": float(wo_cost),
        "allocated_total": float(allocated_total),
        "unallocated_remainder": float(remainder),
        "allocations": [_enrich(a, db) for a in allocs],
    }


@router.delete("/prep-cost-allocations/{allocation_id}", status_code=200)
def delete_prep_cost_allocation(
    allocation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove an allocation (un-attribute prep cost from a cycle)."""
    alloc = db.get(PrepCostAllocation, allocation_id)
    if not alloc:
        raise HTTPException(status_code=404, detail="Allocation not found")

    wo = db.get(WorkOrder, alloc.work_order_id)
    wo_number = wo.work_order_number if wo else str(alloc.work_order_id)
    cc = db.get(CropCycle, alloc.crop_cycle_id)
    cc_no = cc.incident_no if cc else str(alloc.crop_cycle_id)

    db.delete(alloc)
    db.commit()
    return {
        "success": True,
        "message": f"Removed ₹{alloc.amount} allocation from {wo_number} → {cc_no}",
    }
