"""
Chatbot API for Work Order and Task Creation
Handles conversation flow and form data extraction
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
import json
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from uuid import UUID
import os
import uuid as uuid_lib

from app.database import get_db
from app.auth.security import get_current_user
from app.models.user import User
from app.services.chatbot_service import ChatbotService
from app.services.groq_service import GroqService
from app.schemas.chatbot import *

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot"])

# Directory for storing audio files
AUDIO_DIR = "uploads/audio"
os.makedirs(AUDIO_DIR, exist_ok=True)


@router.post("/work-order/parse", response_model=WorkOrderParseResponse)
def parse_work_order_input(
    request: WorkOrderParseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Parse user input for work order creation with conversation memory"""
    try:
        try:
            chatbot_service = ChatbotService()
        except ValueError as ve:
            # Likely GROQ_API_KEY missing/invalid
            raise HTTPException(status_code=400, detail=f"Chatbot unavailable: {str(ve)}")
        
        # Get available users for context
        users = db.query(User).all()
        users_context = [
            {
                "user_id": str(user.user_id),
                "name": user.name,
                "role": user.role
            }
            for user in users
        ]
        
        # Parse the input with existing data
        parsed_data = chatbot_service.parse_work_order_input(
            user_input=request.user_input,
            context={
                "crop_cycle_id": str(request.crop_cycle_id),
                "available_users": users_context
            },
            existing_data=request.existing_data
        )
        
        # Generate follow-up question if needed
        follow_up_question = None
        if not parsed_data["is_complete"]:
            follow_up_question = chatbot_service.generate_follow_up_questions(
                form_type="work_order",
                missing_fields=parsed_data["missing_fields"],
                existing_data=parsed_data
            )
        
        return WorkOrderParseResponse(
            parsed_data=parsed_data,
            follow_up_question=follow_up_question,
            is_complete=parsed_data["is_complete"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        # Safe fallback so UI doesn't break completely
        return WorkOrderParseResponse(
            parsed_data={
                "title": None,
                "description": None,
                "instructions": None,
                "assigned_to_id": None,
                "due_date": None,
                "missing_fields": ["title", "description", "assigned_to_id", "due_date"],
                "is_complete": False
            },
            follow_up_question="Please provide title, description, assignee and due date.",
            is_complete=False
        )


@router.post("/task/parse", response_model=TaskParseResponse)
def parse_task_input(
    request: TaskParseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Parse user input for task creation with conversation memory"""
    try:
        try:
            chatbot_service = ChatbotService()
        except ValueError as ve:
            raise HTTPException(status_code=400, detail=f"Chatbot unavailable: {str(ve)}")
        
        # Get available users for context
        users = db.query(User).all()
        users_context = [
            {
                "user_id": str(user.user_id),
                "name": user.name,
                "role": user.role
            }
            for user in users
        ]
        
        # Parse the input with existing data
        parsed_data = chatbot_service.parse_task_input(
            user_input=request.user_input,
            context={
                "crop_cycle_id": str(request.crop_cycle_id),
                "available_users": users_context
            },
            existing_data=request.existing_data
        )
        
        # Generate follow-up question if needed
        follow_up_question = None
        if not parsed_data["is_complete"]:
            follow_up_question = chatbot_service.generate_follow_up_questions(
                form_type="task",
                missing_fields=parsed_data["missing_fields"],
                existing_data=parsed_data
            )
        
        return TaskParseResponse(
            parsed_data=parsed_data,
            follow_up_question=follow_up_question,
            is_complete=parsed_data["is_complete"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        return TaskParseResponse(
            parsed_data={
                "task_type": None,
                "short_description": None,
                "description": None,
                "assigned_to_id": None,
                "occurred_at": None,
                "resources": [],
                "missing_fields": ["task_type", "short_description", "assigned_to_id", "occurred_at"],
                "is_complete": False
            },
            follow_up_question="Please provide task type, a short description, assignee, and when it occurred.",
            is_complete=False
        )


@router.post("/work-order/preview", response_model=FormPreviewResponse)
def preview_work_order(
    request: WorkOrderPreviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate preview of work order form"""
    try:
        chatbot_service = ChatbotService()
        
        # Get available users for context
        users = db.query(User).all()
        users_context = [
            {
                "user_id": str(user.user_id),
                "name": user.name,
                "role": user.role
            }
            for user in users
        ]
        
        # Generate preview
        preview = chatbot_service.generate_form_preview(
            form_type="work_order",
            data=request.form_data,
            users=users_context
        )
        
        return FormPreviewResponse(
            form_type="work_order",
            preview=preview,
            form_data=request.form_data
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating preview: {str(e)}")


@router.post("/task/preview", response_model=FormPreviewResponse)
def preview_task(
    request: TaskPreviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate preview of task form"""
    try:
        chatbot_service = ChatbotService()
        
        # Get available users for context
        users = db.query(User).all()
        users_context = [
            {
                "user_id": str(user.user_id),
                "name": user.name,
                "role": user.role
            }
            for user in users
        ]
        
        # Generate preview
        preview = chatbot_service.generate_form_preview(
            form_type="task",
            data=request.form_data,
            users=users_context
        )
        
        return FormPreviewResponse(
            form_type="task",
            preview=preview,
            form_data=request.form_data
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating preview: {str(e)}")


@router.post("/work-order/create", response_model=WorkOrderCreateResponse)
def create_work_order_from_chatbot(
    request: WorkOrderCreateFromChatbotRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create work order from chatbot data"""
    try:
        from app.models.work_order import WorkOrder
        from app.models.crop_cycle_incident import CropCycleIncident
        
        # Verify crop cycle exists
        cycle = db.query(CropCycleIncident).filter(
            CropCycleIncident.incident_id == request.crop_cycle_id
        ).first()
        if not cycle:
            raise HTTPException(status_code=404, detail="Crop cycle not found")
        
        # Create work order
        work_order_data = request.form_data
        work_order = WorkOrder(
            crop_cycle_id=request.crop_cycle_id,
            title=work_order_data["title"],
            description=work_order_data["description"],
            instructions=work_order_data.get("instructions"),
            assigned_to_id=work_order_data["assigned_to_id"],
            due_date=work_order_data.get("due_date"),
            created_by_id=current_user.user_id
        )
        
        db.add(work_order)
        db.commit()
        db.refresh(work_order)
        
        return WorkOrderCreateResponse(
            success=True,
            work_order_id=work_order.work_order_id,
            message="Work order created successfully"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating work order: {str(e)}")


@router.post("/task/create", response_model=TaskCreateResponse)
def create_task_from_chatbot(
    request: TaskCreateFromChatbotRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create task from chatbot data"""
    try:
        from app.models.task import Task, TaskResource
        from app.models.crop_cycle_incident import CropCycleIncident
        
        # Verify crop cycle exists
        cycle = db.query(CropCycleIncident).filter(
            CropCycleIncident.incident_id == request.crop_cycle_id
        ).first()
        if not cycle:
            raise HTTPException(status_code=404, detail="Crop cycle not found")
        
        # Create task
        task_data = request.form_data
        task = Task(
            crop_cycle_id=request.crop_cycle_id,
            task_type=task_data["task_type"],
            short_description=task_data["short_description"],
            description=task_data.get("description"),
            assigned_to_id=task_data["assigned_to_id"],
            occurred_at=task_data.get("occurred_at"),
            labor_count=task_data.get("labor_count"),
            labor_hours=task_data.get("labor_hours"),
            outcome_observation=task_data.get("outcome_observation"),
            gps_lat=task_data.get("gps_lat"),
            gps_lng=task_data.get("gps_lng"),
            created_by_id=current_user.user_id
        )
        
        # Calculate total cost from resources
        total_cost = sum(r.get("total_cost", 0) for r in task_data.get("resources", []))
        task.total_cost = total_cost
        
        db.add(task)
        db.flush()
        
        # Add resources
        for resource_data in task_data.get("resources", []):
            resource = TaskResource(
                task_id=task.task_id,
                resource_type=resource_data["resource_type"],
                name=resource_data["name"],
                quantity=resource_data["quantity"],
                unit=resource_data["unit"],
                cost_per_unit=resource_data["cost_per_unit"],
                total_cost=resource_data["total_cost"]
            )
            db.add(resource)
        
        db.commit()
        db.refresh(task)
        
        return TaskCreateResponse(
            success=True,
            task_id=task.task_id,
            message="Task created successfully"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating task: {str(e)}")


@router.post("/voice/process", response_model=VoiceInputResponse)
async def process_voice_input(
    audio: UploadFile = File(...),
    form_type: str = Form(...),
    crop_cycle_id: UUID = Form(...),
    language: str = Form("auto"),
    existing_data: str = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Process voice input for form creation"""
    try:
        # Save audio file
        audio_id = str(uuid_lib.uuid4())
        audio_extension = audio.filename.split('.')[-1] if '.' in audio.filename else 'wav'
        audio_filename = f"{audio_id}.{audio_extension}"
        audio_path = os.path.join(AUDIO_DIR, audio_filename)
        
        with open(audio_path, "wb") as buffer:
            content = await audio.read()
            buffer.write(content)
        
        # Transcribe audio
        transcript = "Error: Voice transcription not available."
        try:
            try:
                groq_service = GroqService()
            except ValueError as ve:
                # GROQ_API_KEY missing/invalid → return 400
                raise HTTPException(status_code=400, detail=str(ve))
            transcript = groq_service.transcribe_audio(audio_path, language)
        except HTTPException:
            raise
        except Exception as transcribe_error:
            # Transcription failed for other reasons → use safe fallback message
            transcript = "Voice audio transcription failed. Please type your message instead."
        
        # Parse the transcript
        try:
            chatbot_service = ChatbotService()
        except ValueError as ve:
            raise HTTPException(status_code=400, detail=f"Chatbot unavailable: {str(ve)}")
        
        # Get available users for context
        users = db.query(User).all()
        users_context = [
            {
                "user_id": str(user.user_id),
                "name": user.name,
                "role": user.role
            }
            for user in users
        ]
        
        # Get existing data from form
        existing_data_dict = {}
        if existing_data:
            try:
                existing_data_dict = json.loads(existing_data)
            except Exception:
                existing_data_dict = {}
        
        # Parse based on form type
        if form_type == "work_order":
            parsed_data = chatbot_service.parse_work_order_input(
                user_input=transcript,
                context={
                    "crop_cycle_id": str(crop_cycle_id),
                    "available_users": users_context
                },
                existing_data=existing_data_dict
            )
        elif form_type == "task":
            parsed_data = chatbot_service.parse_task_input(
                user_input=transcript,
                context={
                    "crop_cycle_id": str(crop_cycle_id),
                    "available_users": users_context
                },
                existing_data=existing_data_dict
            )
        else:
            raise HTTPException(status_code=400, detail="Invalid form type")
        
        # Generate follow-up question if needed
        follow_up_question = None
        try:
            if not parsed_data["is_complete"]:
                follow_up_question = chatbot_service.generate_follow_up_questions(
                    form_type=form_type,
                    missing_fields=parsed_data["missing_fields"],
                    existing_data=parsed_data
                )
        except HTTPException:
            raise
        except Exception:
            follow_up_question = "Please provide the missing information."
        
        # Clean up audio file
        try:
            os.remove(audio_path)
        except:
            pass
        
        return VoiceInputResponse(
            transcript=transcript,
            parsed_data=parsed_data,
            follow_up_question=follow_up_question,
            is_complete=parsed_data["is_complete"]
        )
        
    except Exception as e:
        # Clean up audio file on error
        try:
            if 'audio_path' in locals():
                os.remove(audio_path)
        except:
            pass
        raise HTTPException(status_code=500, detail=f"Error processing voice input: {str(e)}")
