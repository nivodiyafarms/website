"""
OpenAI Chatbot Service with Function Calling
Handles conversation, creation, and querying using OpenAI GPT-4
"""
import json
from typing import Dict, Any, List, Optional
from datetime import datetime, date
from uuid import UUID
from sqlalchemy.orm import Session

from app.services.openai_service import OpenAIService
from app.services.database_query_service import DatabaseQueryService
from app.models.crop_cycle_incident import CropCycleIncident, CropStage, CropCycleStatus
from app.models.task import Task, TaskStatus
from app.models.work_order import WorkOrder, WorkOrderStatus
from app.models.user import User
from app.utils.id_generator import generate_incident_id, generate_task_id, generate_work_order_id


class OpenAIChatbotService:
    def __init__(self, db: Session):
        self.openai_service = OpenAIService()
        self.db_query_service = DatabaseQueryService(db)
        self.db = db
        
        # Conversation context storage (in-memory, can be moved to Redis/database later)
        self.conversation_contexts: Dict[str, List[Dict[str, str]]] = {}
        self.pending_creations: Dict[str, Dict[str, Any]] = {}
    
    def get_functions(self) -> List[Dict[str, Any]]:
        """Define function schemas for OpenAI function calling"""
        return [
            {
                "name": "create_crop_cycle",
                "description": "Create a new crop cycle. Use this when user wants to create a crop cycle. Ask for missing required fields.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "field_code": {"type": "string", "description": "Field code/ID where crop is planted"},
                        "crop_name": {"type": "string", "description": "Name of the crop (e.g., Wheat, Rice, Cotton)"},
                        "sowing_date": {"type": "string", "description": "Sowing date in YYYY-MM-DD format"},
                        "expected_harvest_date": {"type": "string", "description": "Expected harvest date in YYYY-MM-DD format"},
                        "season": {"type": "string", "description": "Season: Rabi, Kharif, or Zaid"},
                        "crop_variety": {"type": "string", "description": "Crop variety or seed category"},
                        "cultivated_area": {"type": "number", "description": "Area cultivated in acres"},
                        "short_description": {"type": "string", "description": "Short description of the crop cycle"},
                        "description": {"type": "string", "description": "Detailed description"},
                        "current_stage": {"type": "string", "description": "Current stage: sowing, germination, vegetative, flowering, fruiting, harvest, storage, sale, payment"},
                        "supervisor_id": {"type": "string", "description": "UUID of supervisor/user creating this cycle"}
                    },
                    "required": ["field_code", "crop_name", "sowing_date"]
                }
            },
            {
                "name": "create_task",
                "description": "Create a new task for a crop cycle. Use this when user wants to create a task.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "crop_cycle_id": {"type": "string", "description": "UUID of the crop cycle this task belongs to"},
                        "category": {"type": "string", "description": "Task category: sowing, irrigation, fertilizer, harvest, fuel, sale, storage"},
                        "subcategory": {"type": "string", "description": "Task subcategory based on category selected"},
                        "short_description": {"type": "string", "description": "Short description of the task"},
                        "description": {"type": "string", "description": "Detailed description"},
                        "occurred_at": {"type": "string", "description": "When task occurred in ISO format (YYYY-MM-DDTHH:MM:SS)"},
                        "status": {"type": "string", "description": "Task status: new, in_progress, on_hold, resolved, closed, reopened, cancelled"},
                        "cost": {"type": "number", "description": "Total cost of the task"},
                        "created_by": {"type": "string", "description": "UUID of user creating this task"}
                    },
                    "required": ["crop_cycle_id", "category", "short_description"]
                }
            },
            {
                "name": "create_work_order",
                "description": "Create a new work order for a task. Use this when user wants to create a work order.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "task_id": {"type": "string", "description": "UUID of the task this work order belongs to"},
                        "short_description": {"type": "string", "description": "Short description of the work order"},
                        "description": {"type": "string", "description": "Description of the work order"},
                        "due_date": {"type": "string", "description": "Due date in YYYY-MM-DD format"},
                        "assigned_to": {"type": "string", "description": "UUID of user assigned to this work order"},
                        "status": {"type": "string", "description": "Work order status: open, in_progress, completed, partially_complete, cancelled"},
                        "created_by": {"type": "string", "description": "UUID of user creating this work order"}
                    },
                    "required": ["task_id", "short_description"]
                }
            },
            {
                "name": "query_crop_cycles",
                "description": "Query crop cycles by filters. Use this when user asks about crop cycles.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "incident_no": {"type": "string", "description": "Filter by incident number (e.g., IN0001)"},
                        "field_code": {"type": "string", "description": "Filter by field code"},
                        "status": {"type": "string", "description": "Filter by status: open or closed"},
                        "current_stage": {"type": "string", "description": "Filter by current stage"},
                        "crop_name": {"type": "string", "description": "Filter by crop name"},
                        "limit": {"type": "integer", "description": "Maximum number of results (default 50)"}
                    }
                }
            },
            {
                "name": "query_tasks",
                "description": "Query tasks by filters. Use this when user asks about tasks.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "crop_cycle_id": {"type": "string", "description": "Filter by crop cycle UUID"},
                        "incident_no": {"type": "string", "description": "Filter by crop cycle incident number"},
                        "task_no": {"type": "string", "description": "Filter by task number (e.g., TA0001)"},
                        "category": {"type": "string", "description": "Filter by task category"},
                        "status": {"type": "string", "description": "Filter by task status"},
                        "limit": {"type": "integer", "description": "Maximum number of results (default 50)"}
                    }
                }
            },
            {
                "name": "query_work_orders",
                "description": "Query work orders by filters. Use this when user asks about work orders.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "task_id": {"type": "string", "description": "Filter by task UUID"},
                        "work_order_no": {"type": "string", "description": "Filter by work order number (e.g., WO0001)"},
                        "status": {"type": "string", "description": "Filter by work order status"},
                        "limit": {"type": "integer", "description": "Maximum number of results (default 50)"}
                    }
                }
            },
            {
                "name": "get_crop_cycle_details",
                "description": "Get detailed information about a specific crop cycle including tasks and work orders.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "incident_id": {"type": "string", "description": "UUID of the crop cycle"},
                        "incident_no": {"type": "string", "description": "Incident number (e.g., IN0001)"}
                    },
                    "required": []
                }
            },
            {
                "name": "calculate_expenditure",
                "description": "Calculate total expenditure for a crop cycle including all tasks and work orders.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "incident_id": {"type": "string", "description": "UUID of the crop cycle"},
                        "incident_no": {"type": "string", "description": "Incident number (e.g., IN0001)"}
                    },
                    "required": []
                }
            }
        ]
    
    def get_system_prompt(self, language: str = "en") -> str:
        """Get system prompt based on language"""
        if language == "hi":
            return """आप एक किसान सहायक AI हैं जो फार्म प्रबंधन में मदद करते हैं। आप:
1. फसल चक्र (Crop Cycle), कार्य (Task), और कार्य आदेश (Work Order) बना सकते हैं
2. डेटाबेस से जानकारी प्रश्न कर सकते हैं
3. हिंदी और अंग्रेजी दोनों भाषाओं में बात कर सकते हैं

निर्देश:
- यदि उपयोगकर्ता हिंदी में बोलता है, तो हिंदी में जवाब दें
- यदि उपयोगकर्ता अंग्रेजी में बोलता है, तो अंग्रेजी में जवाब दें
- जब कोई चीज़ बनाने के लिए जानकारी गायब हो, तो उसके बारे में पूछें
- डेटाबेस में जानकारी न मिलने पर "क्षमा करें, मुझे डेटाबेस में प्रासंगिक जानकारी नहीं मिली" कहें
- सफल निर्माण के बाद, सभी विवरणों के साथ पुष्टि प्रदान करें"""
        else:
            return """You are an AI assistant helping farmers with farm management. You can:
1. Create crop cycles, tasks, and work orders
2. Query information from the database
3. Speak in both Hindi and English

Instructions:
- If user speaks in Hindi, respond in Hindi
- If user speaks in English, respond in English
- When information is missing to create something, ask about it
- If information is not found in database, say "Sorry, I couldn't find relevant information in the database"
- After successful creation, provide confirmation with all details"""
    
    def chat(
        self,
        user_message: str,
        conversation_id: Optional[str] = None,
        current_user_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """
        Main chat method that processes user message and returns bot response
        
        Returns:
            Dict with bot_message, action_taken, created_item, language
        """
        # Detect language
        language = self.openai_service.detect_language(user_message)
        
        # Get or create conversation context
        if not conversation_id:
            conversation_id = f"conv_{datetime.now().timestamp()}"
        
        if conversation_id not in self.conversation_contexts:
            self.conversation_contexts[conversation_id] = [
                {"role": "system", "content": self.get_system_prompt(language)}
            ]
        
        # Add user message
        self.conversation_contexts[conversation_id].append({
            "role": "user",
            "content": user_message
        })
        
        # Get functions
        functions = self.get_functions()
        
        # Call OpenAI
        response = self.openai_service.chat_completion(
            messages=self.conversation_contexts[conversation_id],
            functions=functions,
            function_call="auto",
            temperature=0.7
        )
        
        # Handle function calls
        action_taken = None
        created_item = None
        bot_message = response.get("content") or ""
        
        # If no content and no function calls, provide default message
        if not bot_message and not response.get("function_calls"):
            bot_message = "I'm here to help! How can I assist you today?"
        
        if response.get("function_calls"):
            for func_call in response["function_calls"]:
                func_name = func_call["name"]
                func_args = json.loads(func_call["arguments"])
                
                # Execute function
                try:
                    func_result = self._execute_function(func_name, func_args, current_user_id)
                    
                    # Add function result to conversation
                    self.conversation_contexts[conversation_id].append({
                        "role": "assistant",
                        "content": bot_message,
                        "tool_calls": [{
                            "id": func_call["id"],
                            "type": "function",
                            "function": {
                                "name": func_name,
                                "arguments": func_call["arguments"]
                            }
                        }]
                    })
                    
                    self.conversation_contexts[conversation_id].append({
                        "role": "tool",
                        "content": json.dumps(func_result),
                        "tool_call_id": func_call["id"]
                    })
                    
                    # Get final response from AI
                    final_response = self.openai_service.chat_completion(
                        messages=self.conversation_contexts[conversation_id],
                        functions=functions,
                        temperature=0.7
                    )
                    
                    bot_message = final_response.get("content") or ""
                    if not bot_message:
                        bot_message = "Operation completed successfully."
                    
                    # Track action
                    if func_name.startswith("create_"):
                        action_taken = "create"
                        created_item = func_result
                    elif func_name.startswith("query_") or func_name.startswith("get_") or func_name.startswith("calculate_"):
                        action_taken = "query"
                    
                except Exception as e:
                    error_msg = f"Error executing {func_name}: {str(e)}"
                    bot_message = error_msg
                    if language == "hi":
                        bot_message = f"त्रुटि: {str(e)}"
        
        # Add bot response to context
        self.conversation_contexts[conversation_id].append({
            "role": "assistant",
            "content": bot_message
        })
        
        return {
            "bot_message": bot_message,
            "action_taken": action_taken,
            "created_item": created_item,
            "language": language,
            "conversation_id": conversation_id
        }
    
    def _execute_function(self, func_name: str, args: Dict[str, Any], current_user_id: Optional[UUID] = None) -> Dict[str, Any]:
        """Execute a function call"""
        if func_name == "create_crop_cycle":
            return self._create_crop_cycle(args, current_user_id)
        elif func_name == "create_task":
            return self._create_task(args, current_user_id)
        elif func_name == "create_work_order":
            return self._create_work_order(args, current_user_id)
        elif func_name == "query_crop_cycles":
            return {"results": self.db_query_service.get_crop_cycles(**args)}
        elif func_name == "query_tasks":
            crop_cycle_id = None
            if args.get("crop_cycle_id"):
                crop_cycle_id = UUID(args["crop_cycle_id"])
            return {"results": self.db_query_service.get_tasks(crop_cycle_id=crop_cycle_id, **{k: v for k, v in args.items() if k != "crop_cycle_id"})}
        elif func_name == "query_work_orders":
            task_id = None
            if args.get("task_id"):
                task_id = UUID(args["task_id"])
            return {"results": self.db_query_service.get_work_orders(task_id=task_id, **{k: v for k, v in args.items() if k != "task_id"})}
        elif func_name == "get_crop_cycle_details":
            incident_id = None
            if args.get("incident_id"):
                incident_id = UUID(args["incident_id"])
            elif args.get("incident_no"):
                cycles = self.db_query_service.get_crop_cycles(incident_no=args["incident_no"], limit=1)
                if cycles:
                    incident_id = UUID(cycles[0]["incident_id"])
            if incident_id:
                return self.db_query_service.get_crop_cycle_summary(incident_id)
            return {"error": "Crop cycle not found"}
        elif func_name == "calculate_expenditure":
            incident_id = None
            if args.get("incident_id"):
                incident_id = UUID(args["incident_id"])
            elif args.get("incident_no"):
                cycles = self.db_query_service.get_crop_cycles(incident_no=args["incident_no"], limit=1)
                if cycles:
                    incident_id = UUID(cycles[0]["incident_id"])
            if incident_id:
                return self.db_query_service.get_crop_cycle_expenditure(incident_id)
            return {"error": "Crop cycle not found"}
        else:
            return {"error": f"Unknown function: {func_name}"}
    
    def _create_crop_cycle(self, args: Dict[str, Any], current_user_id: Optional[UUID] = None) -> Dict[str, Any]:
        """Create a crop cycle"""
        try:
            from app.schemas.crop_cycle_incident import CropCycleIncidentCreate
            from datetime import datetime as dt
            
            # Convert dates
            if args.get("sowing_date"):
                sowing_date = dt.fromisoformat(args["sowing_date"].replace("Z", "+00:00"))
            else:
                return {"error": "sowing_date is required", "missing_fields": ["sowing_date"]}
            
            expected_harvest_date = None
            if args.get("expected_harvest_date"):
                expected_harvest_date = dt.fromisoformat(args["expected_harvest_date"].replace("Z", "+00:00"))
            
            # Get supervisor_id
            supervisor_id = current_user_id
            if args.get("supervisor_id"):
                supervisor_id = UUID(args["supervisor_id"])
            
            if not supervisor_id:
                return {"error": "supervisor_id is required", "missing_fields": ["supervisor_id"]}
            
            # Create schema object
            create_data = CropCycleIncidentCreate(
                field_id=args["field_code"],
                crop_name=args["crop_name"],
                crop_variety=args.get("crop_variety"),
                sowing_date=sowing_date,
                expected_harvest_date=expected_harvest_date,
                current_stage=CropStage(args.get("current_stage", "sowing")),
                status=CropCycleStatus.OPEN,
                supervisor_id=supervisor_id,
                season=args.get("season", "Rabi"),
                short_description=args.get("short_description"),
                description=args.get("description")
            )
            
            # Get current user from database
            user = self.db.query(User).filter(User.id == supervisor_id).first()
            if not user:
                return {"error": "User not found"}
            
            # Create crop cycle
            data_dict = create_data.model_dump(exclude_unset=True)
            data_dict['field_code'] = data_dict.pop('field_id')
            data_dict['created_by'] = data_dict.pop('supervisor_id')
            if 'crop_variety' in data_dict:
                data_dict['seed_category'] = data_dict.pop('crop_variety')
            
            # Convert datetime to date
            if 'sowing_date' in data_dict:
                data_dict['sowing_date'] = data_dict['sowing_date'].date()
            if 'expected_harvest_date' in data_dict:
                data_dict['expected_harvest_date'] = data_dict['expected_harvest_date'].date()
            
            # Ensure season
            if 'season' not in data_dict or not data_dict['season']:
                from datetime import date
                month = date.today().month
                if month in [10, 11, 12, 1, 2, 3]:
                    data_dict['season'] = 'Rabi'
                elif month in [4, 5, 6]:
                    data_dict['season'] = 'Zaid'
                else:
                    data_dict['season'] = 'Kharif'
            
            # Generate incident ID
            data_dict['incident_no'] = generate_incident_id(self.db)
            
            # Create model instance
            crop_cycle = CropCycleIncident(**{k: v for k, v in data_dict.items() if k not in ['notes', 'incident_id', 'opened_at', 'updated_at', 'closed_at']})
            self.db.add(crop_cycle)
            self.db.commit()
            self.db.refresh(crop_cycle)
            
            return {
                "success": True,
                "incident_id": str(crop_cycle.id),
                "incident_no": crop_cycle.incident_no,
                "field_code": crop_cycle.field_code,
                "crop_name": crop_cycle.crop_name,
                "message": f"Crop cycle created successfully with ID {crop_cycle.incident_no}"
            }
            
        except Exception as e:
            return {"error": str(e), "success": False}
    
    def _create_task(self, args: Dict[str, Any], current_user_id: Optional[UUID] = None) -> Dict[str, Any]:
        """Create a task"""
        try:
            from datetime import datetime as dt
            crop_cycle_id = UUID(args["crop_cycle_id"])
            
            # Get created_by
            created_by = current_user_id
            if args.get("created_by"):
                created_by = UUID(args["created_by"])
            
            if not created_by:
                created_by = current_user_id
            
            # Create task
            # Note: Task model doesn't have occurred_at, cost, task_no, or created_by fields
            # Use: task_id (PK), category, subcategory, assigned_to_id, created_by_id, total_expense
            task = Task(
                crop_cycle_id=crop_cycle_id,
                category=args.get("category", "other"),
                subcategory=args.get("subcategory", "other"),
                short_description=args["short_description"],
                description=args.get("description"),
                assigned_to_id=args.get("assigned_to_id", created_by),  # Required field
                created_by_id=created_by,  # Use created_by_id (Task model field)
                status=TaskStatus(args.get("status", "new")),  # Convert to enum
                total_expense=args.get("cost", 0)  # Use total_expense instead of cost
            )
            
            self.db.add(task)
            self.db.commit()
            self.db.refresh(task)
            
            return {
                "success": True,
                "task_id": str(task.task_id),  # Use task_id (primary key)
                "task_no": None,  # Task model doesn't have task_no field
                "crop_cycle_id": str(crop_cycle_id),
                "message": f"Task created successfully with ID {task.task_id}"
            }
            
        except Exception as e:
            return {"error": str(e), "success": False}
    
    def _create_work_order(self, args: Dict[str, Any], current_user_id: Optional[UUID] = None) -> Dict[str, Any]:
        """Create a work order"""
        try:
            from datetime import date as date_type
            
            task_id = UUID(args["task_id"])
            
            # Get created_by and assigned_to
            created_by = current_user_id
            if args.get("created_by"):
                created_by = UUID(args["created_by"])
            
            assigned_to = None
            if args.get("assigned_to"):
                assigned_to = UUID(args["assigned_to"])
            
            # Convert due_date
            due_date = None
            if args.get("due_date"):
                due_date = date_type.fromisoformat(args["due_date"])
            
            # Create work order
            work_order = WorkOrder(
                task_id=task_id,
                short_description=args["short_description"],
                description=args.get("description"),
                due_date=due_date,
                assigned_to=assigned_to,
                created_by=created_by,
                status=args.get("status", "open")
            )
            
            # Generate work order ID
            work_order.work_order_number = generate_work_order_id(self.db)
            
            self.db.add(work_order)
            self.db.commit()
            self.db.refresh(work_order)
            
            return {
                "success": True,
                "work_order_id": str(work_order.work_order_id),
                "work_order_number": work_order.work_order_number,
                "task_id": str(task_id),
                "message": f"Work order created successfully with ID {work_order.work_order_number}"
            }
            
        except Exception as e:
            return {"error": str(e), "success": False}
    
    def clear_context(self, conversation_id: str):
        """Clear conversation context"""
        if conversation_id in self.conversation_contexts:
            del self.conversation_contexts[conversation_id]
        if conversation_id in self.pending_creations:
            del self.pending_creations[conversation_id]

