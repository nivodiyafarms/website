"""
Chatbot Schemas for Work Order and Task Creation
"""
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from uuid import UUID
from datetime import datetime
from app.models.task import TaskType, ResourceType
from app.models.work_order import WorkOrderStatus


# ============ Request Schemas ============

class WorkOrderParseRequest(BaseModel):
    user_input: str = Field(..., description="User's natural language input")
    crop_cycle_id: UUID = Field(..., description="Crop cycle ID")
    existing_data: Optional[Dict[str, Any]] = Field(None, description="Existing form data for conversation memory")


class TaskParseRequest(BaseModel):
    user_input: str = Field(..., description="User's natural language input")
    crop_cycle_id: UUID = Field(..., description="Crop cycle ID")
    existing_data: Optional[Dict[str, Any]] = Field(None, description="Existing form data for conversation memory")


class WorkOrderPreviewRequest(BaseModel):
    form_data: Dict[str, Any] = Field(..., description="Work order form data")
    crop_cycle_id: UUID = Field(..., description="Crop cycle ID")


class TaskPreviewRequest(BaseModel):
    form_data: Dict[str, Any] = Field(..., description="Task form data")
    crop_cycle_id: UUID = Field(..., description="Crop cycle ID")


class WorkOrderCreateFromChatbotRequest(BaseModel):
    form_data: Dict[str, Any] = Field(..., description="Work order form data")
    crop_cycle_id: UUID = Field(..., description="Crop cycle ID")


class TaskCreateFromChatbotRequest(BaseModel):
    form_data: Dict[str, Any] = Field(..., description="Task form data")
    crop_cycle_id: UUID = Field(..., description="Crop cycle ID")


# ============ Response Schemas ============

class WorkOrderParseResponse(BaseModel):
    parsed_data: Dict[str, Any] = Field(..., description="Parsed work order data")
    follow_up_question: Optional[str] = Field(None, description="Follow-up question if data incomplete")
    is_complete: bool = Field(..., description="Whether all required fields are filled")


class TaskParseResponse(BaseModel):
    parsed_data: Dict[str, Any] = Field(..., description="Parsed task data")
    follow_up_question: Optional[str] = Field(None, description="Follow-up question if data incomplete")
    is_complete: bool = Field(..., description="Whether all required fields are filled")


class FormPreviewResponse(BaseModel):
    form_type: str = Field(..., description="Type of form (work_order or task)")
    preview: str = Field(..., description="Human-readable form preview")
    form_data: Dict[str, Any] = Field(..., description="Form data")


class WorkOrderCreateResponse(BaseModel):
    success: bool = Field(..., description="Whether creation was successful")
    work_order_id: UUID = Field(..., description="Created work order ID")
    message: str = Field(..., description="Success message")


class TaskCreateResponse(BaseModel):
    success: bool = Field(..., description="Whether creation was successful")
    task_id: UUID = Field(..., description="Created task ID")
    message: str = Field(..., description="Success message")


# ============ Chat Message Schemas ============

class ChatMessage(BaseModel):
    id: str = Field(..., description="Unique message ID")
    type: str = Field(..., description="Message type: user, bot, system")
    content: str = Field(..., description="Message content")
    timestamp: datetime = Field(..., description="Message timestamp")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional message metadata")


class ChatSession(BaseModel):
    session_id: str = Field(..., description="Unique session ID")
    form_type: str = Field(..., description="Type of form being created")
    crop_cycle_id: UUID = Field(..., description="Crop cycle ID")
    messages: List[ChatMessage] = Field(default_factory=list, description="Chat messages")
    current_form_data: Dict[str, Any] = Field(default_factory=dict, description="Current form data")
    is_complete: bool = Field(default=False, description="Whether form is complete")
    created_at: datetime = Field(..., description="Session creation time")
    updated_at: datetime = Field(..., description="Last update time")


# ============ Voice Input Schemas ============

class VoiceInputRequest(BaseModel):
    audio_file_path: str = Field(..., description="Path to audio file")
    form_type: str = Field(..., description="Type of form (work_order or task)")
    crop_cycle_id: UUID = Field(..., description="Crop cycle ID")
    language: str = Field(default="auto", description="Language code for transcription")


class VoiceInputResponse(BaseModel):
    transcript: str = Field(..., description="Transcribed text")
    parsed_data: Dict[str, Any] = Field(..., description="Parsed form data")
    follow_up_question: Optional[str] = Field(None, description="Follow-up question if data incomplete")
    is_complete: bool = Field(..., description="Whether all required fields are filled")


# ============ Form Field Schemas ============

class FormField(BaseModel):
    name: str = Field(..., description="Field name")
    label: str = Field(..., description="Human-readable label")
    type: str = Field(..., description="Field type (text, select, date, etc.)")
    required: bool = Field(..., description="Whether field is required")
    value: Optional[Any] = Field(None, description="Current field value")
    options: Optional[List[Dict[str, Any]]] = Field(None, description="Options for select fields")
    placeholder: Optional[str] = Field(None, description="Placeholder text")


class FormSchema(BaseModel):
    form_type: str = Field(..., description="Type of form")
    fields: List[FormField] = Field(..., description="Form fields")
    title: str = Field(..., description="Form title")
    description: str = Field(..., description="Form description")


# ============ Validation Schemas ============

class FormValidationRequest(BaseModel):
    form_type: str = Field(..., description="Type of form")
    form_data: Dict[str, Any] = Field(..., description="Form data to validate")


class FormValidationResponse(BaseModel):
    is_valid: bool = Field(..., description="Whether form is valid")
    errors: List[str] = Field(default_factory=list, description="Validation errors")
    missing_fields: List[str] = Field(default_factory=list, description="Missing required fields")
    suggestions: List[str] = Field(default_factory=list, description="Suggestions for improvement")
