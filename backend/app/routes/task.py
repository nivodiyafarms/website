# backend/app/routes/task.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime

from app.database import get_db
from app.auth.security import get_current_user
from app.models.task import Task, TaskStatus
from app.models.crop_cycle import CropCycle
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.utils.id_generator import generate_task_id
from app.models.work_order import WorkOrder
from app.models.task_field import TaskField
from sqlalchemy.exc import IntegrityError

router = APIRouter(
    prefix="/api/crop-cycles/{crop_cycle_id}/tasks",
    tags=["Tasks"]
)


# -----------------------------
# Create Task
# -----------------------------
@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    crop_cycle_id: UUID,
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    crop_cycle = db.query(CropCycle).filter(CropCycle.id == crop_cycle_id).first()
    if not crop_cycle:
        raise HTTPException(status_code=404, detail="Crop cycle not found")

    # Step A: Auto-generate task_number (TSK0001, TSK0002, etc.)
    task_number = generate_task_id(db)

    # Resolve field list: prefer field_ids (multi); fall back to single field_id
    field_ids = payload.field_ids or ([payload.field_id] if payload.field_id else [])
    primary_field = field_ids[0] if field_ids else None

    task = Task(
        task_number=task_number,
        crop_cycle_id=crop_cycle_id,
        category=payload.category,
        subcategory=payload.subcategory,
        short_description=payload.short_description,
        description=payload.description,
        assigned_to_id=payload.assigned_to_id or current_user.user_id,
        field_id=primary_field,      # legacy column — first selected field
        created_by_id=current_user.user_id,
        severity=payload.severity,
        status=TaskStatus.NEW,
    )

    db.add(task)
    db.flush()  # get task_id before creating junction rows

    for fid in field_ids:
        db.add(TaskField(task_id=task.task_id, field_id=fid))

    db.commit()
    db.refresh(task)
    return task


# -----------------------------
# Get Tasks for Crop Cycle
# -----------------------------
@router.get("/", response_model=list[TaskResponse])
def get_tasks(
    crop_cycle_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Task)
        .filter(Task.crop_cycle_id == crop_cycle_id)
        .order_by(Task.created_at.desc())
        .all()
    )


# -----------------------------
# Update Task
# -----------------------------
@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    crop_cycle_id: UUID,
    task_id: UUID,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = (
        db.query(Task)
        .filter(Task.task_id == task_id, Task.crop_cycle_id == crop_cycle_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = payload.model_dump(exclude_unset=True)

    # Extract field_ids before scalar loop (no column on Task)
    field_ids = update_data.pop("field_ids", None)
    # Also pop legacy field_id — we set it ourselves below if field_ids provided
    incoming_field_id = update_data.pop("field_id", None)

    if "status" in update_data:
        status_value = update_data["status"]
        if status_value and str(status_value).lower() == "on_hold":
            if not update_data.get("on_hold_reason"):
                raise HTTPException(
                    status_code=400,
                    detail="on_hold_reason is required when status is ON_HOLD",
                )
        if status_value and str(status_value).lower() == "resolved":
            if "resolved_date" not in update_data:
                update_data["resolved_date"] = datetime.utcnow()

    for key, value in update_data.items():
        setattr(task, key, value)

    # Update junction rows when field_ids provided (prefer) or single field_id
    if field_ids is not None:
        db.query(TaskField).filter(TaskField.task_id == task.task_id).delete(
            synchronize_session=False
        )
        for fid in field_ids:
            db.add(TaskField(task_id=task.task_id, field_id=fid))
        task.field_id = field_ids[0] if field_ids else None
    elif incoming_field_id is not None:
        # Legacy single-field update: replace junction with one row
        db.query(TaskField).filter(TaskField.task_id == task.task_id).delete(
            synchronize_session=False
        )
        db.add(TaskField(task_id=task.task_id, field_id=incoming_field_id))
        task.field_id = incoming_field_id

    db.commit()
    db.refresh(task)
    return task


# -----------------------------
# Delete Task
# -----------------------------
@router.delete("/{task_id}", status_code=status.HTTP_200_OK)
def delete_task(
    crop_cycle_id: UUID,
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a task - checks for dependent work orders first"""
    # Verify task exists and belongs to crop_cycle_id
    task = (
        db.query(Task)
        .filter(Task.task_id == task_id, Task.crop_cycle_id == crop_cycle_id)
        .first()
    )
    if not task:
        raise HTTPException(
            status_code=404,
            detail={"success": False, "message": "Task not found"}
        )
    
    # Check for dependent work orders
    work_order_count = db.query(WorkOrder).filter(WorkOrder.task_id == task_id).count()
    if work_order_count > 0:
        raise HTTPException(
            status_code=409,
            detail={"success": False, "message": "Cannot delete task. Delete all work orders first."}
        )
    
    # Safe to delete
    try:
        db.delete(task)
        db.commit()
        return {"success": True, "message": "Deleted successfully"}
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail={"success": False, "message": "Delete blocked due to dependent records."}
        )
