# Field Mapping Documentation

This document maps field names between Frontend, Backend Schema, and Database columns for the three-tier hierarchy: Crop Cycle → Task → Work Order.

## Data Flow Architecture

```
Frontend (Hindi/English) → Transformer → Backend Schema → API Endpoint → Database Model → Database Table
```

## Crop Cycle Field Mappings

| Frontend Field | Backend Schema Field | Database Column | Notes |
|---------------|---------------------|----------------|-------|
| `khet` | `field_id` | `field_code` | TEXT, NOT NULL |
| `fasal_naam` | `crop_name` | `crop_name` | TEXT, NOT NULL |
| `beej_category` | `crop_variety` | `seed_category` | TEXT, nullable |
| `buwaiDate` | `sowing_date` | `sowing_date` | DATE, nullable (converted from datetime) |
| `katayiDate` | `expected_harvest_date` | `expected_harvest_date` | DATE, nullable (converted from datetime) |
| `season` (रबी/खरीफ/जायद) | `season` | `season` | TEXT, NOT NULL (mapped to English) |
| `sthiti` (खोलना/समाधान किया) | `status` | `status` | VARCHAR(9), nullable (mapped to open/closed) |
| `vartman_charan` | `current_stage` | `current_stage` | VARCHAR(11), nullable (mapped to sowing/vegetative/etc) |
| `varnan` | `description` | `description` | TEXT, nullable |
| `tipanni` | `notes` | `description` | Merged into description (notes is a relationship) |
| `supervisor_id` | `supervisor_id` | `created_by` | UUID, nullable (FK to auth.users.id) |

**Response Mappings (Database → Backend → Frontend)**:
- `id` → `incident_id` → `incident_id`
- `field_code` → `field_id` → `field_id`
- `seed_category` → `crop_variety` → `crop_variety`
- `created_at` → `opened_at` → `opened_at`
- `resolved_date` → `closed_at` → `closed_at`
- `description` → `notes` → `notes` (for response only)

## Task Field Mappings

| Frontend Field | Backend Schema Field | Database Column | Notes |
|---------------|---------------------|----------------|-------|
| `category` (सिंचाई/विद्युत/etc) | `task_type` | `type` | TEXT, NOT NULL (mapped to irrigation/electrical/etc) |
| `sub_category` | `sub_type` | `sub_type` | TEXT, nullable |
| `short_description` | `short_description` | `short_description` | TEXT, nullable |
| `description` | `description` | `description` | TEXT, nullable |
| `status` (नया/प्रगति पर/etc) | `status` | `status` | VARCHAR(11), nullable (mapped to new/in_progress/etc) |
| `opened_date` | `occurred_at` | `occurred_at` | DATETIME, nullable |
| `expected_resolution_date` | `resolved_at` | `resolved_at` | DATETIME, nullable |
| `opened_by` | `assigned_to_id` | *(removed)* | Not in database, removed in endpoint |
| `crop_cycle_id` | `crop_cycle_id` | `crop_cycle_id` | UUID, nullable (FK to crop_cycles.id) |
| `resources` | `resources` | *(not stored)* | Resources stored in work_order_resources when work orders are created |

**Response Mappings (Database → Backend → Frontend)**:
- `id` → `task_id` → `task_id`
- `type` → `task_type` → `task_type`
- `cost` → `total_cost` → `total_cost`
- `resolved_at` → `closed_at` → `closed_at`
- `created_by` → `created_by_id` → `created_by_id`
- `approved_by` → `approved_by_id` → `approved_by_id`

## Work Order Field Mappings

| Frontend Field | Backend Schema Field | Database Column | Notes |
|---------------|---------------------|----------------|-------|
| `shortDesc` | `title` | `title` | TEXT, NOT NULL |
| `description` | `description` | `description` | TEXT, nullable |
| `instructions` | `instructions` | *(not in DB)* | Not stored in database |
| `assigned_to_id` | `assigned_to_id` | `assigned_to` | UUID, nullable (FK to auth.users.id) |
| `due_date` | `due_date` | `due_date` | DATE, nullable (converted from datetime) |
| `crop_cycle_id` | `crop_cycle_id` | *(not direct)* | Used to find/create task, then linked via `task_id` |
| `task_id` | `task_id` | `task_id` | UUID, nullable (FK to tasks.id) |

**Response Mappings (Database → Backend → Frontend)**:
- `id` → `work_order_id` → `work_order_id`
- `title` → `shortDesc` → `shortDesc` (for frontend compatibility)
- `assigned_to` → `assigned_to_id` → `assigned_to_id`
- `created_by` → `created_by_id` → `created_by_id`
- `task.crop_cycle_id` → `crop_cycle_id` → `crop_cycle_id` (computed from task relationship)

## Enum Mappings

### Crop Cycle Status
- Frontend: `खोलना` → Backend: `open` → Database: `open`
- Frontend: `समाधान किया` → Backend: `closed` → Database: `closed`

### Crop Stage
- Frontend: `बुआई` → Backend: `sowing` → Database: `sowing`
- Frontend: `वृद्धि` → Backend: `vegetative` → Database: `vegetative`
- Frontend: `फूल पर` → Backend: `flowering` → Database: `flowering`
- Frontend: `फल पर` → Backend: `fruiting` → Database: `fruiting`
- Frontend: `कटाई` → Backend: `harvest` → Database: `harvest`

### Task Status
- Frontend: `नया` → Backend: `new` → Database: `new`
- Frontend: `प्रगति पर` → Backend: `in_progress` → Database: `in_progress`
- Frontend: `रोक पर` → Backend: `on_hold` → Database: `on_hold`
- Frontend: `समाधान किया गया` → Backend: `resolved` → Database: `resolved`
- Frontend: `बंद` → Backend: `closed` → Database: `closed`

### Task Type
- Frontend: `सिंचाई` → Backend: `irrigation` → Database: `irrigation`
- Frontend: `विद्युत` → Backend: `electrical` → Database: `electrical`
- Frontend: `सड़क` → Backend: `road` → Database: `road`
- Default: `other` → Backend: `other` → Database: `other`

### Season
- Frontend: `रबी` → Backend: `Rabi` → Database: `Rabi`
- Frontend: `खरीफ` → Backend: `Kharif` → Database: `Kharif`
- Frontend: `जायद` → Backend: `Zaid` → Database: `Zaid`

## Data Type Conversions

### Date/DateTime Conversions
- **Frontend → Backend**: `YYYY-MM-DD` string → `datetime` object
- **Backend → Database**: `datetime` object → `date` object (for date columns)
- **Database → Backend**: `date` object → `datetime` object (for response)
- **Backend → Frontend**: `datetime` object → ISO string

### UUID Handling
- Frontend stores user as `user_id` in localStorage
- Transformer checks both `currentUser.id` and `currentUser.user_id`
- Backend uses `current_user.id` from authentication
- Database stores UUIDs in `auth.users.id` format

## Relationship Hierarchy

```
crop_cycles (id)
    ↓ (crop_cycle_id)
tasks (id)
    ↓ (task_id)
work_orders (id)
    ↓ (work_order_id)
work_order_resources (id)
```

## Key Transformation Rules

1. **Field Name Mapping**: Frontend Hindi names → Backend English names → Database column names
2. **Enum Mapping**: Hindi enum values → English enum values → Database string values
3. **Date Conversion**: Frontend date strings → Backend datetime → Database date/datetime
4. **Relationship Handling**: 
   - `notes` field from frontend → merged into `description` column (notes is a relationship in model)
   - `assigned_to_id` from frontend → removed (Task model doesn't have this field)
   - `crop_cycle_id` for work orders → used to find/create task → linked via `task_id`

## Required Fields by Layer

### Crop Cycle
- **Database Required**: `field_code`, `season`, `crop_name`
- **Schema Required**: `field_id`, `crop_name`, `sowing_date`, `supervisor_id`
- **Frontend Required**: `khet`, `fasal_naam`, `buwaiDate`

### Task
- **Database Required**: `type` (NOT NULL)
- **Schema Required**: `task_type`
- **Frontend Required**: `category` (mapped to task_type)

### Work Order
- **Database Required**: `title` (NOT NULL)
- **Schema Required**: `title`
- **Frontend Required**: `shortDesc` (mapped to title)

## Default Values

- **Task `type`**: Defaults to `'other'` if not provided
- **Task `short_description`**: Can be NULL in database
- **Crop Cycle `current_stage`**: Defaults to `CropStage.SOWING` if None
- **Crop Cycle `status`**: Defaults to `CropCycleStatus.OPEN` if None
- **Work Order `task_id`**: Created automatically if not provided (finds or creates default task for crop cycle)


