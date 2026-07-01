# backend/app/api/crop_cycles.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import cast, String
from typing import List
from uuid import UUID
from app.database import get_db
from app.models.crop_cycle import CropCycle, CropCycleStatus
from app.models.crop_cycle_field import CropCycleField
from app.models.task import Task
from app.models.user import User
from app.schemas.crop_cycle import CropCycleCreate, CropCycleUpdate, CropCycleResponse
from app.auth.security import get_current_user
from app.utils.id_generator import generate_incident_id
from app.services.database_query_service import DatabaseQueryService
from datetime import datetime, date, timedelta
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_, and_

router = APIRouter(prefix="/api/crop-cycles", tags=["crop-cycles"])


@router.get("/crop-names")
def list_crop_names(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Return distinct crop names for autocomplete suggestions."""
    from sqlalchemy import select, distinct
    names = db.execute(
        select(distinct(CropCycle.crop_name)).where(CropCycle.crop_name.isnot(None))
    ).scalars().all()
    return sorted(names)


@router.get("/", response_model=List[CropCycleResponse])
def get_crop_cycles(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List crop cycles: show open, reopened, resolved; show cancelled only for 3 days; hide closed."""
    try:
        three_days_ago = datetime.utcnow() - timedelta(days=3)
        status_str = cast(CropCycle.status, String)
        crop_cycles = (
            db.query(CropCycle)
            .filter(
                or_(
                    status_str.in_(["open", "reopened", "resolved"]),
                    and_(
                        status_str == "cancelled",
                        CropCycle.updated_at >= three_days_ago,
                    ),
                )
            )
            .order_by(CropCycle.created_at.desc())
            .all()
        )
        return crop_cycles
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching crop cycles: {str(e)}")


@router.get("/{crop_cycle_id}/tasks-detail")
def get_tasks_with_detail(
    crop_cycle_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Tasks + WOs + resources for a cycle, with costs derived live from work_order_resources."""
    from app.models.work_order import WorkOrder
    from app.models.note import Note
    from app.utils.severity import cost_severity

    tasks = (
        db.query(Task)
        .filter(Task.crop_cycle_id == crop_cycle_id)
        .order_by(Task.created_at)
        .all()
    )

    result = []
    for task in tasks:
        work_orders = (
            db.query(WorkOrder)
            .filter(WorkOrder.task_id == task.task_id)
            .order_by(WorkOrder.created_at)
            .all()
        )

        # Batch-load notes for all WOs in this task
        wo_ids = [wo.work_order_id for wo in work_orders]
        notes_by_wo: dict[str, list[str]] = {}
        if wo_ids:
            wo_notes = (
                db.query(Note)
                .filter(Note.related_type == 'work_order', Note.related_id.in_(wo_ids))
                .order_by(Note.created_at.asc())
                .all()
            )
            for n in wo_notes:
                key = str(n.related_id)
                notes_by_wo.setdefault(key, []).append(n.text or '')

        task_cost = 0.0
        wo_list = []
        for wo in work_orders:
            wo_cost = float(sum((r.cost or 0) for r in wo.resources))
            task_cost += wo_cost
            worker_name = wo.assigned_worker.name if wo.assigned_worker else None
            # Latest completion note (last item in list = most recent, since ordered asc)
            wo_note_texts = notes_by_wo.get(str(wo.work_order_id), [])
            completion_note = wo_note_texts[-1] if wo_note_texts else None
            wo_list.append({
                "work_order_id":     str(wo.work_order_id),
                "work_order_number": wo.work_order_number,
                "short_description": wo.short_description,   # fix: was missing (edit opened blank)
                "description":       wo.description,          # fix: was missing
                "status":            wo.status.value if wo.status else None,
                "assigned_worker":   worker_name,
                "wo_cost":           wo_cost,
                "completion_note":   completion_note,         # latest note on this WO
                "resources": [
                    {
                        "resource_id":   str(r.work_order_resources_id),
                        "name":          r.name,
                        "resource_type": r.resource_type.value if r.resource_type else None,
                        "qty":           float(r.qty) if r.qty is not None else None,
                        "unit":          r.unit,
                        "rate":          float(r.rate) if r.rate is not None else None,
                        "cost":          float(r.cost) if r.cost is not None else None,
                    }
                    for r in wo.resources
                ],
            })

        result.append({
            "task_id":           str(task.task_id),
            "task_number":       task.task_number,
            "short_description": task.short_description,
            "description":       task.description,
            "field_id":          task.field_id,              # fix: was missing (edit lost field)
            "category":          task.category.value if task.category else None,
            "subcategory":       task.subcategory.value if task.subcategory else None,
            "status":            task.status.value if task.status else None,
            "task_cost":         task_cost,
            "severity":          cost_severity(task_cost),   # derived, never stored
            "work_orders":       wo_list,
        })

    return result


@router.get("/{crop_cycle_id}/expenditure")
def get_crop_cycle_expenditure(
    crop_cycle_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get expenditure for a crop cycle (task costs + work order resource costs)."""
    service = DatabaseQueryService(db)
    result = service.get_crop_cycle_expenditure(crop_cycle_id)
    if result.get("error"):
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.get("/{crop_cycle_id}", response_model=CropCycleResponse)
def get_crop_cycle(
    crop_cycle_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single crop cycle by ID"""
    crop_cycle = db.query(CropCycle).filter(CropCycle.id == crop_cycle_id).first()
    if not crop_cycle:
        raise HTTPException(status_code=404, detail="Crop cycle not found")
    return crop_cycle


@router.post("/", response_model=CropCycleResponse, status_code=status.HTTP_201_CREATED)
def create_crop_cycle(
    crop_cycle: CropCycleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    data = crop_cycle.model_dump(exclude_unset=True)

    # Extract junction rows; don't pass to CropCycle constructor
    fields_in = data.pop("fields", None) or []

    # Derive field_code from first junction field (backwards compat with NOT NULL column)
    if not data.get("field_code") and fields_in:
        data["field_code"] = fields_in[0]["field_id"]

    # Auto-set cultivated_area = sum of allocated_acres if not explicitly provided
    if fields_in and not data.get("cultivated_area"):
        total = sum((f.get("allocated_acres") or 0) for f in fields_in)
        if total > 0:
            data["cultivated_area"] = total

    # created_by ALWAYS comes from auth, never frontend
    data["created_by"] = current_user.user_id

    if not data.get("incident_no"):
        data["incident_no"] = generate_incident_id(db)

    data["created_at"] = datetime.utcnow()
    data["updated_at"] = datetime.utcnow()

    db_crop_cycle = CropCycle(**data)
    db.add(db_crop_cycle)
    db.flush()  # get crop_cycle_id before creating junction rows

    # Create junction rows for each field
    for f in fields_in:
        db.add(CropCycleField(
            crop_cycle_id=db_crop_cycle.crop_cycle_id,
            field_id=f["field_id"],
            allocated_acres=f.get("allocated_acres"),
        ))

    db.commit()
    db.refresh(db_crop_cycle)
    return db_crop_cycle


@router.put("/{crop_cycle_id}", response_model=CropCycleResponse)
def update_crop_cycle(
    crop_cycle_id: UUID,
    crop_cycle_update: CropCycleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a crop cycle"""
    db_crop_cycle = db.query(CropCycle).filter(CropCycle.id == crop_cycle_id).first()
    if not db_crop_cycle:
        raise HTTPException(status_code=404, detail="Crop cycle not found")
    
    update_data = crop_cycle_update.model_dump(exclude_unset=True)

    status_val = str(update_data.get("status", "") or "").lower()
    if status_val in ("resolved", "cancelled"):
        if not (update_data.get("resolution_comments") or "").strip():
            raise HTTPException(
                status_code=400,
                detail="Resolution comments required"
            )

    if status_val == "resolved":
        open_tasks = (
            db.query(Task)
            .filter(Task.crop_cycle_id == crop_cycle_id)
            .filter(~Task.status.in_(["resolved", "cancelled"]))
            .limit(1)
            .all()
        )
        if open_tasks:
            raise HTTPException(
                status_code=400,
                detail="Cannot resolve crop cycle while tasks are still open."
            )

    # Auto-set resolved_date if status is RESOLVED and date not provided
    if str(update_data.get("status", "")).lower() == "resolved":
        if not update_data.get("resolved_date"):
            update_data["resolved_date"] = date.today()
    
    for key, value in update_data.items():
        setattr(db_crop_cycle, key, value)
    
    db.commit()
    db.refresh(db_crop_cycle)
    return db_crop_cycle


@router.delete("/{crop_cycle_id}", status_code=status.HTTP_200_OK)
def delete_crop_cycle(
    crop_cycle_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a crop cycle - checks for dependent tasks first"""
    from app.models.task import Task
    
    db_crop_cycle = db.query(CropCycle).filter(CropCycle.id == crop_cycle_id).first()
    if not db_crop_cycle:
        raise HTTPException(
            status_code=404,
            detail={"success": False, "message": "Crop cycle not found"}
        )

    if str(db_crop_cycle.status or "").lower() != "open":
        raise HTTPException(
            status_code=400,
            detail="Only open crop cycles can be deleted"
        )
    
    # Check for dependent tasks
    task_count = db.query(Task).filter(Task.crop_cycle_id == crop_cycle_id).count()
    if task_count > 0:
        raise HTTPException(
            status_code=409,
            detail={"success": False, "message": "Cannot delete crop cycle. Delete all tasks first."}
        )
    
    # Safe to delete
    try:
        db.delete(db_crop_cycle)
        db.commit()
        return {"success": True, "message": "Deleted successfully"}
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail={"success": False, "message": "Delete blocked due to dependent records."}
        )

