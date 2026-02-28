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

    # Step B: Set created_by_id from authenticated user (never from frontend)
    # Step C: Create Task object with auto-generated fields
    task = Task(
        task_number=task_number,  # Auto-generated, never from frontend
        crop_cycle_id=crop_cycle_id,
        category=payload.category,
        subcategory=payload.subcategory,
        short_description=payload.short_description,
        description=payload.description,
        assigned_to_id=payload.assigned_to_id,
        created_by_id=current_user.user_id,  # Always from auth, never from frontend
        severity=payload.severity,
        status=TaskStatus.NEW,
    )

    # Step D: Commit and return response
    db.add(task)
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

    # Get only fields that were explicitly set (partial update)
    update_data = payload.model_dump(exclude_unset=True)
    
    # Status rules validation
    if "status" in update_data:
        status_value = update_data["status"]
        if status_value and str(status_value).lower() == "on_hold":
            if not update_data.get("on_hold_reason"):
                raise HTTPException(
                    status_code=400,
                    detail="on_hold_reason is required when status is ON_HOLD",
                )
        if status_value and str(status_value).lower() == "resolved":
            # Auto-set resolved_date if not provided
            if "resolved_date" not in update_data:
                update_data["resolved_date"] = datetime.utcnow()

    # Apply updates
    for key, value in update_data.items():
        setattr(task, key, value)

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
