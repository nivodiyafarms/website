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
from app.models.crop_cycle import CropCycle
from app.models.task import Task, TaskStatus, SeverityLevel
from app.models.work_order import WorkOrder, WorkOrderStatus
from app.models.work_order_resource import WorkOrderResource
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
    """Get all crop cycles with filters - queries crop_cycles table"""
    try:
        # Query CropCycle model which maps to crop_cycles table (where the data actually is)
        query = db.query(CropCycle)
        
        if status:
            # Convert enum to string value for database comparison
            status_value = status.value if hasattr(status, 'value') else str(status)
            query = query.filter(CropCycle.status == status_value)
        if current_stage:
            # Convert enum to string value for database comparison
            stage_value = current_stage.value if hasattr(current_stage, 'value') else str(current_stage)
            query = query.filter(CropCycle.current_stage == stage_value)
        if field_id:
            query = query.filter(CropCycle.field_code == field_id)
        
        cycles = query.order_by(CropCycle.created_at.desc()).offset(skip).limit(limit).all()
        
        # Convert CropCycle models to CropCycleIncidentResponse format
        result = []
        for cycle in cycles:
            try:
                # Convert Date to DateTime for sowing_date and expected_harvest_date
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
                # CropCycle uses: id, field_code, seed_category, created_by, created_at, resolved_date, season
                response_data = CropCycleIncidentResponse(
                    incident_id=cycle.id,  # CropCycle uses id as PK
                    field_id=cycle.field_code,  # CropCycle uses field_code
                    crop_name=cycle.crop_name,
                    crop_variety=cycle.seed_category,  # CropCycle uses seed_category
                    sowing_date=sowing_date_dt,  # Convert Date to DateTime
                    expected_harvest_date=expected_harvest_date_dt,  # Convert Date to DateTime
                    current_stage=current_stage_value,
                    status=status_value,
                    supervisor_id=cycle.created_by,  # CropCycle uses created_by
                    season=cycle.season,  # CropCycle has season field
                    short_description=cycle.short_description,
                    description=cycle.description,
                    notes=cycle.description,  # Use description as notes
                    opened_at=cycle.created_at,  # CropCycle uses created_at
                    updated_at=cycle.updated_at,
                    closed_at=cycle.resolved_date,  # CropCycle uses resolved_date
                    is_voice_recorded="no",  # Not in crop_cycles table
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
    """Get a specific crop cycle - queries crop_cycles table"""
    # Query CropCycle model which maps to crop_cycles table (where the data actually is)
    # CropCycle uses id as PK, not incident_id
    cycle = db.query(CropCycle).filter(CropCycle.id == incident_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Crop cycle not found")
    
    # Convert Date to DateTime for sowing_date and expected_harvest_date
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
        incident_id=cycle.id,  # CropCycle uses id as PK
        incident_no=cycle.incident_no,  # Auto-generated ID (IN0001, etc.)
        field_id=cycle.field_code,  # CropCycle uses field_code
        crop_name=cycle.crop_name,
        crop_variety=cycle.seed_category,  # CropCycle uses seed_category
        sowing_date=sowing_date_dt,  # Convert Date to DateTime
        expected_harvest_date=expected_harvest_date_dt,  # Convert Date to DateTime
        current_stage=current_stage_value,
        status=status_value,
        supervisor_id=cycle.created_by,  # CropCycle uses created_by
        season=cycle.season,  # CropCycle has season field
        short_description=cycle.short_description,
        description=cycle.description,
        notes=cycle.description,  # Use description as notes
        opened_at=cycle.created_at,  # CropCycle uses created_at
        updated_at=cycle.updated_at,
        closed_at=cycle.resolved_date,  # CropCycle uses resolved_date
        is_voice_recorded="no",  # Not in crop_cycles table
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
    cycle = db.query(CropCycleIncident).filter(CropCycleIncident.incident_id == incident_id).first()
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
    cycle = db.query(CropCycleIncident).filter(CropCycleIncident.incident_id == incident_id).first()
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
    # Map database columns to response schema
    # Convert database enum values (UPPERCASE) to Python enum values (lowercase)
    from app.models.task import TaskType, SeverityLevel
    
    # Convert task_type from UPPERCASE (OTHER) to lowercase (other) for enum
    task_type_value = task.task_type.lower() if task.task_type else 'other'
    try:
        task_type_enum = TaskType(task_type_value)
    except ValueError:
        task_type_enum = TaskType.OTHER  # Default fallback
    
    # Convert severity from UPPERCASE with underscores (SEV_1) to lowercase without underscore (sev1)
    severity_value = None
    if task.severity:
        # Database has SEV_1, SEV_2, etc. - enum expects sev1, sev2, etc. (lowercase, no underscore)
        severity_str = task.severity.upper().replace('_', '')  # SEV_1 -> SEV1
        severity_str = severity_str.lower()  # SEV1 -> sev1
        try:
            severity_value = SeverityLevel(severity_str)
        except ValueError:
            severity_value = None
    
    return TaskResponse(
        task_id=task.task_id,  # Database uses task_id as PK
        task_type=task_type_enum,  # Converted to enum
        short_description=task.short_description,
        description=task.description,
        assigned_to_id=task.assigned_to_id,  # Database has this field
        occurred_at=task.occurred_at,
        labor_count=task.labor_count,
        labor_hours=task.labor_hours,
        outcome_observation=task.outcome_observation,
        gps_lat=task.gps_lat,
        gps_lng=task.gps_lng,
        crop_cycle_id=task.crop_cycle_id,
        created_by_id=task.created_by_id,  # Database uses created_by_id
        approved_by_id=task.approved_by_id,  # Database uses approved_by_id
        total_cost=float(task.total_cost) if task.total_cost else 0.0,  # Database uses total_cost
        severity=severity_value,  # Converted to enum or None
        status=TaskStatus(task.status.lower()) if task.status else TaskStatus.NEW,  # Convert DB UPPERCASE to enum lowercase
        on_hold_reason=task.on_hold_reason,
        resolution_notes=task.resolution_notes,
        attachments=task.attachments,
        created_at=task.created_at,
        updated_at=task.updated_at,
        closed_at=task.closed_at,  # Database uses closed_at
        is_voice_recorded=task.is_voice_recorded or "no",
        audio_file_path=task.audio_file_path,
        transcript=task.transcript,
        resources=[]  # Resources are stored in task_resources table, not directly in tasks
    )


@router.post("/{crop_cycle_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    crop_cycle_id: UUID,
    data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a task (child incident) within a crop cycle"""
    try:
        # First check if crop cycle exists in crop_cycles table (where data actually is)
        crop_cycle = db.query(CropCycle).filter(CropCycle.id == crop_cycle_id).first()
        if not crop_cycle:
            raise HTTPException(status_code=404, detail="Crop cycle not found")
        
        # Tasks reference crop_cycle_incidents table, so we need to ensure an entry exists there
        # Check if corresponding crop_cycle_incident exists
        cycle_incident = db.query(CropCycleIncident).filter(CropCycleIncident.incident_id == crop_cycle_id).first()
        
        # If it doesn't exist, create one from the crop_cycle data
        if not cycle_incident:
            # Get current_stage value - database enum uses UPPERCASE (SOWING, GERMINATION, etc.)
            current_stage_value = crop_cycle.current_stage or "sowing"
            # Convert to UPPERCASE to match database enum
            current_stage_value = current_stage_value.upper() if current_stage_value else "SOWING"
            
            # Get status value - cropcyclestatus enum uses UPPERCASE (OPEN, CLOSED)
            status_value = crop_cycle.status or "open"
            # Convert to UPPERCASE to match database enum
            status_value = status_value.upper() if status_value else "OPEN"
            
            # Get supervisor_id - verify it exists in users table, otherwise use current_user
            supervisor_id = current_user.user_id  # Default to current user
            if crop_cycle.created_by:
                # Verify the user exists in users table
                user_exists = db.query(User).filter(User.user_id == crop_cycle.created_by).first()
                if user_exists:
                    supervisor_id = crop_cycle.created_by
                # If user doesn't exist, use current_user (already set above)
            
            # Create a corresponding crop_cycle_incident entry using raw SQL to handle enum casting
            from sqlalchemy import text
            db.execute(text("""
                INSERT INTO crop_cycle_incidents (
                    incident_id, field_id, crop_name, crop_variety, 
                    sowing_date, expected_harvest_date, current_stage, status,
                    supervisor_id, short_description, description, notes,
                    opened_at, updated_at, closed_at, is_voice_recorded
                ) VALUES (
                    CAST(:incident_id AS UUID), :field_id, :crop_name, :crop_variety,
                    :sowing_date, :expected_harvest_date, 
                    CAST(:current_stage AS cropstage), CAST(:status AS cropcyclestatus),
                    CAST(:supervisor_id AS UUID), :short_description, :description, :notes,
                    :opened_at, :updated_at, :closed_at, :is_voice_recorded
                )
            """), {
                "incident_id": str(crop_cycle.id),
                "field_id": crop_cycle.field_code,
                "crop_name": crop_cycle.crop_name,
                "crop_variety": crop_cycle.seed_category,
                "sowing_date": datetime.combine(crop_cycle.sowing_date, datetime.min.time()) if crop_cycle.sowing_date else datetime.utcnow(),
                "expected_harvest_date": datetime.combine(crop_cycle.expected_harvest_date, datetime.min.time()) if crop_cycle.expected_harvest_date else None,
                "current_stage": current_stage_value,
                "status": status_value,
                "supervisor_id": str(supervisor_id),
                "short_description": crop_cycle.short_description,
                "description": crop_cycle.description,
                "notes": crop_cycle.description,
                "opened_at": crop_cycle.created_at or datetime.utcnow(),
                "updated_at": crop_cycle.updated_at or datetime.utcnow(),
                "closed_at": datetime.combine(crop_cycle.resolved_date, datetime.min.time()) if crop_cycle.resolved_date else None,
                "is_voice_recorded": "no"
            })
            db.commit()
            
            # Refresh to get the created incident
            cycle_incident = db.query(CropCycleIncident).filter(CropCycleIncident.incident_id == crop_cycle.id).first()
        
        cycle = cycle_incident  # Use for consistency with rest of code
        
        # Prepare task data - map schema fields to database columns
        task_dict = data.model_dump(exclude={'resources', 'crop_cycle_id'})
        
        # Convert task_type enum to string value - database enum uses UPPERCASE
        task_type_value = task_dict.get('task_type')
        if hasattr(task_type_value, 'value'):
            task_type_value = task_type_value.value
        task_type_str = str(task_type_value) if task_type_value else 'other'
        # Convert to UPPERCASE to match database enum (OTHER, IRRIGATION, etc.)
        task_dict['task_type'] = task_type_str.upper()
        
        # Ensure status has a default value (required, NOT NULL) - database enum uses UPPERCASE
        if 'status' not in task_dict or not task_dict.get('status'):
            task_dict['status'] = 'NEW'
        elif hasattr(task_dict['status'], 'value'):
            task_dict['status'] = task_dict['status'].value.upper()
        else:
            # Convert to UPPERCASE to match database enum
            task_dict['status'] = str(task_dict['status']).upper()
        
        # Ensure short_description is provided (required, NOT NULL)
        if not task_dict.get('short_description'):
            raise HTTPException(
                status_code=422,
                detail="short_description is required. Database constraint: short_description NOT NULL"
            )
        
        # Ensure assigned_to_id is provided (required, NOT NULL)
        if not task_dict.get('assigned_to_id'):
            # Use current_user if not provided
            task_dict['assigned_to_id'] = current_user.user_id
        
        # Set created_by_id (required, NOT NULL)
        task_dict['created_by_id'] = current_user.user_id
        
        # Calculate total cost from resources if provided
        total_cost = 0.0
        if hasattr(data, 'resources') and data.resources:
            total_cost = sum(float(r.total_cost) for r in data.resources)
        
        # Use provided total_cost or calculated value
        task_dict['total_cost'] = task_dict.get('total_cost', total_cost)
        
        # Handle severity - convert to database enum format (SEV_1, SEV_2, SEV_3, SEV_4)
        # If severity is provided, convert it; otherwise auto-assign based on cost
        if 'severity' in task_dict and task_dict.get('severity'):
            # Convert severity to database enum format
            severity_value = task_dict.get('severity')
            if hasattr(severity_value, 'value'):
                severity_value = severity_value.value
            severity_str = str(severity_value).upper()
            # Convert sev1/sev2/sev3/sev4 to SEV_1/SEV_2/SEV_3/SEV_4
            if severity_str.startswith('SEV'):
                if '_' not in severity_str:
                    # Convert SEV1 to SEV_1, etc.
                    severity_str = severity_str.replace('SEV', 'SEV_')
                task_dict['severity'] = severity_str
            else:
                # Convert sev1 to SEV_1, etc.
                severity_str = severity_str.replace('sev', 'SEV_')
                task_dict['severity'] = severity_str
        else:
            # Auto-assign severity based on cost - database enum uses UPPERCASE with underscores (SEV_1, SEV_2, etc.)
            if task_dict['total_cost'] >= 50000:
                task_dict['severity'] = "SEV_1"
            elif task_dict['total_cost'] >= 20000:
                task_dict['severity'] = "SEV_2"
            elif task_dict['total_cost'] >= 5000:
                task_dict['severity'] = "SEV_3"
            else:
                task_dict['severity'] = "SEV_4"
        
        # Set required fields with defaults
        task_dict['is_voice_recorded'] = "no"  # Required, NOT NULL, default "no"
        
        # Map to database column names
        db_task_dict = {
            'task_id': uuid_lib.uuid4(),  # Generate new UUID for task_id
            'crop_cycle_id': crop_cycle_id,  # From URL parameter
            'task_type': task_dict['task_type'],
            'short_description': task_dict['short_description'],
            'description': task_dict.get('description'),
            'assigned_to_id': task_dict['assigned_to_id'],
            'created_by_id': task_dict['created_by_id'],
            'approved_by_id': task_dict.get('approved_by_id'),
            'occurred_at': task_dict.get('occurred_at'),
            'labor_count': task_dict.get('labor_count'),
            'labor_hours': task_dict.get('labor_hours'),
            'total_cost': task_dict['total_cost'],
            'outcome_observation': task_dict.get('outcome_observation'),
            'severity': task_dict.get('severity'),
            'status': task_dict['status'],
            'on_hold_reason': task_dict.get('on_hold_reason'),
            'resolution_notes': task_dict.get('resolution_notes'),
            'gps_lat': task_dict.get('gps_lat'),
            'gps_lng': task_dict.get('gps_lng'),
            'attachments': task_dict.get('attachments'),
            'is_voice_recorded': task_dict['is_voice_recorded'],
            'audio_file_path': None,
            'transcript': None,
        }
        
        # Create task
        task = Task(**db_task_dict)
        db.add(task)
        db.commit()
        db.refresh(task)
        
        return _construct_task_response(task)
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        import traceback
        print(f"Error creating task: {e}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error creating task: {str(e)}"
        )


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
    """Get all tasks for a crop cycle incident"""
    try:
        # Query tasks - database uses task_id as PK and task_type as column name
        query = db.query(Task).filter(Task.crop_cycle_id == crop_cycle_id)
        
        if status:
            # Convert enum to string value for database comparison
            status_value = status.value if hasattr(status, 'value') else str(status)
            query = query.filter(Task.status == status_value)
        if task_type:
            # Convert enum to string value for database comparison
            task_type_value = task_type.value if hasattr(task_type, 'value') else str(task_type)
            query = query.filter(Task.task_type == task_type_value)  # Database uses task_type, not type
        
        tasks = query.order_by(Task.created_at.desc()).offset(skip).limit(limit).all()
        return [_construct_task_response(task) for task in tasks]
    except Exception as e:
        import traceback
        print(f"Error getting tasks: {e}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching tasks: {str(e)}"
        )


@router.get("/{crop_cycle_id}/tasks/{task_id}", response_model=TaskResponse)
def get_task(
    crop_cycle_id: UUID,
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific task"""
    # Database uses task_id as PK, not id
    task = db.query(Task).filter(Task.task_id == task_id, Task.crop_cycle_id == crop_cycle_id).first()
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
    try:
        # Database uses task_id as PK, not id
        task = db.query(Task).filter(Task.task_id == task_id, Task.crop_cycle_id == crop_cycle_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Validate mandatory notes when updating or closing
        update_notes = data.update_notes
        is_closing = data.status in [TaskStatus.CLOSED, TaskStatus.RESOLVED] if data.status else False
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
        
        # Map task_type - database uses task_type, not type
        if 'task_type' in update_dict:
            task_type_value = update_dict['task_type']
            if hasattr(task_type_value, 'value'):
                task_type_value = task_type_value.value
            # Convert to UPPERCASE to match database enum (OTHER, IRRIGATION, etc.)
            task.task_type = str(task_type_value).upper()
            update_dict.pop('task_type')
        
        # Map status - database enum uses UPPERCASE
        if 'status' in update_dict:
            status_value = update_dict['status']
            if hasattr(status_value, 'value'):
                status_value = status_value.value
            # Convert to UPPERCASE to match database enum
            task.status = str(status_value).upper()
            update_dict.pop('status')
        
        # Map severity - database enum uses UPPERCASE with underscores (SEV_1, SEV_2, etc.)
        if 'severity' in update_dict:
            severity_value = update_dict['severity']
            if hasattr(severity_value, 'value'):
                severity_value = severity_value.value
            severity_str = str(severity_value).upper()
            # Convert sev1/sev2/sev3/sev4 to SEV_1/SEV_2/SEV_3/SEV_4
            if severity_str.startswith('SEV'):
                if '_' not in severity_str:
                    # Convert SEV1 to SEV_1, etc.
                    severity_str = severity_str.replace('SEV', 'SEV_')
            else:
                # Convert sev1 to SEV_1, etc.
                severity_str = severity_str.replace('sev', 'SEV_')
            update_dict['severity'] = severity_str
        
        # Update fields that exist in database
        db_fields = {
            'short_description', 'description', 'occurred_at', 'labor_count', 'labor_hours',
            'outcome_observation', 'gps_lat', 'gps_lng', 'on_hold_reason', 'resolution_notes',
            'approved_by_id', 'severity', 'total_cost', 'attachments'
        }
        
        for field, value in update_dict.items():
            if field in db_fields:
                setattr(task, field, value)
        
        # Set closed_at when manually closed
        if data.status in [TaskStatus.CLOSED, TaskStatus.RESOLVED]:
            if not task.closed_at:
                task.closed_at = datetime.utcnow()
        
        db.commit()
        db.refresh(task)
        return _construct_task_response(task)
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        import traceback
        print(f"Error updating task: {e}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error updating task: {str(e)}"
        )


@router.delete("/{crop_cycle_id}/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    crop_cycle_id: UUID,
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a task"""
    # Database uses task_id as PK, not id
    task = db.query(Task).filter(Task.task_id == task_id, Task.crop_cycle_id == crop_cycle_id).first()
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
    # Verify crop cycle exists in crop_cycles table
    crop_cycle = db.query(CropCycle).filter(CropCycle.id == crop_cycle_id).first()
    if not crop_cycle:
        raise HTTPException(status_code=404, detail="Crop cycle not found")
    
    # Ensure corresponding crop_cycle_incident exists (for task creation later)
    cycle = db.query(CropCycleIncident).filter(CropCycleIncident.incident_id == crop_cycle_id).first()
    if not cycle:
        # Get current_stage value - database enum uses UPPERCASE (SOWING, GERMINATION, etc.)
        current_stage_value = (crop_cycle.current_stage or "sowing").upper()
        
        # Get status value - cropcyclestatus enum uses UPPERCASE (OPEN, CLOSED)
        status_value = (crop_cycle.status or "open").upper()
        
        # Get supervisor_id - verify it exists in users table, otherwise use current_user
        supervisor_id = current_user.user_id  # Default to current user
        if crop_cycle.created_by:
            # Verify the user exists in users table
            user_exists = db.query(User).filter(User.user_id == crop_cycle.created_by).first()
            if user_exists:
                supervisor_id = crop_cycle.created_by
            # If user doesn't exist, use current_user (already set above)
        
        # Create corresponding entry using raw SQL to handle enum casting
        from sqlalchemy import text
        db.execute(text("""
            INSERT INTO crop_cycle_incidents (
                incident_id, field_id, crop_name, crop_variety, 
                sowing_date, expected_harvest_date, current_stage, status,
                supervisor_id, short_description, description, notes,
                opened_at, updated_at, closed_at, is_voice_recorded
            ) VALUES (
                CAST(:incident_id AS UUID), :field_id, :crop_name, :crop_variety,
                :sowing_date, :expected_harvest_date, 
                CAST(:current_stage AS cropstage), CAST(:status AS cropcyclestatus),
                CAST(:supervisor_id AS UUID), :short_description, :description, :notes,
                :opened_at, :updated_at, :closed_at, :is_voice_recorded
            )
        """), {
            "incident_id": str(crop_cycle.id),
            "field_id": crop_cycle.field_code,
            "crop_name": crop_cycle.crop_name,
            "crop_variety": crop_cycle.seed_category,
            "sowing_date": datetime.combine(crop_cycle.sowing_date, datetime.min.time()) if crop_cycle.sowing_date else datetime.utcnow(),
            "expected_harvest_date": datetime.combine(crop_cycle.expected_harvest_date, datetime.min.time()) if crop_cycle.expected_harvest_date else None,
            "current_stage": current_stage_value,
            "status": status_value,
            "supervisor_id": str(supervisor_id),
            "short_description": crop_cycle.short_description,
            "description": crop_cycle.description,
            "notes": crop_cycle.description,
            "opened_at": crop_cycle.created_at or datetime.utcnow(),
            "updated_at": crop_cycle.updated_at or datetime.utcnow(),
            "closed_at": datetime.combine(crop_cycle.resolved_date, datetime.min.time()) if crop_cycle.resolved_date else None,
            "is_voice_recorded": "no"
        })
        db.commit()
        
        # Refresh to get the created incident
        cycle = db.query(CropCycleIncident).filter(CropCycleIncident.incident_id == crop_cycle_id).first()
    
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
            task_type=TaskType.OTHER.value.upper()  # Convert to UPPERCASE to match database enum
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
    try:
        # Verify crop cycle incident exists - database uses incident_id as PK
        cycle = db.query(CropCycleIncident).filter(CropCycleIncident.incident_id == crop_cycle_id).first()
        if not cycle:
            raise HTTPException(status_code=404, detail="Crop cycle incident not found")
        
        # Work orders are linked to tasks via task_id, not directly to crop cycles
        # Find or get task_id from request
        task_id = None
        if data.task_id:
            # Use provided task_id - database uses task_id as PK, not id
            task = db.query(Task).filter(Task.task_id == data.task_id, Task.crop_cycle_id == crop_cycle_id).first()
            if not task:
                raise HTTPException(status_code=404, detail="Task not found for this crop cycle")
            task_id = data.task_id
        else:
            # Find first task for this crop cycle, or create a default task
            task = db.query(Task).filter(Task.crop_cycle_id == crop_cycle_id).first()
            if not task:
                # Create a default task for this crop cycle
                default_task = Task(
                    task_id=uuid_lib.uuid4(),
                    crop_cycle_id=crop_cycle_id,
                    task_type='OTHER',  # Database enum uses UPPERCASE
                    short_description='Default Task',
                    assigned_to_id=current_user.user_id,
                    created_by_id=current_user.user_id,
                    status='NEW',  # Database enum uses UPPERCASE
                    total_cost=0.0,
                    is_voice_recorded='no'
                )
                db.add(default_task)
                db.flush()
                task_id = default_task.task_id
            else:
                task_id = task.task_id
        
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
        work_order = WorkOrder(**filtered_data, task_id=task_id, created_by=current_user.user_id)
        db.add(work_order)
        db.commit()
        db.refresh(work_order)
        
        # Ensure task relationship is loaded for response construction
        if not work_order.task:
            work_order.task = db.query(Task).filter(Task.task_id == task_id).first()
        
        # Pass crop_cycle_id explicitly since we have it from URL parameter
        return _construct_work_order_response(work_order, crop_cycle_id=crop_cycle_id)
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        import traceback
        print(f"Error creating work order: {e}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error creating work order: {str(e)}"
        )


@router.get("/{crop_cycle_id}/work-orders", response_model=List[WorkOrderResponse])
def get_work_orders(
    crop_cycle_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all work orders for a crop cycle incident"""
    try:
        # Work orders are linked to tasks via task_id
        # Tasks are linked to crop_cycle_incidents via crop_cycle_id
        # Database uses tasks.task_id as PK, not tasks.id
        orders = db.query(WorkOrder).join(
            Task, WorkOrder.task_id == Task.task_id
        ).filter(
            Task.crop_cycle_id == crop_cycle_id
        ).order_by(WorkOrder.created_at.desc()).offset(skip).limit(limit).all()
        return [_construct_work_order_response(order, crop_cycle_id=crop_cycle_id) for order in orders]
    except Exception as e:
        import traceback
        print(f"Error getting work orders: {e}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching work orders: {str(e)}"
        )


@router.get("/{crop_cycle_id}/work-orders/{work_order_id}", response_model=WorkOrderResponse)
def get_work_order(
    crop_cycle_id: UUID,
    work_order_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific work order"""
    try:
        # Work orders are linked to tasks via task_id
        # Tasks use task_id as PK, not id
        order = db.query(WorkOrder).join(
            Task, WorkOrder.task_id == Task.task_id
        ).filter(
            WorkOrder.id == work_order_id, Task.crop_cycle_id == crop_cycle_id
        ).first()
        if not order:
            raise HTTPException(status_code=404, detail="Work order not found")
        return _construct_work_order_response(order, crop_cycle_id=crop_cycle_id)
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Error getting work order: {e}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching work order: {str(e)}"
        )


@router.put("/{crop_cycle_id}/work-orders/{work_order_id}", response_model=WorkOrderResponse)
def update_work_order(
    crop_cycle_id: UUID,
    work_order_id: UUID,
    data: WorkOrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a work order"""
    try:
        # Work orders are linked to tasks via task_id
        # Tasks use task_id as PK, not id
        order = db.query(WorkOrder).join(
            Task, WorkOrder.task_id == Task.task_id
        ).filter(
            WorkOrder.id == work_order_id, Task.crop_cycle_id == crop_cycle_id
        ).first()
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
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        import traceback
        print(f"Error updating work order: {e}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error updating work order: {str(e)}"
        )


@router.delete("/{crop_cycle_id}/work-orders/{work_order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_work_order(
    crop_cycle_id: UUID,
    work_order_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a work order"""
    try:
        # Work orders are linked to tasks via task_id
        # Tasks use task_id as PK, not id
        order = db.query(WorkOrder).join(
            Task, WorkOrder.task_id == Task.task_id
        ).filter(
            WorkOrder.id == work_order_id, Task.crop_cycle_id == crop_cycle_id
        ).first()
        if not order:
            raise HTTPException(status_code=404, detail="Work order not found")
        
        db.delete(order)
        db.commit()
        return None
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        import traceback
        print(f"Error deleting work order: {e}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting work order: {str(e)}"
        )


