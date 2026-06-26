# backend/app/routes/work_order.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db
from app.auth.security import get_current_user
from app.models.task import Task
from app.models.work_order import WorkOrder, WorkOrderStatus
from app.models.user import User
from app.schemas.work_order import WorkOrderCreate, WorkOrderUpdate, WorkOrderResponse
from app.utils.id_generator import generate_work_order_id

router = APIRouter(
    prefix="/api/tasks/{task_id}/work-orders",
    tags=["Work Orders"]
)


# -----------------------------
# Create Work Order
# -----------------------------
@router.post("/", response_model=WorkOrderResponse, status_code=status.HTTP_201_CREATED)
def create_work_order(
    task_id: UUID,
    payload: WorkOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.task_id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Generate work order number before creating
    work_order_number = generate_work_order_id(db)

    work_order = WorkOrder(
        task_id=task_id,
        work_order_number=work_order_number,
        short_description=payload.short_description,
        description=payload.description,
        assigned_to=None,  # assignment handled via /assign endpoint; ignore whatever frontend sends
        due_date=payload.due_date,
        created_by=current_user.user_id,
        status=WorkOrderStatus.OPEN,
    )

    db.add(work_order)
    db.commit()
    db.refresh(work_order)

    return work_order


# -----------------------------
# Update Work Order
# -----------------------------
@router.patch("/{work_order_id}", response_model=WorkOrderResponse)
def update_work_order(
    task_id: UUID,
    work_order_id: UUID,
    payload: WorkOrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    work_order = (
        db.query(WorkOrder)
        .filter(
            WorkOrder.task_id == task_id,
            WorkOrder.work_order_id == work_order_id,
        )
        .first()
    )
    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found")

    update_data = payload.model_dump(exclude_unset=True)
    update_data.pop('assigned_to', None)  # assignment handled via /assign endpoint only
    for field, value in update_data.items():
        setattr(work_order, field, value)

    db.commit()
    db.refresh(work_order)
    return work_order


# -----------------------------
# Get Work Orders for Task
# -----------------------------
@router.get("/", response_model=list[WorkOrderResponse])
def get_work_orders(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(WorkOrder)
        .filter(WorkOrder.task_id == task_id)
        .order_by(WorkOrder.created_at.desc())
        .all()
    )
