from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from uuid import UUID
from decimal import Decimal

from app.database import get_db
from app.auth.security import get_current_user
from app.models.work_order import WorkOrder
from app.models.work_order_resource import WorkOrderResource
from app.models.task import Task
from app.models.user import User
from app.schemas.work_order_resource import (
    WorkOrderResourceCreate,
    WorkOrderResourceUpdate,
    WorkOrderResourceResponse,
)

router = APIRouter(
    prefix="/api/work-orders",
    tags=["Work Order Resources"]
)


def recalculate_task_total_expense(db: Session, task_id: UUID) -> None:
    """Set task.total_expense to SUM(resource.cost) for all resources of the task's work orders."""
    total = (
        db.query(func.coalesce(func.sum(WorkOrderResource.cost), 0))
        .select_from(WorkOrderResource)
        .join(WorkOrder, WorkOrderResource.work_order_id == WorkOrder.work_order_id)
        .filter(WorkOrder.task_id == task_id)
        .scalar()
    )
    task = db.query(Task).filter(Task.task_id == task_id).first()
    if task:
        task.total_expense = total


@router.post("/{work_order_id}/resources",
             response_model=WorkOrderResourceResponse,
             status_code=status.HTTP_201_CREATED)
def add_resource(
    work_order_id: UUID,
    payload: WorkOrderResourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    wo = db.query(WorkOrder).filter(WorkOrder.work_order_id == work_order_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")

    # Financial safety: cost calculated server-side for financial integrity
    # If rate is provided, compute cost = qty * rate
    # If rate is None, use provided cost (for fixed costs without rate)
    if payload.rate is not None:
        computed_cost = Decimal(str(payload.qty)) * Decimal(str(payload.rate))
    else:
        if payload.cost is None:
            raise HTTPException(
                status_code=400,
                detail="Either 'rate' or 'cost' must be provided"
            )
        computed_cost = Decimal(str(payload.cost))

    res = WorkOrderResource(
        work_order_id=wo.work_order_id,
        resource_type=payload.resource_type,
        resource_type_custom=payload.resource_type_custom,
        name=payload.name,
        qty=payload.qty,
        unit=payload.unit,
        rate=payload.rate,
        cost=computed_cost  # Always use computed cost
    )

    db.add(res)
    db.flush()  # make new resource visible to SUM query in same transaction
    recalculate_task_total_expense(db, wo.task_id)
    db.commit()
    db.refresh(res)
    return res


@router.patch("/{work_order_id}/resources/{resource_id}",
              response_model=WorkOrderResourceResponse)
def update_resource(
    work_order_id: UUID,
    resource_id: UUID,
    payload: WorkOrderResourceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    res = (
        db.query(WorkOrderResource)
        .filter(
            WorkOrderResource.work_order_id == work_order_id,
            WorkOrderResource.work_order_resources_id == resource_id,
        )
        .first()
    )
    if not res:
        raise HTTPException(status_code=404, detail="Work order resource not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(res, field, value)
    # Recompute cost when rate and qty are present (financial integrity)
    if res.rate is not None and res.qty is not None:
        res.cost = Decimal(str(res.qty)) * Decimal(str(res.rate))

    wo = db.query(WorkOrder).filter(WorkOrder.work_order_id == work_order_id).first()
    if wo:
        recalculate_task_total_expense(db, wo.task_id)
    db.commit()
    db.refresh(res)
    return res


@router.delete("/{work_order_id}/resources/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resource(
    work_order_id: UUID,
    resource_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    res = (
        db.query(WorkOrderResource)
        .filter(
            WorkOrderResource.work_order_id == work_order_id,
            WorkOrderResource.work_order_resources_id == resource_id,
        )
        .first()
    )
    if not res:
        raise HTTPException(status_code=404, detail="Work order resource not found")
    wo = db.query(WorkOrder).filter(WorkOrder.work_order_id == work_order_id).first()
    task_id = wo.task_id if wo else None
    db.delete(res)
    if task_id:
        recalculate_task_total_expense(db, task_id)
    db.commit()
    return None


@router.get("/{work_order_id}/resources",
            response_model=List[WorkOrderResourceResponse])
def get_resources(
    work_order_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return (
        db.query(WorkOrderResource)
        .filter(WorkOrderResource.work_order_id == work_order_id)
        .order_by(WorkOrderResource.created_at.desc())
        .all()
    )
