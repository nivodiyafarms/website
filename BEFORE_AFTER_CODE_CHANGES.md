# 🔄 BEFORE & AFTER CODE CHANGES - Enum Refactoring

**Note:** No new files will be created. Only existing files will be updated.

---

## 📁 FILE 1: `backend/app/models/task.py`

### ❌ BEFORE:
```python
# -----------------------------
# Enums
# -----------------------------
class TaskStatus(str, enum.Enum):
    NEW = "NEW"
    IN_PROGRESS = "IN_PROGRESS"
    ON_HOLD = "ON_HOLD"
    RESOLVED = "RESOLVED"
    REOPENED = "REOPENED"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"


class TaskType(str, enum.Enum):  # ❌ REMOVE THIS ENTIRE ENUM
    PEST = "PEST"
    DISEASE = "DISEASE"
    WEED = "WEED"
    NUTRIENT = "NUTRIENT"
    WATER = "WATER"
    WEATHER = "WEATHER"
    EQUIPMENT = "EQUIPMENT"
    LABOR = "LABOR"
    HARVEST = "HARVEST"
    OTHER = "OTHER"


class SeverityLevel(str, enum.Enum):
    SEV_1 = "SEV_1"
    SEV_2 = "SEV_2"
    SEV_3 = "SEV_3"
    SEV_4 = "SEV_4"


# In Task model:
task_type = Column(SQLEnum(TaskType), nullable=False)  # ❌ REMOVE THIS LINE
```

### ✅ AFTER:
```python
# -----------------------------
# Enums
# -----------------------------
class TaskStatus(str, enum.Enum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    RESOLVED = "resolved"
    REOPENED = "reopened"
    CLOSED = "closed"
    CANCELLED = "cancelled"


# TaskType enum REMOVED - tasks now use category and subcategory (String columns)


class SeverityLevel(str, enum.Enum):
    SEV1 = "sev1"
    SEV2 = "sev2"
    SEV3 = "sev3"
    SEV4 = "sev4"


# In Task model:
# task_type column REMOVED - use category and subcategory instead
# (category and subcategory already exist as String columns)
```

**Changes:**
- ✅ TaskStatus: All values changed to lowercase with underscores
- ✅ TaskType: Entire enum removed (not needed - use category/subcategory)
- ✅ SeverityLevel: Changed from "SEV_1" to "sev1" (no underscore)
- ✅ Removed `task_type` column from Task model (line 66)

---

## 📁 FILE 2: `backend/app/models/work_order.py`

### ❌ BEFORE:
```python
class WorkOrderStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    ON_HOLD = "ON_HOLD"
    COMPLETED = "COMPLETED"
    PARTIALLY_COMPLETE = "PARTIALLY_COMPLETE"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"
```

### ✅ AFTER:
```python
class WorkOrderStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    PARTIAL = "partial"  # Changed from PARTIALLY_COMPLETE
    CLOSED = "closed"
    CANCELLED = "cancelled"
```

**Changes:**
- ✅ All values changed to lowercase with underscores
- ✅ PARTIALLY_COMPLETE renamed to PARTIAL (value: "partial")

---

## 📁 FILE 3: `backend/app/models/user.py`

### ❌ BEFORE:
```python
class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    SUPERVISOR = "SUPERVISOR"
    WORKER = "WORKER"


class UserLanguage(str, enum.Enum):
    EN_IN = "en-IN"
    HI_IN = "hi-IN"


# In language_enum property:
lang_str = str(self.language).upper()  # ❌ REMOVE .upper()
if lang_str == "EN_IN" or lang_str == "EN-IN":  # ❌ UPDATE COMPARISONS
```

### ✅ AFTER:
```python
class UserRole(str, enum.Enum):
    ADMIN = "admin"
    SUPERVISOR = "supervisor"
    WORKER = "worker"


class UserLanguage(str, enum.Enum):
    EN_IN = "en_in"  # Changed from "en-IN" to "en_in" (snake_case)
    HI_IN = "hi_in"  # Changed from "hi-IN" to "hi_in" (snake_case)


# In language_enum property:
lang_str = str(self.language).lower()  # ✅ Changed to lowercase
if lang_str == "en_in":  # ✅ Simplified comparison
    return UserLanguage.EN_IN
elif lang_str == "hi_in":  # ✅ Simplified comparison
    return UserLanguage.HI_IN
```

**Changes:**
- ✅ UserRole: All values changed to lowercase
- ✅ UserLanguage: Values changed from "en-IN" to "en_in" (snake_case)
- ✅ Removed .upper() conversion in language_enum property
- ✅ Simplified language comparisons

---

## 📁 FILE 4: `backend/app/models/work_order_resource.py`

### ❌ BEFORE:
```python
class TaskType(str, enum.Enum):  # ❌ REMOVE THIS ENTIRE ENUM
    PEST = "PEST"
    # ... (all values)

# In model:
task_type = Column(
    SQLEnum(TaskType, name="task_type_enum"),  # ❌ REMOVE THIS
    nullable=False
)
```

### ✅ AFTER:
```python
# TaskType enum REMOVED - not needed

# In model:
# task_type column REMOVED - use category/subcategory instead
```

**Changes:**
- ✅ Removed TaskType enum definition
- ✅ Removed task_type column (if it exists)

---

## 📁 FILE 5: `backend/app/models/material.py`

### ❌ BEFORE:
```python
class MaterialCategory(str, enum.Enum):  # ❌ REMOVE THIS ENTIRE ENUM
    FERTILIZER = "FERTILIZER"
    PESTICIDE = "PESTICIDE"
    FUNGICIDE = "FUNGICIDE"
    HERBICIDE = "HERBICIDE"
    BIO = "BIO"


# In Material model:
category = Column(SQLEnum(MaterialCategory), nullable=False)  # ❌ CHANGE TO String
```

### ✅ AFTER:
```python
# MaterialCategory enum REMOVED - not needed

# In Material model:
category = Column(String, nullable=False)  # ✅ Changed to String (no enum)
```

**Changes:**
- ✅ Removed MaterialCategory enum
- ✅ Changed category column from SQLEnum to String

---

## 📁 FILE 6: `backend/app/models/equipment.py`

### ❌ BEFORE:
```python
class EquipmentType(str, enum.Enum):  # ❌ REMOVE THIS ENTIRE ENUM
    TRACTOR = "TRACTOR"
    SPRAYER = "SPRAYER"
    PUMP = "PUMP"
    BOOM = "BOOM"


# In Equipment model:
type = Column(SQLEnum(EquipmentType), nullable=False)  # ❌ CHANGE TO String
```

### ✅ AFTER:
```python
# EquipmentType enum REMOVED - not needed

# In Equipment model:
type = Column(String, nullable=False)  # ✅ Changed to String (no enum)
```

**Changes:**
- ✅ Removed EquipmentType enum
- ✅ Changed type column from SQLEnum to String

---

## 📁 FILE 7: `backend/app/models/field.py`

### ❌ BEFORE:
```python
class SoilType(str, enum.Enum):  # ❌ REMOVE THIS ENTIRE ENUM
    BLACK = "BLACK"
    MIX = "MIX"
    SANDY = "SANDY"
    LOAM = "LOAM"


# In Field model:
soil_type = Column(SQLEnum(SoilType), nullable=True)  # ❌ CHANGE TO String
```

### ✅ AFTER:
```python
# SoilType enum REMOVED - not needed

# In Field model:
soil_type = Column(String, nullable=True)  # ✅ Changed to String (no enum)
```

**Changes:**
- ✅ Removed SoilType enum
- ✅ Changed soil_type column from SQLEnum to String

---

## 📁 FILE 8: `backend/app/auth/security.py`

### ❌ BEFORE:
```python
async def get_current_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.role != "ADMIN":  # ❌ Hardcoded uppercase
        raise HTTPException(...)
```

### ✅ AFTER:
```python
async def get_current_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":  # ✅ Lowercase
        raise HTTPException(...)
```

**Changes:**
- ✅ Changed hardcoded "ADMIN" to "admin"

---

## 📁 FILE 9: `backend/app/schemas/task.py`

### ❌ BEFORE:
```python
from app.models.task import TaskType, TaskStatus, SeverityLevel  # ❌ TaskType doesn't exist

class TaskCreate(BaseModel):
    task_type: TaskType  # ❌ REMOVE TaskType

class TaskResponse(BaseModel):
    task_type: TaskType  # ❌ REMOVE TaskType
```

### ✅ AFTER:
```python
from app.models.task import TaskStatus, SeverityLevel  # ✅ Removed TaskType

class TaskCreate(BaseModel):
    category: Optional[str]  # ✅ Use category instead
    subcategory: Optional[str]  # ✅ Use subcategory instead
    # task_type removed

class TaskResponse(BaseModel):
    category: Optional[str]  # ✅ Use category instead
    subcategory: Optional[str]  # ✅ Use subcategory instead
    # task_type removed
```

**Changes:**
- ✅ Removed TaskType import
- ✅ Removed task_type field from schemas
- ✅ Use category and subcategory (already exist in schemas)

---

## 📁 FILE 10: `backend/app/api/crop_cycle_incidents.py`

### ❌ BEFORE (Multiple locations):

**Line 537-541:**
```python
task_type_value = task.task_type.lower() if task.task_type else 'other'
try:
    task_type_enum = TaskType(task_type_value)  # ❌ TaskType doesn't exist
except ValueError:
    task_type_enum = TaskType.OTHER  # ❌ TaskType doesn't exist
```

**Line 547-548:**
```python
severity_str = task.severity.upper().replace('_', '')  # ❌ No .upper() needed
severity_str = severity_str.lower()  # ✅ Keep this
```

**Line 571:**
```python
status=TaskStatus(task.status.lower()) if task.status else TaskStatus.NEW  # ❌ No .lower() needed if enum values are correct
```

**Line 679:**
```python
task_dict['task_type'] = task_type_str.upper()  # ❌ Remove .upper()
```

**Line 685, 688:**
```python
task_dict['status'] = task_dict['status'].value.upper()  # ❌ Remove .upper()
task_dict['status'] = str(task_dict['status']).upper()  # ❌ Remove .upper()
```

**Line 720:**
```python
severity_str = str(severity_value).upper()  # ❌ Remove .upper()
```

**Line 894:**
```python
task.task_type = str(task_type_value).upper()  # ❌ Remove .upper(), remove task_type
```

**Line 903:**
```python
task.status = str(status_value).upper()  # ❌ Remove .upper()
```

**Line 911:**
```python
severity_str = str(severity_value).upper()  # ❌ Remove .upper()
```

**Line 997, 1000:**
```python
current_stage_value = (crop_cycle.current_stage or "sowing").upper()  # ❌ Remove .upper()
status_value = (crop_cycle.status or "open").upper()  # ❌ Remove .upper()
```

**Line 1080:**
```python
task_type=TaskType.OTHER.value.upper()  # ❌ TaskType doesn't exist, remove .upper()
```

### ✅ AFTER:

**Line 537-541:**
```python
# task_type removed - use category/subcategory instead
category = task.category if task.category else None
subcategory = task.subcategory if task.subcategory else None
```

**Line 547-548:**
```python
# Severity already lowercase in enum, no conversion needed
severity_value = task.severity if task.severity else None
```

**Line 571:**
```python
status=TaskStatus(task.status) if task.status else TaskStatus.NEW  # ✅ No .lower() needed
```

**Line 679:**
```python
# task_type removed - use category/subcategory
task_dict['category'] = category
task_dict['subcategory'] = subcategory
```

**Line 685, 688:**
```python
task_dict['status'] = task_dict['status'].value  # ✅ No .upper()
# Or if it's already a string:
task_dict['status'] = str(task_dict['status'])  # ✅ No .upper()
```

**Line 720:**
```python
severity_str = str(severity_value)  # ✅ No .upper()
```

**Line 894:**
```python
# task_type removed - use category/subcategory
task.category = category_value
task.subcategory = subcategory_value
```

**Line 903:**
```python
task.status = status_value  # ✅ No .upper(), no str() if already enum
```

**Line 911:**
```python
severity_str = str(severity_value)  # ✅ No .upper()
```

**Line 997, 1000:**
```python
current_stage_value = crop_cycle.current_stage or "sowing"  # ✅ No .upper()
status_value = crop_cycle.status or "open"  # ✅ No .upper()
```

**Line 1080:**
```python
# task_type removed - use category/subcategory instead
category="other"  # ✅ Use category string
subcategory="other"  # ✅ Use subcategory string
```

**Changes:**
- ✅ Removed all TaskType references
- ✅ Removed all .upper() conversions
- ✅ Use category/subcategory instead of task_type
- ✅ Simplified enum value handling (no conversions needed)

---

## 📁 FILE 11: `backend/app/services/chatbot_service.py`

### ❌ BEFORE:

**Line 24:**
```python
self.task_types = [t.value for t in TaskType]  # ❌ TaskType doesn't exist
```

**Line 271:**
```python
normalized_type = str(data["task_type"]).strip().upper()  # ❌ Remove .upper()
if normalized_type in self.task_types:  # ❌ Update to use category list
```

**Line 331:**
```python
upper_candidate = candidate.upper()  # ❌ Remove .upper()
if upper_candidate not in self.task_types:  # ❌ Update to use category list
```

### ✅ AFTER:

**Line 24:**
```python
# Use category enum values instead
self.task_categories = ["sowing", "irrigation", "fertilizer", "harvest", "fuel", "sale", "storage"]
```

**Line 271:**
```python
normalized_type = str(data["category"]).strip().lower()  # ✅ Use category, lowercase
if normalized_type in self.task_categories:  # ✅ Use category list
```

**Line 331:**
```python
candidate_lower = candidate.lower()  # ✅ Lowercase
if candidate_lower not in self.task_categories:  # ✅ Use category list
```

**Changes:**
- ✅ Removed TaskType references
- ✅ Use category list instead
- ✅ Removed .upper() conversions
- ✅ Changed task_type to category

---

## 📁 FILE 12: `backend/app/schemas/material.py`

### ❌ BEFORE:
```python
from app.models.material import MaterialCategory  # ❌ MaterialCategory doesn't exist

class MaterialCreate(BaseModel):
    category: MaterialCategory  # ❌ Change to str

class MaterialResponse(BaseModel):
    category: MaterialCategory  # ❌ Change to str
```

### ✅ AFTER:
```python
# MaterialCategory import removed

class MaterialCreate(BaseModel):
    category: str  # ✅ Changed to str

class MaterialResponse(BaseModel):
    category: str  # ✅ Changed to str
```

**Changes:**
- ✅ Removed MaterialCategory import
- ✅ Changed category field to str

---

## 📁 FILE 13: `backend/app/schemas/equipment.py`

### ❌ BEFORE:
```python
from app.models.equipment import EquipmentType  # ❌ EquipmentType doesn't exist

class EquipmentCreate(BaseModel):
    type: EquipmentType  # ❌ Change to str

class EquipmentResponse(BaseModel):
    type: EquipmentType  # ❌ Change to str
```

### ✅ AFTER:
```python
# EquipmentType import removed

class EquipmentCreate(BaseModel):
    type: str  # ✅ Changed to str

class EquipmentResponse(BaseModel):
    type: str  # ✅ Changed to str
```

**Changes:**
- ✅ Removed EquipmentType import
- ✅ Changed type field to str

---

## 📁 FILE 14: `backend/app/schemas/field.py`

### ❌ BEFORE:
```python
from app.models.field import SoilType, OwnershipType  # ❌ SoilType doesn't exist

class FieldCreate(BaseModel):
    soil_type: Optional[SoilType] = None  # ❌ Change to str

class FieldResponse(BaseModel):
    soil_type: Optional[SoilType]  # ❌ Change to str
```

### ✅ AFTER:
```python
from app.models.field import OwnershipType  # ✅ Removed SoilType

class FieldCreate(BaseModel):
    soil_type: Optional[str] = None  # ✅ Changed to str

class FieldResponse(BaseModel):
    soil_type: Optional[str]  # ✅ Changed to str
```

**Changes:**
- ✅ Removed SoilType import
- ✅ Changed soil_type field to str

---

## 📁 FILE 15: `backend/app/schemas/crop_cycle_incident.py`

### ❌ BEFORE:
```python
from app.models.task import TaskType, TaskStatus, SeverityLevel, ResourceType  # ❌ TaskType doesn't exist

class TaskCreate(BaseModel):
    task_type: TaskType  # ❌ Remove

class TaskUpdate(BaseModel):
    task_type: Optional[TaskType] = None  # ❌ Remove

class TaskResponse(BaseModel):
    task_type: Optional[TaskType] = None  # ❌ Remove
```

### ✅ AFTER:
```python
from app.models.task import TaskStatus, SeverityLevel, ResourceType  # ✅ Removed TaskType

class TaskCreate(BaseModel):
    category: Optional[str] = None  # ✅ Use category
    subcategory: Optional[str] = None  # ✅ Use subcategory
    # task_type removed

class TaskUpdate(BaseModel):
    category: Optional[str] = None  # ✅ Use category
    subcategory: Optional[str] = None  # ✅ Use subcategory
    # task_type removed

class TaskResponse(BaseModel):
    category: Optional[str] = None  # ✅ Use category
    subcategory: Optional[str] = None  # ✅ Use subcategory
    # task_type removed
```

**Changes:**
- ✅ Removed TaskType import
- ✅ Removed task_type fields
- ✅ Use category and subcategory (already exist in schemas)

---

## 📁 FILE 16: `backend/app/services/openai_chatbot_service.py`

### ❌ BEFORE:
```python
from app.models.task import Task, TaskType, TaskStatus  # ❌ TaskType doesn't exist

# In function definitions:
"task_type": {"type": "string", ...}  # ❌ Update to category
```

### ✅ AFTER:
```python
from app.models.task import Task, TaskStatus  # ✅ Removed TaskType

# In function definitions:
"category": {"type": "string", ...}  # ✅ Use category
"subcategory": {"type": "string", ...}  # ✅ Use subcategory
```

**Changes:**
- ✅ Removed TaskType import
- ✅ Changed task_type to category/subcategory in API descriptions

---

## 📁 FILE 17: `backend/app/schemas/chatbot.py`

### ❌ BEFORE:
```python
from app.models.task import TaskType, ResourceType  # ❌ TaskType doesn't exist
```

### ✅ AFTER:
```python
from app.models.task import ResourceType  # ✅ Removed TaskType
```

**Changes:**
- ✅ Removed TaskType import

---

## 📁 FILE 18: `backend/app/api/chatbot.py`

### ❌ BEFORE:
```python
task_type = task_data.get("task_type", "OTHER")  # ❌ Update
if isinstance(task_type, str):
    task_type = task_type.lower() if task_type else "other"  # ✅ Keep lowercase
```

### ✅ AFTER:
```python
category = task_data.get("category", "other")  # ✅ Use category
subcategory = task_data.get("subcategory", "other")  # ✅ Use subcategory
if isinstance(category, str):
    category = category.lower() if category else "other"  # ✅ Keep lowercase
```

**Changes:**
- ✅ Changed task_type to category/subcategory
- ✅ Keep lowercase conversion (good practice)

---

## 📊 SUMMARY OF ALL CHANGES

### Enums Updated to Lowercase:
1. ✅ TaskStatus: NEW → new, IN_PROGRESS → in_progress, etc.
2. ✅ WorkOrderStatus: OPEN → open, IN_PROGRESS → in_progress, etc.
3. ✅ UserRole: ADMIN → admin, SUPERVISOR → supervisor, WORKER → worker
4. ✅ UserLanguage: en-IN → en_in, hi-IN → hi_in
5. ✅ SeverityLevel: SEV_1 → sev1, SEV_2 → sev2, etc.

### Enums Removed:
1. ✅ TaskType (replaced with category/subcategory strings)
2. ✅ MaterialCategory (replaced with String column)
3. ✅ EquipmentType (replaced with String column)
4. ✅ SoilType (replaced with String column)

### Code Patterns Removed:
1. ✅ All `.upper()` conversions (10+ locations)
2. ✅ All TaskType references (15+ locations)
3. ✅ Hardcoded uppercase strings ("ADMIN", "NEW", etc.)

### Files Modified: 18 files
### No New Files Created ✅

---

**Ready for approval to apply these changes.**
