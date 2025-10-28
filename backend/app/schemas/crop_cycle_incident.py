from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
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
    short_description: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None


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
    closed_at: Optional[datetime]
    is_voice_recorded: str
    audio_file_path: Optional[str]
    transcript: Optional[str]
    
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
    task_type: TaskType
    short_description: str
    description: Optional[str] = None
    assigned_to_id: UUID
    occurred_at: Optional[datetime] = None
    labor_count: Optional[int] = None
    labor_hours: Optional[float] = None
    outcome_observation: Optional[str] = None
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None


class TaskCreate(TaskBase):
    crop_cycle_id: UUID
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
    title: str
    description: str
    instructions: Optional[str] = None
    assigned_to_id: UUID
    due_date: Optional[datetime] = None


class WorkOrderCreate(WorkOrderBase):
    crop_cycle_id: UUID


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


