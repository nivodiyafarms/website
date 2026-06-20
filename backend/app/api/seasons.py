# backend/app/api/seasons.py
"""
Season-summary endpoints.

Feeds the Crops tab landing view and the future WhatsApp season query (#3).

TODO(auth-slice-6): Both endpoints expose financial data. Gate to
supervisor/owner role once the role-check dependency is wired.
"""
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth.security import get_current_user
from app.database import get_db
from app.models.crop_cycle import CropCycle
from app.models.crop_cycle_field import CropCycleField
from app.models.prep_cost_allocation import PrepCostAllocation
from app.models.sale import Sale
from app.models.task import Task
from app.models.user import User
from app.models.work_order import WorkOrder
from app.models.work_order_resource import WorkOrderResource
from app.api.pnl import _compute_pnl

router = APIRouter(prefix="/api/seasons", tags=["seasons"])

# Agricultural ordering within a crop_year: kharif → rabi → zaid
_SEASON_ORDER: dict[str, int] = {"kharif": 1, "rabi": 2, "zaid": 3}


def _season_label(season: str, crop_year: int) -> str:
    return f"{season.capitalize()} {crop_year}"


# ── GET /api/seasons/summary ───────────────────────────────────────────────────

@router.get("/summary")
def list_seasons(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[dict]:
    """
    Distinct (season, crop_year) pairs that have cycles, with cycle count.
    Ordered: crop_year desc, then kharif → rabi → zaid within a year.
    """
    rows = db.execute(
        select(
            CropCycle.season,
            CropCycle.crop_year,
            func.count().label("cycle_count"),
        )
        .where(CropCycle.crop_year.is_not(None))
        .group_by(CropCycle.season, CropCycle.crop_year)
    ).all()

    sorted_rows = sorted(
        rows,
        key=lambda r: (-r.crop_year, _SEASON_ORDER.get(r.season, 99)),
    )

    return [
        {
            "season": r.season,
            "crop_year": r.crop_year,
            "label": _season_label(r.season, r.crop_year),
            "cycle_count": r.cycle_count,
        }
        for r in sorted_rows
    ]


# ── GET /api/seasons/{season}/{crop_year}/summary ─────────────────────────────

@router.get("/{season}/{crop_year}/summary")
def season_summary(
    season: str,
    crop_year: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """
    Full season breakdown: crops → cycles, each cycle with live P&L.
    seed_category (variety) is never auto-translated.

    P&L per cycle: live derivation from work_order_resources + prep_cost_allocation.
    Never reads cached rollup columns.

    prep_overhead: prep tasks tagged to this season (prep_season + prep_crop_year).
    All zeros until prep tasks are tagged via the UI — that is expected.

    Bulk queries (one per metric) rather than N+1 per cycle.
    """
    season = season.lower()

    cycles = (
        db.query(CropCycle)
        .filter(CropCycle.season == season, CropCycle.crop_year == crop_year)
        .order_by(CropCycle.crop_name, CropCycle.incident_no)
        .all()
    )

    if not cycles:
        raise HTTPException(
            status_code=404,
            detail=f"No crop cycles found for {_season_label(season, crop_year)}",
        )

    cycle_ids = [cc.id for cc in cycles]

    # ── Bulk: revenue per cycle ────────────────────────────────────────────────
    revenue_map: dict = {
        str(cid): float(v)
        for cid, v in db.execute(
            select(Sale.crop_cycle_id, func.coalesce(func.sum(Sale.total_amount), 0))
            .where(Sale.crop_cycle_id.in_(cycle_ids))
            .group_by(Sale.crop_cycle_id)
        ).all()
    }

    # ── Bulk: crop cost per cycle (resources → WO → task) ─────────────────────
    # Source of truth — do NOT use tasks.total_expense cached rollup.
    crop_cost_map: dict = {
        str(cid): float(v)
        for cid, v in db.execute(
            select(
                Task.crop_cycle_id,
                func.coalesce(func.sum(WorkOrderResource.cost), 0),
            )
            .select_from(WorkOrderResource)
            .join(WorkOrder, WorkOrderResource.work_order_id == WorkOrder.work_order_id)
            .join(Task, WorkOrder.task_id == Task.task_id)
            .where(Task.crop_cycle_id.in_(cycle_ids))
            .group_by(Task.crop_cycle_id)
        ).all()
    }

    # ── Bulk: prep allocations pointing at each cycle ─────────────────────────
    prep_alloc_map: dict = {
        str(cid): float(v)
        for cid, v in db.execute(
            select(
                PrepCostAllocation.crop_cycle_id,
                func.coalesce(func.sum(PrepCostAllocation.amount), 0),
            )
            .where(PrepCostAllocation.crop_cycle_id.in_(cycle_ids))
            .group_by(PrepCostAllocation.crop_cycle_id)
        ).all()
    }

    # ── Bulk: allocated_acres per cycle (junction table sum) ──────────────────
    acres_map: dict = {
        str(cid): float(v)
        for cid, v in db.execute(
            select(
                CropCycleField.crop_cycle_id,
                func.coalesce(func.sum(CropCycleField.allocated_acres), 0),
            )
            .where(CropCycleField.crop_cycle_id.in_(cycle_ids))
            .group_by(CropCycleField.crop_cycle_id)
        ).all()
    }

    # ── Build crops → cycles tree ──────────────────────────────────────────────
    crops_index: dict[str, list] = {}
    for cc in cycles:
        cid = str(cc.id)
        revenue       = revenue_map.get(cid, 0.0)
        crop_cost     = crop_cost_map.get(cid, 0.0)
        prep_allocated = prep_alloc_map.get(cid, 0.0)
        total_cost    = crop_cost + prep_allocated
        profit        = revenue - total_cost

        cycle_entry = {
            "crop_cycle_id":      cid,
            "incident_no":        cc.incident_no,
            "seed_category":      cc.seed_category,   # variety — never translated
            "allocated_acres_total": acres_map.get(cid, 0.0),
            "revenue":            revenue,
            "crop_cost":          crop_cost,
            "prep_allocated":     prep_allocated,
            "total_cost":         total_cost,
            "profit":             profit,
        }

        crops_index.setdefault(cc.crop_name, []).append(cycle_entry)

    crops = [
        {"crop_name": name, "cycles": cycle_list}
        for name, cycle_list in sorted(crops_index.items())
    ]

    # ── Prep overhead for this season ──────────────────────────────────────────
    # Prep tasks tagged to this season: crop_cycle_id IS NULL,
    # prep_season = season, prep_crop_year = crop_year.
    # All zeros until prep tasks are tagged via the UI.
    total_prep_cost = float(
        db.execute(
            select(func.coalesce(func.sum(WorkOrderResource.cost), 0))
            .select_from(WorkOrderResource)
            .join(WorkOrder, WorkOrderResource.work_order_id == WorkOrder.work_order_id)
            .join(Task, WorkOrder.task_id == Task.task_id)
            .where(
                Task.crop_cycle_id.is_(None),
                Task.prep_season == season,
                Task.prep_crop_year == crop_year,
            )
        ).scalar()
    )

    total_allocated = float(
        db.execute(
            select(func.coalesce(func.sum(PrepCostAllocation.amount), 0))
            .select_from(PrepCostAllocation)
            .join(WorkOrder, PrepCostAllocation.work_order_id == WorkOrder.work_order_id)
            .join(Task, WorkOrder.task_id == Task.task_id)
            .where(
                Task.crop_cycle_id.is_(None),
                Task.prep_season == season,
                Task.prep_crop_year == crop_year,
            )
        ).scalar()
    )

    return {
        "season":    season,
        "crop_year": crop_year,
        "label":     _season_label(season, crop_year),
        "crops":     crops,
        "prep_overhead": {
            "total_prep_cost":       total_prep_cost,
            "total_allocated":       total_allocated,
            "unallocated_remainder": total_prep_cost - total_allocated,
        },
    }
