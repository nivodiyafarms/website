from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID
from app.models.crop_cycle_incident import CropStage, CropCycleStatus
from app.models.task import TaskType, TaskStatus, SeverityLevel, ResourceType
from app.models.work_order import WorkOrderStatus


# ============ Crop Cycle Schemas ============

class CropCycleIncidentBase(BaseModel):
    field_id: str
    crop_name: str
    crop_variety: Optional[str] = None
    sowing_date: datetime
    expected_harvest_date: Optional[datetime] = None
    current_stage: CropStage = CropStage.SOWING
    status: CropCycleStatus = CropCycleStatus.OPEN
    supervisor_id: UUID
    season: Optional[str] = None  # Added to match model requirement
    short_description: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None  # This will be read from description via property


class CropCycleIncidentCreate(CropCycleIncidentBase):
    pass


class CropCycleIncidentUpdate(BaseModel):
    field_id: Optional[str] = None
    crop_name: Optional[str] = None
    crop_variety: Optional[str] = None
    sowing_date: Optional[datetime] = None
    expected_harvest_date: Optional[datetime] = None
    current_stage: Optional[CropStage] = None
    status: Optional[CropCycleStatus] = None
    supervisor_id: Optional[UUID] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None


class CropCycleIncidentResponse(CropCycleIncidentBase):
    incident_id: UUID
    opened_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime] = None
    is_voice_recorded: str = "no"
    audio_file_path: Optional[str] = None
    transcript: Optional[str] = None
    
    @field_validator('sowing_date', 'expected_harvest_date', mode='before')
    @classmethod
    def convert_date_to_datetime(cls, v):
        """Convert Date to datetime for response"""
        if v is None:
            return None
        if isinstance(v, date) and not isinstance(v, datetime):
            return datetime.combine(v, datetime.min.time())
        return v
    
    @field_validator('opened_at', 'updated_at', 'closed_at', mode='before')
    @classmethod
    def convert_datetime_fields(cls, v):
        """Ensure datetime fields are datetime objects"""
        if v is None:
            return None
        if isinstance(v, date) and not isinstance(v, datetime):
            return datetime.combine(v, datetime.min.time())
        return v
    
    class Config:
        from_attributes = True


# ============ Task Resource Schemas ============

class TaskResourceBase(BaseModel):
    resource_type: ResourceType
    name: str
    quantity: float
    unit: str
    cost_per_unit: Optional[float] = None
    total_cost: float


class TaskResourceCreate(TaskResourceBase):
    pass


class TaskResourceResponse(TaskResourceBase):
    resource_id: UUID
    task_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============ Task (Child Incident) Schemas ============

class TaskBase(BaseModel):
    task_type: TaskType  # Required - database constraint: type NOT NULL
    short_description: Optional[str] = None  # Optional - database allows NULL
    description: Optional[str] = None
    assigned_to_id: Optional[UUID] = None  # Optional - Task model doesn't have this field
    occurred_at: Optional[datetime] = None
    labor_count: Optional[int] = None
    labor_hours: Optional[float] = None
    outcome_observation: Optional[str] = None
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None


class TaskCreate(TaskBase):
    crop_cycle_id: Optional[UUID] = None  # Optional - comes from URL path parameter
    resources: List[TaskResourceCreate] = []


class TaskUpdate(BaseModel):
    task_type: Optional[TaskType] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    assigned_to_id: Optional[UUID] = None
    occurred_at: Optional[datetime] = None
    labor_count: Optional[int] = None
    labor_hours: Optional[float] = None
    outcome_observation: Optional[str] = None
    status: Optional[TaskStatus] = None
    on_hold_reason: Optional[str] = None
    resolution_notes: Optional[str] = None
    approved_by_id: Optional[UUID] = None
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None


class TaskResponse(TaskBase):
    task_id: UUID
    crop_cycle_id: UUID
    created_by_id: UUID
    approved_by_id: Optional[UUID]
    total_cost: float
    severity: Optional[SeverityLevel]
    status: TaskStatus
    on_hold_reason: Optional[str]
    resolution_notes: Optional[str]
    attachments: Optional[str]
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime]
    is_voice_recorded: str
    audio_file_path: Optional[str]
    transcript: Optional[str]
    resources: List[TaskResourceResponse] = []
    
    class Config:
        from_attributes = True


# ============ Work Order Schemas ============

class WorkOrderBase(BaseModel):
    title: str  # Required - database constraint: title NOT NULL
    description: Optional[str] = None  # Optional - database allows NULL
    instructions: Optional[str] = None  # Not in database, kept for compatibility
    assigned_to_id: Optional[UUID] = None  # Optional - maps to assigned_to in database
    due_date: Optional[datetime] = None


class WorkOrderCreate(WorkOrderBase):
    crop_cycle_id: Optional[UUID] = None  # For frontend convenience (from URL path)
    task_id: Optional[UUID] = None  # Direct link to task (if provided, will be used)


class WorkOrderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    assigned_to_id: Optional[UUID] = None
    due_date: Optional[datetime] = None
    status: Optional[WorkOrderStatus] = None
    linked_task_ids: Optional[str] = None


class WorkOrderResponse(WorkOrderBase):
    work_order_id: UUID
    crop_cycle_id: UUID
    created_by_id: UUID
    status: WorkOrderStatus
    linked_task_ids: Optional[str]
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# ============ Voice Recording Schemas for Tasks ============

class VoiceTaskData(BaseModel):
    task_type: Optional[TaskType] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    labor_count: Optional[int] = None
    labor_hours: Optional[float] = None
    outcome_observation: Optional[str] = None


class VoiceTaskPreview(BaseModel):
    transcript: str
    extracted_data: VoiceTaskData
    audio_file_path: str


class VoiceTaskConfirm(BaseModel):
    crop_cycle_id: UUID
    audio_file_path: str
    transcript: str
    extracted_data: TaskCreate


