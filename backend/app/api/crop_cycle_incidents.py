"""
Crop Cycle Incident Management API
Parent-Child hierarchy with voice recording support
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
import os
import uuid as uuid_lib
from datetime import datetime, timedelta

from app.database import get_db
from app.models.crop_cycle_incident import CropCycleIncident, CropStage, CropCycleStatus
from app.models.task import Task, TaskStatus, SeverityLevel
from app.models.work_order import WorkOrder, WorkOrderResource
from app.schemas.crop_cycle_incident import *
from app.auth.security import get_current_user
from app.models.user import User
from app.services.groq_service import GroqService

router = APIRouter(prefix="/crop-cycle-incidents", tags=["Crop Cycle Incidents"])

# Directory for storing audio files
AUDIO_DIR = "uploads/audio"
os.makedirs(AUDIO_DIR, exist_ok=True)


# ============ Crop Cycle Endpoints ============

@router.post("/", response_model=CropCycleIncidentResponse, status_code=status.HTTP_201_CREATED)
def create_crop_cycle(
    data: CropCycleIncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new crop cycle (parent incident)"""
    crop_cycle = CropCycleIncident(**data.model_dump())
    db.add(crop_cycle)
    db.commit()
    db.refresh(crop_cycle)
    return crop_cycle


@router.get("/", response_model=List[CropCycleIncidentResponse])
def get_crop_cycles(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    current_stage: Optional[CropStage] = None,
    field_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all crop cycles with filters"""
    query = db.query(CropCycleIncident)
    
    if status:
        # Convert enum to string value for database comparison
        status_value = status.value if hasattr(status, 'value') else str(status)
        query = query.filter(CropCycleIncident.status == status_value)
    if current_stage:
        # Convert enum to string value for database comparison
        stage_value = current_stage.value if hasattr(current_stage, 'value') else str(current_stage)
        query = query.filter(CropCycleIncident.current_stage == stage_value)
    if field_id:
        query = query.filter(CropCycleIncident.field_code == field_id)  # Use field_code instead of field_id
    
    cycles = query.order_by(CropCycleIncident.created_at.desc()).offset(skip).limit(limit).all()  # Use created_at instead of opened_at
    return cycles


@router.get("/{incident_id}", response_model=CropCycleIncidentResponse)
def get_crop_cycle(
    incident_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific crop cycle"""
    cycle = db.query(CropCycleIncident).filter(CropCycleIncident.id == incident_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Crop cycle not found")
    return cycle


@router.put("/{incident_id}", response_model=CropCycleIncidentResponse)
def update_crop_cycle(
    incident_id: UUID,
    data: CropCycleIncidentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update crop cycle and its current stage"""
    cycle = db.query(CropCycleIncident).filter(CropCycleIncident.id == incident_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Crop cycle not found")
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(cycle, field, value)
    
    # Auto-close if status changed to CLOSED
    if data.status == CropCycleStatus.CLOSED and not cycle.closed_at:
        cycle.closed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(cycle)
    return cycle


@router.delete("/{incident_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_crop_cycle(
    incident_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a crop cycle and all its children"""
    cycle = db.query(CropCycleIncident).filter(CropCycleIncident.id == incident_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Crop cycle not found")
    
    # Delete associated audio file
    if cycle.audio_file_path and os.path.exists(cycle.audio_file_path):
        os.remove(cycle.audio_file_path)
    
    db.delete(cycle)
    db.commit()
    return None


# ============ Task (Child Incident) Endpoints ============

@router.post("/{crop_cycle_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    crop_cycle_id: UUID,
    data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a task (child incident) within a crop cycle"""
    # Verify crop cycle exists
    cycle = db.query(CropCycleIncident).filter(CropCycleIncident.incident_id == crop_cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Crop cycle not found")
    
    # Create task
    task_dict = data.model_dump(exclude={'resources', 'crop_cycle_id'})
    # Map task_type to type if present
    if 'task_type' in task_dict:
        task_dict['type'] = task_dict.pop('task_type')
    task = Task(**task_dict, crop_cycle_id=crop_cycle_id, created_by=current_user.id)
    
    # Calculate total cost from resources if provided
    if hasattr(data, 'resources') and data.resources:
        total_cost = sum(r.total_cost for r in data.resources)
        task.cost = total_cost
        
        # Auto-assign severity based on cost
        if total_cost >= 50000:
            task.severity = "sev1"
        elif total_cost >= 20000:
            task.severity = "sev2"
        elif total_cost >= 5000:
            task.severity = "sev3"
        else:
            task.severity = "sev4"
    else:
        task.cost = 0
    
    db.add(task)
    db.flush()
    
    # Note: Task resources are not stored directly in the database
    # Resources are stored in work_order_resources when work orders are created
    
    db.commit()
    db.refresh(task)
    return task


@router.get("/{crop_cycle_id}/tasks", response_model=List[TaskResponse])
def get_tasks(
    crop_cycle_id: UUID,
    skip: int = 0,
    limit: int = 100,
    status: Optional[TaskStatus] = None,
    task_type: Optional[TaskType] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all tasks for a crop cycle"""
    query = db.query(Task).filter(Task.crop_cycle_id == crop_cycle_id)
    
    if status:
        # Convert enum to string value for database comparison
        status_value = status.value if hasattr(status, 'value') else str(status)
        query = query.filter(Task.status == status_value)
    if task_type:
        # Convert enum to string value for database comparison
        task_type_value = task_type.value if hasattr(task_type, 'value') else str(task_type)
        query = query.filter(Task.type == task_type_value)
    
    tasks = query.order_by(Task.created_at.desc()).offset(skip).limit(limit).all()
    return tasks


@router.get("/{crop_cycle_id}/tasks/{task_id}", response_model=TaskResponse)
def get_task(
    crop_cycle_id: UUID,
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific task"""
    task = db.query(Task).filter(Task.id == task_id, Task.crop_cycle_id == crop_cycle_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.put("/{crop_cycle_id}/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    crop_cycle_id: UUID,
    task_id: UUID,
    data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a task"""
    task = db.query(Task).filter(Task.id == task_id, Task.crop_cycle_id == crop_cycle_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_dict = data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(task, field, value)
    
    # Auto-close after 7 days if resolved
    if data.status == TaskStatus.RESOLVED:
        if task.updated_at and (datetime.utcnow() - task.updated_at) > timedelta(days=7):
            task.status = "closed"
            task.resolved_at = datetime.utcnow()  # Use resolved_at instead of closed_at
    
    # Set resolved_at when manually closed
    if data.status == TaskStatus.CLOSED and not task.resolved_at:
        task.resolved_at = datetime.utcnow()  # Use resolved_at instead of closed_at
    
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{crop_cycle_id}/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    crop_cycle_id: UUID,
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a task"""
    task = db.query(Task).filter(Task.id == task_id, Task.crop_cycle_id == crop_cycle_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Delete audio file if exists
    if task.audio_file_path and os.path.exists(task.audio_file_path):
        os.remove(task.audio_file_path)
    
    db.delete(task)
    db.commit()
    return None


# ============ Voice Recording for Tasks ============

@router.post("/{crop_cycle_id}/tasks/voice/upload", response_model=VoiceTaskPreview)
async def upload_voice_task(
    crop_cycle_id: UUID,
    file: UploadFile = File(...),
    assigned_to_id: UUID = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload voice recording for a task and extract data"""
    # Verify crop cycle exists
    cycle = db.query(CropCycleIncident).filter(CropCycleIncident.incident_id == crop_cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Crop cycle not found")
    
    # Validate file type
    allowed_extensions = [".wav", ".mp3", ".m4a", ".ogg", ".webm"]
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Save audio file
    file_id = str(uuid_lib.uuid4())
    audio_filename = f"{file_id}{file_ext}"
    audio_path = os.path.join(AUDIO_DIR, audio_filename)
    
    try:
        with open(audio_path, "wb") as audio_file:
            content = await file.read()
            audio_file.write(content)
        
        # Process with GROQ
        groq_service = GroqService()
        result = groq_service.process_voice_incident(audio_path, language="auto")
        
        # Extract task-specific data
        transcript = result["transcript"]
        
        # Simple extraction for tasks (can be enhanced)
        extracted_task = VoiceTaskData(
            short_description=transcript[:200] if len(transcript) > 200 else transcript,
            description=transcript,
            task_type=TaskType.OTHER.value  # Use .value to get the string "other"
        )
        
        return VoiceTaskPreview(
            transcript=transcript,
            extracted_data=extracted_task,
            audio_file_path=audio_path
        )
        
    except Exception as e:
        if os.path.exists(audio_path):
            os.remove(audio_path)
        raise HTTPException(status_code=500, detail=f"Error processing audio: {str(e)}")


# ============ Work Order Endpoints ============

@router.post("/{crop_cycle_id}/work-orders", response_model=WorkOrderResponse, status_code=status.HTTP_201_CREATED)
def create_work_order(
    crop_cycle_id: UUID,
    data: WorkOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a work order"""
    cycle = db.query(CropCycleIncident).filter(CropCycleIncident.incident_id == crop_cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Crop cycle not found")
    
    # Work orders are linked to tasks, not directly to crop cycles
    # Get a task for this crop cycle or create work order without crop_cycle_id
    work_order_data = data.model_dump(exclude={'crop_cycle_id'})
    work_order = WorkOrder(**work_order_data, created_by=current_user.id)  # Use created_by instead of created_by_id
    db.add(work_order)
    db.commit()
    db.refresh(work_order)
    return work_order


@router.get("/{crop_cycle_id}/work-orders", response_model=List[WorkOrderResponse])
def get_work_orders(
    crop_cycle_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all work orders for a crop cycle"""
    # Work orders are linked to tasks, which are linked to crop cycles
    # Get work orders through tasks
    orders = db.query(WorkOrder).join(Task).filter(Task.crop_cycle_id == crop_cycle_id).order_by(WorkOrder.created_at.desc()).offset(skip).limit(limit).all()
    return orders


@router.get("/{crop_cycle_id}/work-orders/{work_order_id}", response_model=WorkOrderResponse)
def get_work_order(
    crop_cycle_id: UUID,
    work_order_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific work order"""
    # Work orders are linked to tasks, which are linked to crop cycles
    order = db.query(WorkOrder).join(Task).filter(WorkOrder.id == work_order_id, Task.crop_cycle_id == crop_cycle_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Work order not found")
    return order


@router.put("/{crop_cycle_id}/work-orders/{work_order_id}", response_model=WorkOrderResponse)
def update_work_order(
    crop_cycle_id: UUID,
    work_order_id: UUID,
    data: WorkOrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a work order"""
    # Work orders are linked to tasks, which are linked to crop cycles
    order = db.query(WorkOrder).join(Task).filter(WorkOrder.id == work_order_id, Task.crop_cycle_id == crop_cycle_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Work order not found")
    
    update_dict = data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(order, field, value)
    
    # Set closed_at when status changes to completed
    if data.status in [WorkOrderStatus.COMPLETED, WorkOrderStatus.CANCELLED]:
        if not order.closed_at:
            order.closed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(order)
    return order


@router.delete("/{crop_cycle_id}/work-orders/{work_order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_work_order(
    crop_cycle_id: UUID,
    work_order_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a work order"""
    # Work orders are linked to tasks, which are linked to crop cycles
    order = db.query(WorkOrder).join(Task).filter(WorkOrder.id == work_order_id, Task.crop_cycle_id == crop_cycle_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Work order not found")
    
    db.delete(order)
    db.commit()
    return None


