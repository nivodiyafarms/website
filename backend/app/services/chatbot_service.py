"""
Chatbot Service for Work Order and Task Creation
Handles conversation flow and form data extraction using LLM
"""
import json
from typing import Dict, Any, List, Optional, Tuple
from groq import Groq
from app.core.config import settings
from app.models.task import ResourceType
from app.models.work_order import WorkOrderStatus
from datetime import datetime, timedelta


class ChatbotService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        if not self.api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        
        self.client = Groq(api_key=self.api_key)
        self.llm_model = "llama-3.3-70b-versatile"
        
        # Available task categories and resource types for validation
        self.task_categories = ["sowing", "irrigation", "fertilizer", "harvest", "fuel", "sale", "storage"]
        self.resource_types = [t.value for t in ResourceType]
        self.work_order_statuses = [s.value for s in WorkOrderStatus]
    
    def parse_work_order_input(self, user_input: str, context: Dict[str, Any] = None, existing_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Parse user input to extract work order information with conversation memory
        """
        # Merge existing data with new input
        current_data = existing_data or {}
        
        system_prompt = """You are an AI assistant helping farmers create work orders for farm management.
        
Extract structured work order information from the user's natural language input. The user may speak in Hindi or English.

Extract the following information:
- title: Original user text (keep as-is, Hindi or English)
- description: Original user text (keep as-is, Hindi or English)
- instructions: Original user text (keep as-is, Hindi or English)
- assigned_to_id: User ID from available users if name mentioned
- due_date: When work should be completed (YYYY-MM-DD, calculate relative dates)

Guidelines:
- Keep user's original language - DO NOT translate
- If information missing, set null
- For due_date: if user says "tomorrow", "next week", "in 3 days", calculate actual date
- ONLY extract NEW information from current message
- If user updates existing info, use new value

Return ONLY valid JSON. Use null for missing fields."""

        user_prompt = f"""User input: "{user_input}"

Current form data: {json.dumps(current_data, indent=2)}
Context: {json.dumps(context or {}, indent=2)}

Extract ONLY NEW work order information from the user input and return as JSON. Do not repeat existing data."""

        try:
            response = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model=self.llm_model,
                temperature=0.1,
                max_tokens=1000,
                response_format={"type": "json_object"}
            )
            
            extracted_data = json.loads(response.choices[0].message.content)
            
            # Merge with existing data
            merged_data = {**current_data, **extracted_data}
            # DEFAULT missing due_date to today (YYYY-MM-DD)
            if not merged_data.get("due_date"):
                from datetime import datetime
                merged_data["due_date"] = datetime.now().date().isoformat()
            merged_data = self._normalize_work_order_fields(merged_data, user_input=user_input, context=context or {}) if hasattr(self, '_normalize_work_order_fields') else merged_data
            return self._validate_work_order_data(merged_data)
            
        except Exception as e:
            raise Exception(f"Error parsing work order input: {str(e)}")
    
    def parse_task_input(self, user_input: str, context: Dict[str, Any] = None, existing_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Parse user input to extract task information with conversation memory
        """
        # Merge existing data with new input
        current_data = existing_data or {}
        
        system_prompt = f"""You are an AI assistant helping farmers create tasks for farm management.
        
Extract structured task information from the user's natural language input. The user may speak in Hindi or English.

Available task types: {', '.join(self.task_types)}

Extract the following information:
- task_type: One of: IRRIGATION, FERTILIZER, PESTICIDE, FUNGICIDE, HERBICIDE, WEEDING, LABOR, SPRAY, SCOUTING, TRANSPORT, HARVEST, STORAGE_IN, STORAGE_OUT, SALE, PAYMENT, OTHER
  * Recognize Hindi words: "इरिगेशन/इरीगेशन/सिंचाई" → IRRIGATION, "खाद" → FERTILIZER, "निंदाई" → WEEDING
- short_description: Original user text (keep as-is, Hindi or English)
- description: Original user text (keep as-is, Hindi or English)
- assigned_to_id: User ID from available_users list if name mentioned
- occurred_at: When occurred (YYYY-MM-DDTHH:MM:SS, calculate relative dates)

Guidelines:
- Keep user's original language (Hindi or English) - DO NOT translate
- If information missing, set null
- Task type MUST match available types exactly
- For assigned_to_id: find name in available_users and return user_id
- ONLY extract NEW information from current message
- If user updates existing info, use new value

Return ONLY valid JSON. Use null for missing fields."""

        user_prompt = f"""User input: "{user_input}"

Current form data: {json.dumps(current_data, indent=2)}
Context: {json.dumps(context or {}, indent=2)}

Extract ONLY NEW task information from the user input and return as JSON. Do not repeat existing data."""

        try:
            response = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model=self.llm_model,
                temperature=0.1,
                max_tokens=1500,
                response_format={"type": "json_object"}
            )
            
            extracted_data = json.loads(response.choices[0].message.content)
            
            # Merge with existing data, special handling for resources
            merged_data = {**current_data, **extracted_data}

            # DEFAULT missing occurred_at to now (YYYY-MM-DDTHH:MM:SS)
            if not merged_data.get("occurred_at"):
                from datetime import datetime
                merged_data["occurred_at"] = datetime.now().replace(microsecond=0).isoformat()

            # Heuristic normalization for Hindi/variants and user mapping
            merged_data = self._normalize_task_fields(
                merged_data,
                user_input=user_input,
                context=context or {}
            )
            
            # Merge resources arrays if both exist
            if current_data.get('resources') and extracted_data.get('resources'):
                merged_data['resources'] = current_data['resources'] + extracted_data['resources']
            elif current_data.get('resources'):
                merged_data['resources'] = current_data['resources']
            elif extracted_data.get('resources'):
                merged_data['resources'] = extracted_data['resources']
            
            return self._validate_task_data(merged_data)
            
        except Exception as e:
            raise Exception(f"Error parsing task input: {str(e)}")
    
    def generate_follow_up_questions(self, form_type: str, missing_fields: List[str], context: Dict[str, Any] = None, existing_data: Dict[str, Any] = None) -> str:
        """
        Generate smart follow-up questions for missing required fields
        """
        if form_type == "work_order":
            field_questions = {
                "title": "What would you like to call this work order?",
                "description": "Can you describe what needs to be done?",
                "assigned_to_id": "Who should this work order be assigned to?",
                "due_date": "When should this work be completed?"
            }
        elif form_type == "task":
            field_questions = {
                "task_type": "What type of task is this? (e.g., irrigation, fertilizer, weeding, etc.)",
                "short_description": "What is this task about?",
                "assigned_to_id": "Who performed this task?",
                "occurred_at": "When did this task occur?",
                "resources": "What resources were used? (materials, equipment, labor, etc.)"
            }
        else:
            return "Please provide more details to complete the form."
        
        # Filter out fields that already have some data
        truly_missing = []
        for field in missing_fields:
            if field in field_questions:
                # Check if field is truly empty
                if not existing_data or not existing_data.get(field):
                    truly_missing.append(field)
        
        if not truly_missing:
            return "Great! I have all the information I need. Let me show you a preview of the form."
        
        # Generate contextual questions based on what's already provided
        questions = []
        for field in truly_missing:
            if field in field_questions:
                questions.append(field_questions[field])
        
        if not questions:
            return "Is there anything else you'd like to add or modify?"
        
        # Generate a more natural conversation flow
        if len(questions) == 1:
            return questions[0]
        elif len(questions) == 2:
            return f"{questions[0]} Also, {questions[1].lower()}"
        else:
            return f"{questions[0]} Also, {questions[1].lower()} And {questions[2].lower()}"
    
    def _validate_work_order_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and clean work order data (bilingual-friendly, all fields required)"""
        required_fields = ["title", "description", "instructions", "assigned_to_id", "due_date"]
        missing_fields = []
        # Must be bilingual objects {en, hi} for text fields.
        def ensure_bilingual(val):
            if isinstance(val, dict) and "en" in val and "hi" in val:
                return val
            elif isinstance(val, dict) and ("en" in val or "hi" in val):
                en = val.get("en", "") or val.get("hi", "")
                hi = val.get("hi", "") or val.get("en", "")
                return {"en": en, "hi": hi}
            elif isinstance(val, str):
                return {"en": val, "hi": val}
            else:
                return {"en": "", "hi": ""}
        # Check required fields
        for field in required_fields:
            v = data.get(field)
            if not v:
                missing_fields.append(field)
        cleaned_data = {
            "title": data.get("title"),
            "description": data.get("description"),
            "instructions": data.get("instructions"),
            "assigned_to_id": data.get("assigned_to_id"),
            "due_date": data.get("due_date"),
            "missing_fields": missing_fields,
            "is_complete": len(missing_fields) == 0
        }
        return cleaned_data
    
    def _validate_task_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and clean task data (bilingual-friendly/all-fields)"""
        required_fields = ["task_type", "short_description", "description", "assigned_to_id", "occurred_at"]
        missing_fields = []
        def ensure_bilingual(val):
            if isinstance(val, dict) and "en" in val and "hi" in val:
                return val
            elif isinstance(val, dict) and ("en" in val or "hi" in val):
                en = val.get("en", "") or val.get("hi", "")
                hi = val.get("hi", "") or val.get("en", "")
                return {"en": en, "hi": hi}
            elif isinstance(val, str):
                return {"en": val, "hi": val}
            else:
                return {"en": "", "hi": ""}
        for field in required_fields:
            v = data.get(field)
            if not v:
                missing_fields.append(field)
        # Validate category (case-insensitive)
        if data.get("category"):
            normalized_category = str(data["category"]).strip().lower()
            if normalized_category in self.task_categories:
                data["category"] = normalized_category
            else:
                missing_fields.append("category")
        # Validate and clean resources as before ...
        resources = data.get("resources", [])
        if isinstance(resources, list):
            cleaned_resources = []
            for resource in resources:
                if isinstance(resource, dict):
                    quantity = float(resource.get("quantity", 0))
                    cost_per_unit = float(resource.get("cost_per_unit", 0))
                    total_cost = quantity * cost_per_unit
                    cleaned_resource = {
                        "resource_type": resource.get("resource_type"),
                        "name": resource.get("name"),
                        "quantity": quantity,
                        "unit": resource.get("unit"),
                        "cost_per_unit": cost_per_unit,
                        "total_cost": total_cost
                    }
                    cleaned_resources.append(cleaned_resource)
        else:
            cleaned_resources = []
        cleaned_data = {
            "category": data.get("category"),
            "subcategory": data.get("subcategory"),
            "short_description": data.get("short_description"),
            "description": data.get("description"),
            "assigned_to_id": data.get("assigned_to_id"),
            "occurred_at": data.get("occurred_at"),
            "labor_count": data.get("labor_count"),
            "labor_hours": data.get("labor_hours"),
            "outcome_observation": data.get("outcome_observation"),
            "gps_lat": data.get("gps_lat"),
            "gps_lng": data.get("gps_lng"),
            "resources": cleaned_resources,
            "missing_fields": missing_fields,
            "is_complete": len(missing_fields) == 0
        }
        return cleaned_data

    def _normalize_task_fields(self, data: Dict[str, Any], user_input: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize category from Hindi/synonyms and map assigned_to by name mention."""
        normalized = dict(data)
        # Normalize category
        category_map = {
            "irrigation": {"irrigation", "इरीगेशन", "इरिगेशन", "सिंचाई", "paani", "पानी"},
            "fertilizer": {"fertilizer", "खाद"},
            "harvest": {"harvest", "कटाई", "हार्वेस्ट"},
            "sowing": {"sowing", "बुआई", "बोना"},
            "sale": {"sale", "बिक्री", "विक्रय"},
            "storage": {"storage", "भंडार", "स्टोरेज"},
        }
        if normalized.get("category"):
            candidate = str(normalized["category"]).strip()
            candidate_lower = candidate.lower()
            if candidate_lower not in self.task_categories:
                # Try map by synonyms
                lc = candidate.casefold()
                for category_name, variants in category_map.items():
                    if lc in {v.casefold() for v in variants}:
                        normalized["category"] = category_name
                        break

        # Map assigned_to_id by name mention if missing
        if not normalized.get("assigned_to_id") and context.get("available_users"):
            text = user_input.casefold()
            best_match = None
            for u in context.get("available_users", []):
                name = str(u.get("name", "")).strip()
                if not name:
                    continue
                parts = [p for p in name.split() if p]
                # Check full name or any part present
                if name.casefold() in text or any(p.casefold() in text for p in parts):
                    best_match = u
                    break
            if best_match:
                normalized["assigned_to_id"] = best_match.get("user_id")

        # Ensure short_description exists
        if not normalized.get("short_description"):
            # Use description or a brief from user_input
            source = normalized.get("description") or user_input
            short = source.strip().split("\n")[0]
            if len(short) > 120:
                short = short[:117] + "..."
            normalized["short_description"] = short if short else None

        return normalized
    
    def get_available_users(self, users: List[Dict[str, Any]]) -> str:
        """Format available users for context"""
        if not users:
            return "No users available"
        
        user_list = []
        for user in users:
            user_list.append(f"- {user['name']} ({user['role']}) - ID: {user['user_id']}")
        
        return "Available users:\n" + "\n".join(user_list)
    
    def generate_form_preview(self, form_type: str, data: Dict[str, Any], users: List[Dict[str, Any]] = None) -> str:
        """Generate a human-readable preview of the form data"""
        if form_type == "work_order":
            return self._generate_work_order_preview(data, users)
        elif form_type == "task":
            return self._generate_task_preview(data, users)
        else:
            return "Unknown form type"
    
    def _generate_work_order_preview(self, data: Dict[str, Any], users: List[Dict[str, Any]] = None) -> str:
        """Generate work order preview"""
        assigned_to = "Unknown"
        if users and data.get("assigned_to_id"):
            user = next((u for u in users if str(u["user_id"]) == str(data["assigned_to_id"])), None)
            if user:
                assigned_to = f"{user['name']} ({user['role']})"
        
        preview = f"""
📋 **Work Order Preview**

**Title:** {data.get('title', 'Not specified')}
**Description:** {data.get('description', 'Not specified')}
**Instructions:** {data.get('instructions', 'None')}
**Assigned To:** {assigned_to}
**Due Date:** {data.get('due_date', 'Not specified')}
"""
        return preview.strip()
    
    def _generate_task_preview(self, data: Dict[str, Any], users: List[Dict[str, Any]] = None) -> str:
        """Generate task preview"""
        assigned_to = "Unknown"
        if users and data.get("assigned_to_id"):
            user = next((u for u in users if str(u["user_id"]) == str(data["assigned_to_id"])), None)
            if user:
                assigned_to = f"{user['name']} ({user['role']})"
        
        resources_text = "None"
        if data.get("resources"):
            resources_text = "\n".join([
                f"  • {r.get('name', 'Unknown')} - {r.get('quantity', 0)} {r.get('unit', '')} @ ₹{r.get('cost_per_unit', 0)} = ₹{r.get('total_cost', 0)}"
                for r in data["resources"]
            ])
        
        total_cost = sum(r.get("total_cost", 0) for r in data.get("resources", []))
        
        preview = f"""
📝 **Task Preview**

**Type:** {data.get('task_type', 'Not specified')}
**Description:** {data.get('short_description', 'Not specified')}
**Details:** {data.get('description', 'Not specified')}
**Assigned To:** {assigned_to}
**Occurred At:** {data.get('occurred_at', 'Not specified')}
**Labor:** {data.get('labor_count', 'Not specified')} workers, {data.get('labor_hours', 'Not specified')} hours
**Outcome:** {data.get('outcome_observation', 'Not specified')}
**Resources Used:**
{resources_text}
**Total Cost:** ₹{total_cost}
"""
        return preview.strip()
