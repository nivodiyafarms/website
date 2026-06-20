# backend/app/api/pnl.py
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth.security import get_current_user
from app.database import get_db
from app.models.crop_cycle import CropCycle
from app.models.prep_cost_allocation import PrepCostAllocation
from app.models.sale import Sale
from app.models.task import Task
from app.models.user import User
from app.models.work_order import WorkOrder
from app.models.work_order_resource import WorkOrderResource

router = APIRouter(prefix="/api/crop-cycles", tags=["pnl"])


def _compute_pnl(crop_cycle_id: UUID, db: Session) -> dict:
    """
    Derive P&L for one crop cycle. All numbers from DB, nothing cached.

    revenue        = SUM(sales.total_amount)
    crop_cost      = SUM(work_order_resources.cost) via resources→WO→task where
                     task.crop_cycle_id = this cycle.  Source of truth, not rollup.
    prep_allocated = SUM(prep_cost_allocation.amount) pointing at this cycle.
    total_cost     = crop_cost + prep_allocated
    profit         = revenue − total_cost
    """
    # Revenue
    revenue_row = db.execute(
        select(func.coalesce(func.sum(Sale.total_amount), 0))
        .where(Sale.crop_cycle_id == crop_cycle_id)
    ).scalar()
    revenue = float(revenue_row)

    sales_count_row = db.execute(
        select(func.count()).select_from(Sale).where(Sale.crop_cycle_id == crop_cycle_id)
    ).scalar()
    sales_count = int(sales_count_row)

    # Crop cost — join resources → work_orders → tasks
    # Do NOT use tasks.total_expense; derive from the resource rows directly.
    crop_cost_row = db.execute(
        select(func.coalesce(func.sum(WorkOrderResource.cost), 0))
        .join(WorkOrder, WorkOrderResource.work_order_id == WorkOrder.work_order_id)
        .join(Task, WorkOrder.task_id == Task.task_id)
        .where(Task.crop_cycle_id == crop_cycle_id)
    ).scalar()
    crop_cost = float(crop_cost_row)

    resource_lines_row = db.execute(
        select(func.count())
        .select_from(WorkOrderResource)
        .join(WorkOrder, WorkOrderResource.work_order_id == WorkOrder.work_order_id)
        .join(Task, WorkOrder.task_id == Task.task_id)
        .where(Task.crop_cycle_id == crop_cycle_id)
    ).scalar()
    resource_cost_lines_count = int(resource_lines_row)

    # Prep-overhead allocated to this cycle
    prep_row = db.execute(
        select(func.coalesce(func.sum(PrepCostAllocation.amount), 0))
        .where(PrepCostAllocation.crop_cycle_id == crop_cycle_id)
    ).scalar()
    prep_allocated = float(prep_row)

    total_cost = crop_cost + prep_allocated
    profit = revenue - total_cost

    return {
        "revenue": revenue,
        "crop_cost": crop_cost,
        "prep_allocated": prep_allocated,
        "total_cost": total_cost,
        "profit": profit,
        "sales_count": sales_count,
        "resource_cost_lines_count": resource_cost_lines_count,
    }


@router.get("/{crop_cycle_id}/pnl")
def get_crop_cycle_pnl(
    crop_cycle_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Derive P&L for one crop cycle. Never reads cached rollup columns.
    Zero sales → revenue 0, profit negative (cost incurred, nothing sold yet).
    seed_category (variety) is returned as-is — never auto-translated.
    """
    cc = db.get(CropCycle, crop_cycle_id)
    if not cc:
        raise HTTPException(status_code=404, detail="Crop cycle not found")

    numbers = _compute_pnl(crop_cycle_id, db)

    return {
        "crop_cycle_id": str(crop_cycle_id),
        "incident_no": cc.incident_no,
        "crop_name": cc.crop_name,
        "seed_category": cc.seed_category,   # variety — never translated
        "season": cc.season,
        **numbers,
    }
