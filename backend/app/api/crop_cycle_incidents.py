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
from app.models.work_order import WorkOrder, WorkOrderResource, WorkOrderStatus
from app.schemas.crop_cycle_incident import *
from app.auth.security import get_current_user
from app.models.user import User
from app.services.groq_service import GroqService
from app.utils.id_generator import generate_incident_id, generate_task_id, generate_work_order_id

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
    # Map schema fields to model fields
    data_dict = data.model_dump(exclude_unset=True)
    
    # Map field_id to field_code
    if 'field_id' in data_dict:
        data_dict['field_code'] = data_dict.pop('field_id')
    
    # Map supervisor_id to created_by
    if 'supervisor_id' in data_dict:
        data_dict['created_by'] = data_dict.pop('supervisor_id')
    elif not data_dict.get('created_by'):
        data_dict['created_by'] = current_user.id
    
    # Map crop_variety to seed_category
    if 'crop_variety' in data_dict:
        data_dict['seed_category'] = data_dict.pop('crop_variety')
    
    # Map notes to description - The model has a 'notes' relationship, so we can't use 'notes' as a column name
    notes_value = data_dict.pop('notes', None)  # Remove notes immediately
    if notes_value:
        if 'description' in data_dict and data_dict.get('description'):
            data_dict['description'] = f"{data_dict['description']}\n\nNotes: {notes_value}"
        else:
            data_dict['description'] = notes_value
    
    # Convert datetime to date for sowing_date and expected_harvest_date
    if 'sowing_date' in data_dict and data_dict['sowing_date']:
        if isinstance(data_dict['sowing_date'], datetime):
            data_dict['sowing_date'] = data_dict['sowing_date'].date()
        elif isinstance(data_dict['sowing_date'], str):
            # Parse ISO datetime string
            try:
                dt = datetime.fromisoformat(data_dict['sowing_date'].replace('Z', '+00:00'))
                data_dict['sowing_date'] = dt.date()
            except (ValueError, AttributeError):
                # Try parsing as date string
                try:
                    from datetime import date as date_type
                    data_dict['sowing_date'] = date_type.fromisoformat(data_dict['sowing_date'].split('T')[0])
                except (ValueError, AttributeError) as e:
                    raise HTTPException(status_code=400, detail=f"Invalid sowing_date format: {e}")
    
    if 'expected_harvest_date' in data_dict and data_dict['expected_harvest_date']:
        if isinstance(data_dict['expected_harvest_date'], datetime):
            data_dict['expected_harvest_date'] = data_dict['expected_harvest_date'].date()
        elif isinstance(data_dict['expected_harvest_date'], str):
            # Parse ISO datetime string
            try:
                dt = datetime.fromisoformat(data_dict['expected_harvest_date'].replace('Z', '+00:00'))
                data_dict['expected_harvest_date'] = dt.date()
            except (ValueError, AttributeError):
                # Try parsing as date string
                try:
                    from datetime import date as date_type
                    data_dict['expected_harvest_date'] = date_type.fromisoformat(data_dict['expected_harvest_date'].split('T')[0])
                except (ValueError, AttributeError) as e:
                    raise HTTPException(status_code=400, detail=f"Invalid expected_harvest_date format: {e}")
    
    # Map season from Hindi to English if needed
    season_mapping = {
        'रबी': 'Rabi',
        'खरीफ': 'Kharif',
        'जायद': 'Zaid',
    }
    if 'season' in data_dict and data_dict['season']:
        data_dict['season'] = season_mapping.get(data_dict['season'], data_dict['season'])
    
    # Ensure season is provided (required by model)
    if 'season' not in data_dict or not data_dict['season']:
        # Try to infer from current date or set default
        from datetime import date
        month = date.today().month
        if month in [10, 11, 12, 1, 2, 3]:
            data_dict['season'] = 'Rabi'
        elif month in [4, 5, 6]:
            data_dict['season'] = 'Zaid'
        else:
            data_dict['season'] = 'Kharif'
    
    # Exclude relationship fields and any fields that don't exist on the model
    # Relationships: tasks, notes
    # Also exclude any response-only fields
    excluded_fields = {'tasks', 'notes', 'incident_id', 'opened_at', 'updated_at', 'closed_at', 
                      'is_voice_recorded', 'audio_file_path', 'transcript'}
    
    # Only include fields that are actual columns on the model
    model_fields = {
        'id', 'incident_no', 'field_code', 'season', 'crop_name', 'seed_category',
        'sowing_date', 'expected_harvest_date', 'actual_harvest_date', 'resolved_date',
        'cultivated_area', 'current_stage', 'status', 'short_description', 'description',
        'observation', 'resolution_comments', 'total_expense', 'total_revenue', 'profit',
        'created_by', 'created_at', 'updated_at'
    }
    
    # Filter data_dict to only include valid model fields
    # Make sure 'notes' is definitely excluded (it should already be removed, but double-check)
    filtered_data = {k: v for k, v in data_dict.items() 
                     if k in model_fields and k not in excluded_fields and k != 'notes'}
    
    # Generate incident ID if not provided
    if 'incident_no' not in filtered_data or not filtered_data.get('incident_no'):
        filtered_data['incident_no'] = generate_incident_id(db)
    
    # Debug: Log what we're about to create
    print(f"Creating crop cycle with filtered data keys: {list(filtered_data.keys())}")
    print(f"Excluded from data_dict: {set(data_dict.keys()) - set(filtered_data.keys())}")
    print(f"Generated incident_no: {filtered_data.get('incident_no')}")
    
    try:
        crop_cycle = CropCycleIncident(**filtered_data)
        db.add(crop_cycle)
        db.commit()
        db.refresh(crop_cycle)
        
        # Manually construct response to avoid relationship conflicts
        sowing_date_dt = None
        if crop_cycle.sowing_date:
            sowing_date_dt = datetime.combine(crop_cycle.sowing_date, datetime.min.time())
        
        expected_harvest_date_dt = None
        if crop_cycle.expected_harvest_date:
            expected_harvest_date_dt = datetime.combine(crop_cycle.expected_harvest_date, datetime.min.time())
        
        # Provide defaults for current_stage and status if None
        current_stage_value = crop_cycle.current_stage or CropStage.SOWING
        status_value = crop_cycle.status or CropCycleStatus.OPEN
        
        return CropCycleIncidentResponse(
            incident_id=crop_cycle.id,
            incident_no=crop_cycle.incident_no,  # Auto-generated ID (IN0001, etc.)
            field_id=crop_cycle.field_code,
            crop_name=crop_cycle.crop_name,
            crop_variety=crop_cycle.seed_category,
            sowing_date=sowing_date_dt,
            expected_harvest_date=expected_harvest_date_dt,
            current_stage=current_stage_value,
            status=status_value,
            supervisor_id=crop_cycle.created_by,
            season=crop_cycle.season,
            short_description=crop_cycle.short_description,
            description=crop_cycle.description,
            notes=crop_cycle.description,  # Map description back to notes for response
            opened_at=crop_cycle.created_at,
            updated_at=crop_cycle.updated_at,
            closed_at=crop_cycle.resolved_date,
            is_voice_recorded="no",
            audio_file_path=None,
            transcript=None
        )
    except Exception as e:
        db.rollback()
        import traceback
        error_details = traceback.format_exc()
        print(f"Error creating crop cycle: {e}")
        print(f"Error details: {error_details}")
        print(f"Filtered data dict: {filtered_data}")
        print(f"Original data dict: {data_dict}")
        raise HTTPException(
            status_code=500,
            detail=f"Error creating crop cycle: {str(e)}"
        )


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
    try:
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
        
        # Convert CropCycle models to response format manually to ensure proper field mapping
        result = []
        for cycle in cycles:
            try:
                # Convert date to datetime for sowing_date and expected_harvest_date
                sowing_date_dt = None
                if cycle.sowing_date:
                    sowing_date_dt = datetime.combine(cycle.sowing_date, datetime.min.time())
                
                expected_harvest_date_dt = None
                if cycle.expected_harvest_date:
                    expected_harvest_date_dt = datetime.combine(cycle.expected_harvest_date, datetime.min.time())
                
                # Provide default for current_stage if None
                current_stage_value = cycle.current_stage
                if not current_stage_value:
                    current_stage_value = CropStage.SOWING
                
                # Provide default for status if None
                status_value = cycle.status
                if not status_value:
                    status_value = CropCycleStatus.OPEN
                
                # Build response using CropCycleIncidentResponse schema
                response_data = CropCycleIncidentResponse(
                    incident_id=cycle.id,
                    field_id=cycle.field_code,
                    crop_name=cycle.crop_name,
                    crop_variety=cycle.seed_category,
                    sowing_date=sowing_date_dt,
                    expected_harvest_date=expected_harvest_date_dt,
                    current_stage=current_stage_value,
                    status=status_value,
                    supervisor_id=cycle.created_by,
                    season=cycle.season,
                    short_description=cycle.short_description,
                    description=cycle.description,
                    notes=cycle.description,  # Map description to notes for response
                    opened_at=cycle.created_at,
                    updated_at=cycle.updated_at,
                    closed_at=cycle.resolved_date,
                    is_voice_recorded="no",
                    audio_file_path=None,
                    transcript=None
                )
                result.append(response_data)
            except Exception as e:
                import traceback
                print(f"Error converting cycle {cycle.id}: {e}")
                print(traceback.format_exc())
                # Skip this cycle if conversion fails
                continue
        
        return result
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error getting crop cycles: {e}")
        print(f"Error details: {error_details}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching crop cycles: {str(e)}"
        )


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
    
    # Manually construct response to avoid relationship conflicts
    sowing_date_dt = None
    if cycle.sowing_date:
        sowing_date_dt = datetime.combine(cycle.sowing_date, datetime.min.time())
    
    expected_harvest_date_dt = None
    if cycle.expected_harvest_date:
        expected_harvest_date_dt = datetime.combine(cycle.expected_harvest_date, datetime.min.time())
    
    return CropCycleIncidentResponse(
        incident_id=cycle.id,
        incident_no=cycle.incident_no,  # Auto-generated ID (IN0001, etc.)
        field_id=cycle.field_code,
        crop_name=cycle.crop_name,
        crop_variety=cycle.seed_category,
        sowing_date=sowing_date_dt,
        expected_harvest_date=expected_harvest_date_dt,
        current_stage=cycle.current_stage,
        status=cycle.status,
        supervisor_id=cycle.created_by,
        season=cycle.season,
        short_description=cycle.short_description,
        description=cycle.description,
        notes=cycle.description,  # Map description to notes for response
        opened_at=cycle.created_at,
        updated_at=cycle.updated_at,
        closed_at=cycle.resolved_date,
        is_voice_recorded="no",
        audio_file_path=None,
        transcript=None
    )


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
    
    # Map schema fields to model fields
    if 'field_id' in update_data:
        update_data['field_code'] = update_data.pop('field_id')
    if 'supervisor_id' in update_data:
        update_data['created_by'] = update_data.pop('supervisor_id')
    if 'crop_variety' in update_data:
        update_data['seed_category'] = update_data.pop('crop_variety')
    
    # Convert datetime to date for date fields
    if 'sowing_date' in update_data and update_data['sowing_date']:
        if isinstance(update_data['sowing_date'], datetime):
            update_data['sowing_date'] = update_data['sowing_date'].date()
    if 'expected_harvest_date' in update_data and update_data['expected_harvest_date']:
        if isinstance(update_data['expected_harvest_date'], datetime):
            update_data['expected_harvest_date'] = update_data['expected_harvest_date'].date()
    
    # Handle notes field - map to description
    if 'notes' in update_data:
        notes_value = update_data.pop('notes')
        if notes_value:
            if 'description' in update_data and update_data.get('description'):
                update_data['description'] = f"{update_data['description']}\n\nNotes: {notes_value}"
            else:
                update_data['description'] = notes_value
    
    # Only update fields that exist on the model
    model_fields = {
        'id', 'incident_no', 'field_code', 'season', 'crop_name', 'seed_category',
        'sowing_date', 'expected_harvest_date', 'actual_harvest_date', 'resolved_date',
        'cultivated_area', 'current_stage', 'status', 'short_description', 'description',
        'observation', 'resolution_comments', 'total_expense', 'total_revenue', 'profit',
        'created_by', 'created_at', 'updated_at'
    }
    
    for field, value in update_data.items():
        if field in model_fields:
            setattr(cycle, field, value)
    
    # Auto-close if status changed to CLOSED
    if data.status == CropCycleStatus.CLOSED and not cycle.resolved_date:
        cycle.resolved_date = datetime.utcnow().date()
    
    db.commit()
    db.refresh(cycle)
    
    # Manually construct response to avoid relationship conflicts
    sowing_date_dt = None
    if cycle.sowing_date:
        sowing_date_dt = datetime.combine(cycle.sowing_date, datetime.min.time())
    
    expected_harvest_date_dt = None
    if cycle.expected_harvest_date:
        expected_harvest_date_dt = datetime.combine(cycle.expected_harvest_date, datetime.min.time())
    
    # Provide defaults for current_stage and status if None
    current_stage_value = cycle.current_stage or CropStage.SOWING
    status_value = cycle.status or CropCycleStatus.OPEN
    
    return CropCycleIncidentResponse(
        incident_id=cycle.id,
        incident_no=cycle.incident_no,  # Auto-generated ID (IN0001, etc.)
        field_id=cycle.field_code,
        crop_name=cycle.crop_name,
        crop_variety=cycle.seed_category,
        sowing_date=sowing_date_dt,
        expected_harvest_date=expected_harvest_date_dt,
        current_stage=current_stage_value,
        status=status_value,
        supervisor_id=cycle.created_by,
        season=cycle.season,
        short_description=cycle.short_description,
        description=cycle.description,
        notes=cycle.description,  # Map description to notes for response
        opened_at=cycle.created_at,
        updated_at=cycle.updated_at,
        closed_at=cycle.resolved_date,
        is_voice_recorded="no",
        audio_file_path=None,
        transcript=None
    )


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

def _construct_work_order_response(work_order: WorkOrder, crop_cycle_id: Optional[UUID] = None) -> WorkOrderResponse:
    """Helper function to construct WorkOrderResponse from WorkOrder model"""
    # Get crop_cycle_id from parameter, task relationship, or task_id query
    if not crop_cycle_id:
        if work_order.task and work_order.task.crop_cycle_id:
            crop_cycle_id = work_order.task.crop_cycle_id
        elif work_order.task_id:
            # If we have task_id but task relationship isn't loaded, try to get it from task
            # This should not happen if we properly load the relationship
            # For now, we'll use None and let the schema validation catch it
            pass
    
    # Ensure crop_cycle_id is set (required by schema)
    # This should always be available since work orders are created with tasks
    if not crop_cycle_id:
        # This is a data integrity issue - work orders should always have a task with crop_cycle_id
        # But we'll provide a fallback to avoid breaking the API
        # In practice, this should never happen if the relationship is properly loaded
        raise ValueError("Work order must be linked to a task with a crop_cycle_id")
    
    # Convert due_date from Date to datetime if needed
    due_date_dt = None
    if work_order.due_date:
        if isinstance(work_order.due_date, datetime):
            due_date_dt = work_order.due_date
        else:
            # Convert date to datetime
            from datetime import date as date_type
            if isinstance(work_order.due_date, date_type):
                due_date_dt = datetime.combine(work_order.due_date, datetime.min.time())
    
    # Ensure status has a default value (required by schema)
    status = work_order.status or WorkOrderStatus.OPEN
    
    # Ensure created_by_id is set (required by schema)
    if not work_order.created_by:
        raise ValueError("Work order must have a created_by user")
    
    # Format linked_task_ids as JSON array string for frontend compatibility
    # Frontend expects: ["task-id-1", "task-id-2"] or null
    linked_task_ids_str = None
    if work_order.task_id:
        import json
        linked_task_ids_str = json.dumps([str(work_order.task_id)])
    
    return WorkOrderResponse(
        work_order_id=work_order.id,
        work_order_no=work_order.work_order_no,  # Auto-generated ID (WO0001, etc.)
        title=work_order.title,
        description=work_order.description or "",
        instructions=None,  # Not in database
        assigned_to_id=work_order.assigned_to or work_order.created_by,  # Fallback to created_by
        due_date=due_date_dt,
        crop_cycle_id=crop_cycle_id,
        created_by_id=work_order.created_by,
        status=status,
        linked_task_ids=linked_task_ids_str,
        created_at=work_order.created_at,
        updated_at=work_order.updated_at,
        closed_at=work_order.closed_at
    )


def _construct_task_response(task: Task) -> TaskResponse:
    """Helper function to construct TaskResponse from Task model"""
    # Note: labor_count, labor_hours, outcome_observation, gps_lat, gps_lng,
    # on_hold_reason, resolution_notes are NOT in Task model - provide defaults
    return TaskResponse(
        task_id=task.id,
        task_no=task.task_no,  # Auto-generated ID (TA0001, etc.)
        task_type=task.type,
        short_description=task.short_description or "",
        description=task.description,
        assigned_to_id=task.created_by,  # Use created_by as fallback if assigned_to doesn't exist
        occurred_at=task.occurred_at,
        labor_count=None,  # Not in Task model
        labor_hours=None,  # Not in Task model
        outcome_observation=None,  # Not in Task model
        gps_lat=None,  # Not in Task model
        gps_lng=None,  # Not in Task model
        crop_cycle_id=task.crop_cycle_id,
        created_by_id=task.created_by,
        approved_by_id=task.approved_by,
        total_cost=float(task.cost) if task.cost else 0.0,
        severity=task.severity,
        status=task.status or TaskStatus.NEW,  # Provide default if None
        on_hold_reason=None,  # Not in Task model
        resolution_notes=None,  # Not in Task model
        attachments=None,  # Not in database
        created_at=task.created_at,
        updated_at=task.updated_at,
        closed_at=task.resolved_at,  # Map resolved_at to closed_at
        is_voice_recorded="no",  # Not in database
        audio_file_path=None,  # Not in database
        transcript=None,  # Not in database
        resources=[]  # Resources are stored in work_order_resources
    )


@router.post("/{crop_cycle_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    crop_cycle_id: UUID,
    data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a task (child incident) within a crop cycle"""
    # Debug: Log received data
    print(f"🔵 Received task data: {data.model_dump()}")
    print(f"🔵 Task type: {data.task_type}, type: {type(data.task_type)}")
    print(f"🔵 Short description: {data.short_description}, type: {type(data.short_description)}")
    
    # Verify crop cycle exists
    cycle = db.query(CropCycleIncident).filter(CropCycleIncident.id == crop_cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Crop cycle not found")
    
    # Create task
    task_dict = data.model_dump(exclude={'resources', 'crop_cycle_id'})
    
    # CRITICAL: Map task_type to type - database requires type NOT NULL
    if 'task_type' in task_dict and task_dict['task_type']:
        # Convert enum to string value if needed
        task_type_value = task_dict['task_type']
        if hasattr(task_type_value, 'value'):
            task_type_value = task_type_value.value
        task_dict['type'] = str(task_type_value)
        task_dict.pop('task_type')
    else:
        # Fallback - should not happen if schema validation works
        task_dict['type'] = 'other'
    
    # short_description is optional in database (nullable=True)
    # Keep it as-is (can be None or empty string)
    
    # Remove assigned_to_id - Task model doesn't have this field
    task_dict.pop('assigned_to_id', None)
    
    # Validate required fields before database insert
    if not task_dict.get('type'):
        raise HTTPException(
            status_code=422,
            detail="task_type is required. Database constraint: type NOT NULL"
        )
    
    # Only include fields that exist on the Task model
    # Note: labor_count, labor_hours, outcome_observation, gps_lat, gps_lng are NOT in Task model
    model_fields = {
        'id', 'task_no', 'crop_cycle_id', 'type', 'sub_type', 'short_description',
        'description', 'status', 'occurred_at', 'resolved_at', 'severity', 'cost',
        'created_by', 'approved_by', 'created_at', 'updated_at'
    }
    
    filtered_task_dict = {k: v for k, v in task_dict.items() if k in model_fields}
    
    # Generate task ID if not provided
    if 'task_no' not in filtered_task_dict or not filtered_task_dict.get('task_no'):
        filtered_task_dict['task_no'] = generate_task_id(db)
    
    task = Task(**filtered_task_dict, crop_cycle_id=crop_cycle_id, created_by=current_user.id)
    
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
    return _construct_task_response(task)


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
    return [_construct_task_response(task) for task in tasks]


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
    return _construct_task_response(task)


@router.put("/{crop_cycle_id}/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    crop_cycle_id: UUID,
    task_id: UUID,
    data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a task - requires mandatory notes when updating or closing"""
    task = db.query(Task).filter(Task.id == task_id, Task.crop_cycle_id == crop_cycle_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Validate mandatory notes when updating or closing
    update_notes = data.update_notes
    is_closing = data.status in [TaskStatus.CLOSED, TaskStatus.RESOLVED]
    is_updating = any([
        data.task_type is not None,
        data.short_description is not None,
        data.description is not None,
        data.status is not None,
    ])
    
    if (is_closing or is_updating) and (not update_notes or not update_notes.strip()):
        raise HTTPException(
            status_code=422,
            detail="update_notes is mandatory when updating or closing a task. Please provide a reason for the update/closure."
        )
    
    update_dict = data.model_dump(exclude_unset=True)
    
    # Extract update_notes and append to description
    update_notes_value = update_dict.pop('update_notes', None)
    if update_notes_value:
        # Append update notes to description with timestamp
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        note_entry = f"\n\n[Update {timestamp}]: {update_notes_value}"
        if task.description:
            task.description = task.description + note_entry
        else:
            task.description = note_entry.strip()
    
    # Map task_type to type
    if 'task_type' in update_dict:
        update_dict['type'] = update_dict.pop('task_type')
    
    # Remove assigned_to_id as it doesn't exist in the model
    update_dict.pop('assigned_to_id', None)
    
    # Only update fields that exist on the model
    # Note: labor_count, labor_hours, outcome_observation, on_hold_reason, 
    # resolution_notes, gps_lat, gps_lng are NOT in Task model
    model_fields = {
        'type', 'sub_type', 'short_description', 'description', 'status',
        'occurred_at', 'resolved_at', 'severity', 'cost',
        'approved_by'
    }
    
    for field, value in update_dict.items():
        if field in model_fields:
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
    return _construct_task_response(task)


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
    cycle = db.query(CropCycleIncident).filter(CropCycleIncident.id == crop_cycle_id).first()
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
    """Create a work order - Work orders must be linked to a task"""
    # Verify crop cycle exists
    cycle = db.query(CropCycleIncident).filter(CropCycleIncident.id == crop_cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Crop cycle not found")
    
    # Work orders are linked to tasks via task_id, not directly to crop cycles
    # Find or get task_id from request
    task_id = None
    if data.task_id:
        # Use provided task_id
        task = db.query(Task).filter(Task.id == data.task_id, Task.crop_cycle_id == crop_cycle_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found for this crop cycle")
        task_id = data.task_id
    else:
        # Find first task for this crop cycle, or create a default task
        task = db.query(Task).filter(Task.crop_cycle_id == crop_cycle_id).first()
        if not task:
            # Create a default task for this crop cycle
            default_task = Task(
                task_no=generate_task_id(db),
                crop_cycle_id=crop_cycle_id,
                type='other',
                short_description='Default Task',
                created_by=current_user.id,
                status='new'
            )
            db.add(default_task)
            db.flush()
            task_id = default_task.id
        else:
            task_id = task.id
    
    # Prepare work order data
    work_order_data = data.model_dump(exclude={'crop_cycle_id', 'task_id', 'instructions'})
    
    # Validate required field: title (database NOT NULL constraint)
    if not work_order_data.get('title'):
        raise HTTPException(
            status_code=422,
            detail="title is required. Database constraint: title NOT NULL"
        )
    
    # Map assigned_to_id to assigned_to
    if 'assigned_to_id' in work_order_data:
        work_order_data['assigned_to'] = work_order_data.pop('assigned_to_id')
    
    # Convert due_date from datetime to date if needed
    if 'due_date' in work_order_data and work_order_data['due_date']:
        if isinstance(work_order_data['due_date'], datetime):
            work_order_data['due_date'] = work_order_data['due_date'].date()
        elif isinstance(work_order_data['due_date'], str):
            try:
                dt = datetime.fromisoformat(work_order_data['due_date'].replace('Z', '+00:00'))
                work_order_data['due_date'] = dt.date()
            except (ValueError, AttributeError):
                from datetime import date as date_type
                work_order_data['due_date'] = date_type.fromisoformat(work_order_data['due_date'].split('T')[0])
    
    # Only include fields that exist on the WorkOrder model
    model_fields = {
        'id', 'work_order_no', 'task_id', 'title', 'description', 'assigned_to',
        'created_by', 'status', 'due_date', 'created_at', 'updated_at', 'closed_at'
    }
    
    filtered_data = {k: v for k, v in work_order_data.items() if k in model_fields}
    
    # Generate work order ID if not provided
    if 'work_order_no' not in filtered_data or not filtered_data.get('work_order_no'):
        filtered_data['work_order_no'] = generate_work_order_id(db)
    
    # Create work order with task_id
    work_order = WorkOrder(**filtered_data, task_id=task_id, created_by=current_user.id)
    db.add(work_order)
    db.commit()
    db.refresh(work_order)
    
    # Ensure task relationship is loaded for response construction
    if not work_order.task:
        work_order.task = db.query(Task).filter(Task.id == task_id).first()
    
    # Pass crop_cycle_id explicitly since we have it from URL parameter
    return _construct_work_order_response(work_order, crop_cycle_id=crop_cycle_id)


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
    return [_construct_work_order_response(order, crop_cycle_id=crop_cycle_id) for order in orders]


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
    return _construct_work_order_response(order, crop_cycle_id=crop_cycle_id)


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
    
    # Map assigned_to_id to assigned_to
    if 'assigned_to_id' in update_dict:
        update_dict['assigned_to'] = update_dict.pop('assigned_to_id')
    
    # Convert due_date from datetime to date if needed
    if 'due_date' in update_dict and update_dict['due_date']:
        if isinstance(update_dict['due_date'], datetime):
            update_dict['due_date'] = update_dict['due_date'].date()
        elif isinstance(update_dict['due_date'], str):
            try:
                dt = datetime.fromisoformat(update_dict['due_date'].replace('Z', '+00:00'))
                update_dict['due_date'] = dt.date()
            except (ValueError, AttributeError):
                from datetime import date as date_type
                update_dict['due_date'] = date_type.fromisoformat(update_dict['due_date'].split('T')[0])
    
    # Only update fields that exist on the model
    model_fields = {
        'title', 'description', 'assigned_to', 'status', 'due_date', 'closed_at'
    }
    
    for field, value in update_dict.items():
        if field in model_fields:
            setattr(order, field, value)
    
    # Set closed_at when status changes to completed
    if data.status in [WorkOrderStatus.COMPLETED, WorkOrderStatus.CANCELLED]:
        if not order.closed_at:
            order.closed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(order)
    # Get crop_cycle_id from task relationship or use the one from URL
    wo_crop_cycle_id = crop_cycle_id
    if order.task and order.task.crop_cycle_id:
        wo_crop_cycle_id = order.task.crop_cycle_id
    return _construct_work_order_response(order, crop_cycle_id=wo_crop_cycle_id)


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


