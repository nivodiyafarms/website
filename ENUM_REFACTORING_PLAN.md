# 🔥 ENUM REFACTORING PLAN - Code Comparison & Issues

## 📋 EXECUTIVE SUMMARY

**Total Files Affected:** ~25 files  
**Critical Issues:** Enum definitions using UPPERCASE values  
**Removed Enums:** TaskType, MaterialCategory, EquipmentType, SoilType  
**New Enums Needed:** task_category_enum, task_subcategory_enum  

---

## 🔴 PART 1: ENUM DEFINITIONS - UPPERCASE VALUES (MUST FIX)

### 1.1 `backend/app/models/task.py`

**❌ CURRENT (WRONG):**
```python
class TaskStatus(str, enum.Enum):
    NEW = "NEW"              # ❌ Should be: "new"
    IN_PROGRESS = "IN_PROGRESS"  # ❌ Should be: "in_progress"
    ON_HOLD = "ON_HOLD"      # ❌ Should be: "on_hold"
    RESOLVED = "RESOLVED"    # ❌ Should be: "resolved"
    REOPENED = "REOPENED"   # ❌ Should be: "reopened"
    CLOSED = "CLOSED"        # ❌ Should be: "closed"
    CANCELLED = "CANCELLED"  # ❌ Should be: "cancelled"

class TaskType(str, enum.Enum):  # ❌ ENTIRE ENUM MUST BE REMOVED
    PEST = "PEST"
    DISEASE = "DISEASE"
    # ... (all values wrong, enum deprecated)

class SeverityLevel(str, enum.Enum):
    SEV_1 = "SEV_1"  # ❌ Should be: "sev1"
    SEV_2 = "SEV_2"  # ❌ Should be: "sev2"
    SEV_3 = "SEV_3"  # ❌ Should be: "sev3"
    SEV_4 = "SEV_4"  # ❌ Should be: "sev4"
```

**✅ SHOULD BE:**
```python
class TaskStatus(str, enum.Enum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    RESOLVED = "resolved"
    REOPENED = "reopened"
    CLOSED = "closed"
    CANCELLED = "cancelled"

# TaskType enum REMOVED - replaced with category/subcategory strings

class SeverityLevel(str, enum.Enum):
    SEV1 = "sev1"
    SEV2 = "sev2"
    SEV3 = "sev3"
    SEV4 = "sev4"
```

**Model Column Issue:**
- Line 66: `task_type = Column(SQLEnum(TaskType), ...)` ❌ **MUST REMOVE** - TaskType enum doesn't exist
- Should use: `category` and `subcategory` as String columns (already exist on lines 63-64)

---

### 1.2 `backend/app/models/work_order.py`

**❌ CURRENT (WRONG):**
```python
class WorkOrderStatus(str, enum.Enum):
    OPEN = "OPEN"                    # ❌ Should be: "open"
    IN_PROGRESS = "IN_PROGRESS"      # ❌ Should be: "in_progress"
    ON_HOLD = "ON_HOLD"              # ❌ Should be: "on_hold"
    COMPLETED = "COMPLETED"          # ❌ Should be: "completed"
    PARTIALLY_COMPLETE = "PARTIALLY_COMPLETE"  # ❌ Should be: "partial"
    CLOSED = "CLOSED"                # ❌ Should be: "closed"
    CANCELLED = "CANCELLED"          # ❌ Should be: "cancelled"
```

**✅ SHOULD BE:**
```python
class WorkOrderStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    PARTIAL = "partial"  # Note: Changed from PARTIALLY_COMPLETE
    CLOSED = "closed"
    CANCELLED = "cancelled"
```

---

### 1.3 `backend/app/models/user.py`

**❌ CURRENT (WRONG):**
```python
class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"          # ❌ Should be: "admin"
    SUPERVISOR = "SUPERVISOR"  # ❌ Should be: "supervisor"
    WORKER = "WORKER"        # ❌ Should be: "worker"

class UserLanguage(str, enum.Enum):
    EN_IN = "en-IN"  # ✅ Already lowercase (but check usage)
    HI_IN = "hi-IN"  # ✅ Already lowercase (but check usage)
```

**✅ SHOULD BE:**
```python
class UserRole(str, enum.Enum):
    ADMIN = "admin"
    SUPERVISOR = "supervisor"
    WORKER = "worker"

class UserLanguage(str, enum.Enum):
    EN_IN = "en_in"  # Note: Changed from "en-IN" to "en_in" (snake_case)
    HI_IN = "hi_in"  # Note: Changed from "hi-IN" to "hi_in" (snake_case)
```

---

### 1.4 `backend/app/models/crop_cycle.py`

**✅ ALREADY CORRECT:**
- `CropStage` - all lowercase ✅
- `CropCycleStatus` - all lowercase ✅

**No changes needed here.**

---

### 1.5 `backend/app/models/work_order_resource.py`

**❌ CURRENT (WRONG):**
- Contains `TaskType` enum definition (line 33) ❌ **MUST REMOVE**
- Line 74: Uses `SQLEnum(TaskType, name="task_type_enum")` ❌ **MUST REMOVE**

---

### 1.6 ENUMS TO COMPLETELY REMOVE

**❌ `backend/app/models/material.py`:**
```python
class MaterialCategory(str, enum.Enum):  # ❌ REMOVE ENTIRE ENUM
    FERTILIZER = "FERTILIZER"
    PESTICIDE = "PESTICIDE"
    # ...
```
- Line 19: `category = Column(SQLEnum(MaterialCategory), ...)` ❌ **CHANGE TO:** `category = Column(String, ...)`

**❌ `backend/app/models/equipment.py`:**
```python
class EquipmentType(str, enum.Enum):  # ❌ REMOVE ENTIRE ENUM
    TRACTOR = "TRACTOR"
    # ...
```
- Line 18: `type = Column(SQLEnum(EquipmentType), ...)` ❌ **CHANGE TO:** `type = Column(String, ...)`

**❌ `backend/app/models/field.py`:**
```python
class SoilType(str, enum.Enum):  # ❌ REMOVE ENTIRE ENUM
    BLACK = "BLACK"
    # ...
```
- Line 26: `soil_type = Column(SQLEnum(SoilType), ...)` ❌ **CHANGE TO:** `soil_type = Column(String, ...)`

---

## 🔴 PART 2: FILES WITH UPPERCASE COMPARISONS & CONVERSIONS

### 2.1 `backend/app/api/crop_cycle_incidents.py`

**❌ PROBLEMS FOUND:**

**Line 537:** Converting to lowercase (good) but then using TaskType enum (wrong)
```python
task_type_value = task.task_type.lower() if task.task_type else 'other'
task_type_enum = TaskType(task_type_value)  # ❌ TaskType enum doesn't exist
```

**Line 547-548:** Complex severity conversion (should be simpler)
```python
severity_str = task.severity.upper().replace('_', '')  # SEV_1 -> SEV1
severity_str = severity_str.lower()  # SEV1 -> sev1
```

**Line 571:** Converting status to lowercase (shouldn't need conversion)
```python
status=TaskStatus(task.status.lower()) if task.status else TaskStatus.NEW
```

**Line 679:** Converting to UPPERCASE ❌
```python
task_dict['task_type'] = task_type_str.upper()  # ❌ Should stay lowercase
```

**Line 685, 688:** Converting status to UPPERCASE ❌
```python
task_dict['status'] = task_dict['status'].value.upper()  # ❌
task_dict['status'] = str(task_dict['status']).upper()  # ❌
```

**Line 720:** Converting severity to UPPERCASE ❌
```python
severity_str = str(severity_value).upper()  # ❌
```

**Line 894:** Converting task_type to UPPERCASE ❌
```python
task.task_type = str(task_type_value).upper()  # ❌
```

**Line 903:** Converting status to UPPERCASE ❌
```python
task.status = str(status_value).upper()  # ❌
```

**Line 911:** Converting severity to UPPERCASE ❌
```python
severity_str = str(severity_value).upper()  # ❌
```

**Line 997, 1000:** Converting to UPPERCASE ❌
```python
current_stage_value = (crop_cycle.current_stage or "sowing").upper()  # ❌
status_value = (crop_cycle.status or "open").upper()  # ❌
```

**Line 1080:** Converting to UPPERCASE ❌
```python
task_type=TaskType.OTHER.value.upper()  # ❌ TaskType doesn't exist, and no .upper()
```

---

### 2.2 `backend/app/auth/security.py`

**Line 121:** Hardcoded uppercase string ❌
```python
if current_user.role != "ADMIN":  # ❌ Should be: "admin"
```

---

### 2.3 `backend/app/routes/task.py`

**Line 45:** Using enum (good, but enum values need to be lowercase)
```python
status=TaskStatus.NEW,  # ✅ Enum usage correct, but enum definition wrong
```

**Line 91, 97:** Using enum comparisons (good, but enum values need to be lowercase)
```python
if payload.status == TaskStatus.ON_HOLD:  # ✅ Correct usage
if payload.status == TaskStatus.RESOLVED:  # ✅ Correct usage
```

---

### 2.4 `backend/app/services/database_query_service.py`

**Lines 44, 46, 108, 152:** Converting to lowercase (good practice)
```python
query = query.filter(CropCycle.status == status.lower())  # ✅ Good
query = query.filter(Task.status == status.lower())  # ✅ Good
```

**These are OK** - they're converting user input to lowercase for comparison.

---

### 2.5 `backend/app/services/chatbot_service.py`

**Line 271:** Converting to UPPERCASE ❌
```python
normalized_type = str(data["task_type"]).strip().upper()  # ❌
if normalized_type in self.task_types:  # ❌
```

**Line 331:** Converting to UPPERCASE ❌
```python
upper_candidate = candidate.upper()  # ❌
if upper_candidate not in self.task_types:  # ❌
```

**Line 24:** Getting TaskType enum values (enum will be removed)
```python
self.task_types = [t.value for t in TaskType]  # ❌ TaskType doesn't exist
```

---

## 🔴 PART 3: FILES USING REMOVED ENUMS

### 3.1 Files Importing TaskType (MUST FIX)

1. `backend/app/models/task.py` - Defines it ❌
2. `backend/app/models/work_order_resource.py` - Defines it ❌
3. `backend/app/api/crop_cycle_incidents.py` - Imports & uses it ❌
4. `backend/app/schemas/task.py` - Imports & uses it ❌
5. `backend/app/schemas/crop_cycle_incident.py` - Imports & uses it ❌
6. `backend/app/services/openai_chatbot_service.py` - Imports & uses it ❌
7. `backend/app/schemas/chatbot.py` - Imports it ❌
8. `backend/app/services/chatbot_service.py` - Imports & uses it ❌

### 3.2 Files Using MaterialCategory (MUST FIX)

1. `backend/app/models/material.py` - Defines it ❌
2. `backend/app/schemas/material.py` - Imports & uses it ❌

### 3.3 Files Using EquipmentType (MUST FIX)

1. `backend/app/models/equipment.py` - Defines it ❌
2. `backend/app/schemas/equipment.py` - Imports & uses it ❌

### 3.4 Files Using SoilType (MUST FIX)

1. `backend/app/models/field.py` - Defines it ❌
2. `backend/app/schemas/field.py` - Imports & uses it ❌

---

## 🔴 PART 4: NEW ENUMS NEEDED

### 4.1 Task Category Enum (NEW)

**File:** `backend/app/models/task.py` (or new file)

**✅ NEED TO CREATE:**
```python
class TaskCategory(str, enum.Enum):
    SOWING = "sowing"
    IRRIGATION = "irrigation"
    FERTILIZER = "fertilizer"
    HARVEST = "harvest"
    FUEL = "fuel"
    SALE = "sale"
    STORAGE = "storage"
```

**Usage:** `tasks.category` column (already exists as String, can add enum validation)

### 4.2 Task Subcategory Enum (NEW)

**File:** `backend/app/models/task.py` (or new file)

**✅ NEED TO CREATE:**
```python
class TaskSubcategory(str, enum.Enum):
    KHURAR = "khurar"
    ROTAVATOR = "rotavator"
    LEVELING = "leveling"
    SEEDING = "seeding"
    # ... (all 30+ values from spec)
```

**Usage:** `tasks.subcategory` column (already exists as String, can add enum validation)

---

## 📊 SUMMARY BY FILE

### Critical Priority (Enum Definitions):
1. ✅ `backend/app/models/crop_cycle.py` - Already correct
2. ❌ `backend/app/models/task.py` - TaskStatus, SeverityLevel wrong; TaskType must be removed
3. ❌ `backend/app/models/work_order.py` - WorkOrderStatus wrong
4. ❌ `backend/app/models/user.py` - UserRole wrong; UserLanguage format wrong
5. ❌ `backend/app/models/work_order_resource.py` - TaskType must be removed
6. ❌ `backend/app/models/material.py` - MaterialCategory must be removed
7. ❌ `backend/app/models/equipment.py` - EquipmentType must be removed
8. ❌ `backend/app/models/field.py` - SoilType must be removed

### High Priority (Uppercase Conversions):
1. ❌ `backend/app/api/crop_cycle_incidents.py` - 10+ places with .upper()
2. ❌ `backend/app/auth/security.py` - Hardcoded "ADMIN"
3. ❌ `backend/app/services/chatbot_service.py` - .upper() conversions

### Medium Priority (Schema Updates):
1. ❌ `backend/app/schemas/task.py` - Remove TaskType
2. ❌ `backend/app/schemas/crop_cycle_incident.py` - Remove TaskType
3. ❌ `backend/app/schemas/material.py` - Remove MaterialCategory
4. ❌ `backend/app/schemas/equipment.py` - Remove EquipmentType
5. ❌ `backend/app/schemas/field.py` - Remove SoilType

---

## ✅ NEXT STEPS AFTER APPROVAL

1. Update all enum definitions to lowercase
2. Remove deprecated enums (TaskType, MaterialCategory, EquipmentType, SoilType)
3. Remove all .upper() conversions
4. Update hardcoded uppercase strings
5. Add new enums (TaskCategory, TaskSubcategory) if needed
6. Update all imports
7. Test all endpoints

---

**Ready for approval to proceed with refactoring.**
