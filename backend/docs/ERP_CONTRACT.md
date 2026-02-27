# ERP API Contract Documentation

**Version:** 1.0.0  
**Last Updated:** 2024  
**Database:** PostgreSQL (Supabase)  
**API Framework:** FastAPI

---

## Table of Contents

1. [Database Schema](#database-schema)
2. [Enum Types](#enum-types)
3. [API Endpoints](#api-endpoints)
4. [Field Ownership Rules](#field-ownership-rules)
5. [Deletion Rules](#deletion-rules)

---

## Database Schema

### Table: `crop_cycles`

| Column Name | Type | Nullable | Default | Description |
|------------|------|----------|---------|-------------|
| `crop_cycle_id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `incident_no` | VARCHAR(20) | NO | - | Unique human-readable ID (CC0001, CC0002, etc.) |
| `field_code` | VARCHAR | NO | - | Reference to field |
| `created_by` | UUID | YES | - | FK to `users.user_id` |
| `crop_name` | VARCHAR(100) | NO | - | Name of crop |
| `seed_category` | VARCHAR(100) | YES | - | Seed variety/category |
| `season` | VARCHAR(20) | YES | - | kharif / rabi / zaid |
| `cultivated_area` | NUMERIC(10,2) | YES | - | Area in acres |
| `seed_quantity` | NUMERIC(10,2) | YES | - | Seed quantity |
| `sowing_date` | DATE | NO | - | Sowing date |
| `expected_harvest_date` | DATE | YES | - | Expected harvest date |
| `actual_harvest_date` | DATE | YES | - | Actual harvest date |
| `current_stage` | `cycle_stage_enum` | NO | `'sowing'` | Current lifecycle stage |
| `status` | `cycle_status_enum` | NO | `'open'` | Cycle status |
| `total_expense` | NUMERIC(14,2) | YES | `0` | Total expenses |
| `total_revenue` | NUMERIC(14,2) | YES | `0` | Total revenue |
| `profit` | NUMERIC(14,2) | YES | `0` | Calculated profit |
| `resolved_date` | DATE | YES | - | Resolution date |
| `resolution_comments` | VARCHAR | YES | - | Resolution notes |
| `observation` | VARCHAR | YES | - | Observation notes |
| `short_description` | VARCHAR | YES | - | Short description |
| `description` | VARCHAR | YES | - | Full description |
| `created_at` | TIMESTAMP | NO | `now()` | Creation timestamp |
| `updated_at` | TIMESTAMP | NO | `now()` | Last update timestamp |

**Indexes:**
- Primary Key: `crop_cycle_id`
- Unique: `incident_no`

---

### Table: `tasks`

| Column Name | Type | Nullable | Default | Description |
|------------|------|----------|---------|-------------|
| `task_id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `task_number` | VARCHAR(20) | NO | - | Unique human-readable ID (TSK0001, TSK0002, etc.) |
| `crop_cycle_id` | UUID | NO | - | FK to `crop_cycles.crop_cycle_id` |
| `category` | `task_category_enum` | YES | - | Task category |
| `subcategory` | `task_subcategory_enum` | YES | - | Task subcategory |
| `short_description` | VARCHAR(200) | NO | - | Short task description |
| `description` | TEXT | YES | - | Full task description |
| `assigned_to_id` | UUID | NO | - | FK to `users.user_id` |
| `created_by_id` | UUID | NO | - | FK to `users.user_id` |
| `status` | `task_status_enum` | NO | `'new'` | Task status |
| `on_hold_reason` | TEXT | YES | - | Reason if status is `on_hold` |
| `resolved_date` | TIMESTAMP | YES | - | Resolution timestamp |
| `resolution_comments` | TEXT | YES | - | Resolution notes |
| `observation` | TEXT | YES | - | Observation notes |
| `severity` | `severity_enum` | YES | - | Severity level |
| `total_expense` | NUMERIC(14,2) | YES | `0` | Total task expenses |
| `created_at` | TIMESTAMP | NO | `now()` | Creation timestamp |
| `updated_at` | TIMESTAMP | NO | `now()` | Last update timestamp |
| `closed_at` | TIMESTAMP | YES | - | Closure timestamp |

**Indexes:**
- Primary Key: `task_id`
- Unique: `task_number`
- Foreign Key: `crop_cycle_id` → `crop_cycles.crop_cycle_id` (RESTRICT on delete)

---

### Table: `work_orders`

| Column Name | Type | Nullable | Default | Description |
|------------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `work_order_no` | VARCHAR | YES | - | Unique human-readable ID (WO0001, WO0002, etc.) |
| `task_id` | UUID | NO | - | FK to `tasks.task_id` |
| `title` | TEXT | NO | - | Work order title |
| `description` | TEXT | YES | - | Work order description |
| `assigned_to` | UUID | YES | - | FK to `users.user_id` |
| `created_by` | UUID | YES | - | FK to `users.user_id` |
| `status` | `work_order_status_enum` | YES | `'open'` | Work order status |
| `due_date` | DATE | YES | - | Due date |
| `created_at` | TIMESTAMP | NO | `now()` | Creation timestamp |
| `updated_at` | TIMESTAMP | NO | `now()` | Last update timestamp |
| `closed_at` | TIMESTAMP | YES | - | Closure timestamp |

**Indexes:**
- Primary Key: `id`
- Unique: `work_order_no` (nullable)
- Foreign Key: `task_id` → `tasks.task_id` (CASCADE on delete)

---

### Table: `work_order_resources`

| Column Name | Type | Nullable | Default | Description |
|------------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `work_order_id` | UUID | NO | - | FK to `work_orders.id` |
| `resource_type` | `resource_type_enum` | NO | - | Type of resource |
| `name` | TEXT | NO | - | Resource name (e.g., Diesel, Urea, Tractor) |
| `qty` | NUMERIC(10,2) | NO | - | Quantity |
| `unit` | TEXT | NO | - | Unit (litre / kg / hour / acre) |
| `rate` | NUMERIC(12,2) | YES | - | Rate per unit |
| `cost` | NUMERIC(14,2) | NO | - | Total cost |
| `created_at` | TIMESTAMP | NO | `now()` | Creation timestamp |

**Indexes:**
- Primary Key: `id`
- Foreign Key: `work_order_id` → `work_orders.id` (CASCADE on delete)

---

## Enum Types

All enum values are **lowercase** in the database. Python enum classes use UPPERCASE names but lowercase values.

### `cycle_stage_enum` (Crop Lifecycle Stage)

- `sowing`
- `germination`
- `vegetative`
- `flowering`
- `fruiting`
- `harvest`
- `storage`
- `sale`
- `payment`

### `cycle_status_enum` (Crop Cycle Status)

- `open`
- `resolved`
- `reopened`
- `closed`
- `cancelled`

### `task_category_enum` (Task Category)

- `sowing`
- `irrigation`
- `fertilizer`
- `harvest`
- `fuel`
- `sale`
- `storage`

### `task_subcategory_enum` (Task Subcategory)

- `khurar`
- `rotavator`
- `leveling`
- `seeding`
- `ploughing`
- `mulching`
- `paleva`
- `first_irrigation`
- `second_irrigation`
- `third_irrigation`
- `fourth_irrigation`
- `fifth_irrigation`
- `contract_irrigation`
- `seed_treatment`
- `dap`
- `urea`
- `pesticide`
- `potash`
- `zinc`
- `sulfur`
- `super_phosphate`
- `manual_cutting`
- `thresher`
- `harvester`
- `winnowing`
- `contract_harvest`
- `diesel`
- `petrol`
- `mandi_sale`
- `society_sale`
- `farm_id`
- `warehouse`
- `other`

### `task_status_enum` (Task Status)

- `new`
- `in_progress`
- `on_hold`
- `resolved`
- `reopened`
- `closed`
- `cancelled`

### `severity_enum` (Task Severity)

- `sev1`
- `sev2`
- `sev3`
- `sev4`

### `work_order_status_enum` (Work Order Status)

- `open`
- `in_progress`
- `on_hold`
- `completed`
- `partial`
- `closed`
- `cancelled`

### `resource_type_enum` (Resource Type)

- `labor`
- `fuel`
- `material`
- `machine`
- `water`
- `service`
- `contract`
- `other`

---

## API Endpoints

### Authentication

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/auth/login` | User login | No |

### Users

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/users/` | Get all users | Yes |
| POST | `/api/users/` | Create user | Yes |
| GET | `/api/users/me` | Get current user | Yes |

### Fields

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/fields/` | Get all fields | Yes |
| GET | `/api/fields/{field_id}` | Get field by ID | Yes |
| POST | `/api/fields/` | Create field | Yes |
| PUT | `/api/fields/{field_id}` | Update field | Yes |
| DELETE | `/api/fields/{field_id}` | Delete field | Yes |

### Crop Cycles

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/crop-cycles/` | Get all crop cycles (excludes resolved) | Yes |
| GET | `/api/crop-cycles/{crop_cycle_id}` | Get crop cycle by ID | Yes |
| POST | `/api/crop-cycles/` | Create crop cycle | Yes |
| PUT | `/api/crop-cycles/{crop_cycle_id}` | Update crop cycle | Yes |
| DELETE | `/api/crop-cycles/{crop_cycle_id}` | Delete crop cycle | Yes |

### Tasks

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/crop-cycles/{crop_cycle_id}/tasks` | Create task | Yes |
| GET | `/api/crop-cycles/{crop_cycle_id}/tasks` | Get all tasks for crop cycle | Yes |
| PUT | `/api/crop-cycles/{crop_cycle_id}/tasks/{task_id}` | Update task | Yes |

### Work Orders

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/tasks/{task_id}/work-orders` | Create work order | Yes |
| GET | `/api/tasks/{task_id}/work-orders` | Get all work orders for task | Yes |

### Work Order Resources

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/work-orders/{work_order_id}/resources` | Add resource to work order | Yes |
| GET | `/api/work-orders/{work_order_id}/resources` | Get all resources for work order | Yes |

### General Expenses

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/general-expenses/` | Get all general expenses | Yes |
| GET | `/api/general-expenses/{expense_id}` | Get expense by ID | Yes |
| POST | `/api/general-expenses/` | Create expense | Yes |
| PUT | `/api/general-expenses/{expense_id}` | Update expense | Yes |
| DELETE | `/api/general-expenses/{expense_id}` | Delete expense | Yes |

### Crop Cycle Notes

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/crop-cycle-notes/{crop_cycle_id}/notes` | Create note | Yes |
| GET | `/crop-cycle-notes/{crop_cycle_id}/notes` | Get all notes for crop cycle | Yes |
| GET | `/crop-cycle-notes/{crop_cycle_id}/notes/{note_id}` | Get note by ID | Yes |
| PUT | `/crop-cycle-notes/{crop_cycle_id}/notes/{note_id}` | Update note | Yes |
| DELETE | `/crop-cycle-notes/{crop_cycle_id}/notes/{note_id}` | Delete note | Yes |

### Crops Catalog

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/crops/` | Get crop catalog | Yes |

### Chatbot (AI Features)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/chatbot/work-order/parse` | Parse work order from text | Yes |
| POST | `/api/chatbot/task/parse` | Parse task from text | Yes |
| POST | `/api/chatbot/work-order/preview` | Preview work order form | Yes |
| POST | `/api/chatbot/task/preview` | Preview task form | Yes |
| POST | `/api/chatbot/work-order/create` | Create work order via chatbot | Yes |
| POST | `/api/chatbot/task/create` | Create task via chatbot | Yes |
| POST | `/api/chatbot/voice/process` | Process voice input | Yes |
| POST | `/api/chatbot/chat` | Chat with AI | Yes |
| POST | `/api/chatbot/voice` | Voice chat | Yes |
| POST | `/api/chatbot/context/clear` | Clear chat context | Yes |

---

## Field Ownership Rules

### Server-Generated Fields (Never Accept from Frontend)

These fields are **always** generated or set by the backend:

1. **`crop_cycles.incident_no`**
   - Format: `CC0001`, `CC0002`, etc.
   - Generated by: `generate_incident_id(db)`
   - Frontend must NOT send this field

2. **`tasks.task_number`**
   - Format: `TSK0001`, `TSK0002`, etc.
   - Generated by: `generate_task_id(db)`
   - Frontend must NOT send this field

3. **`work_orders.work_order_no`**
   - Format: `WO0001`, `WO0002`, etc.
   - Generated by: `generate_work_order_id(db)`
   - Frontend must NOT send this field

4. **`crop_cycles.created_by`**
   - Always set from: `current_user.user_id` (JWT token)
   - Frontend must NOT send this field
   - Backend removes any `created_by` from request payload

5. **`tasks.created_by_id`**
   - Always set from: `current_user.user_id` (JWT token)
   - Frontend must NOT send this field

6. **`work_orders.created_by`**
   - Always set from: `current_user.user_id` (JWT token)
   - Frontend must NOT send this field

7. **`crop_cycles.created_at`** / **`crop_cycles.updated_at`**
   - Auto-generated by database or backend
   - Frontend must NOT send these fields

8. **`tasks.created_at`** / **`tasks.updated_at`**
   - Auto-generated by database
   - Frontend must NOT send these fields

9. **`work_orders.created_at`** / **`work_orders.updated_at`**
   - Auto-generated by database
   - Frontend must NOT send these fields

### Frontend-Provided Fields

These fields are accepted from the frontend:

- **Crop Cycles:** `field_code`, `crop_name`, `seed_category`, `season`, `cultivated_area`, `seed_quantity`, `sowing_date`, `expected_harvest_date`, `current_stage`, `status`, `short_description`, `description`
- **Tasks:** `category`, `subcategory`, `short_description`, `description`, `assigned_to_id`, `severity`, `status` (on update), `on_hold_reason`, `resolution_comments`, `observation`
- **Work Orders:** `title`, `description`, `assigned_to`, `due_date`
- **Work Order Resources:** `resource_type`, `name`, `qty`, `unit`, `rate`, `cost`

---

## Deletion Rules

### Foreign Key Constraints and Cascade Behavior

1. **`tasks.crop_cycle_id` → `crop_cycles.crop_cycle_id`**
   - **On Delete:** `RESTRICT`
   - **Rule:** Cannot delete a crop cycle if it has tasks
   - **Action Required:** Delete all tasks first, then delete crop cycle

2. **`work_orders.task_id` → `tasks.task_id`**
   - **On Delete:** `CASCADE`
   - **Rule:** Deleting a task automatically deletes all its work orders
   - **Action Required:** None (automatic)

3. **`work_order_resources.work_order_id` → `work_orders.id`**
   - **On Delete:** `CASCADE`
   - **Rule:** Deleting a work order automatically deletes all its resources
   - **Action Required:** None (automatic)

### Deletion Hierarchy

To delete a crop cycle:
1. Delete all work order resources (via work orders)
2. Delete all work orders (via tasks)
3. Delete all tasks
4. Delete crop cycle

**Recommended Deletion Order:**
```
Crop Cycle
  └─ Tasks (RESTRICT - must delete manually)
      └─ Work Orders (CASCADE - auto-deleted with task)
          └─ Work Order Resources (CASCADE - auto-deleted with work order)
```

### Safe Deletion Pattern

```python
# Pseudo-code for safe deletion
def delete_crop_cycle_safely(crop_cycle_id):
    # 1. Get all tasks
    tasks = get_tasks_for_cycle(crop_cycle_id)
    
    # 2. For each task, delete work orders (resources cascade automatically)
    for task in tasks:
        work_orders = get_work_orders_for_task(task.task_id)
        for wo in work_orders:
            delete_work_order_resources(wo.id)  # Optional - cascades anyway
            delete_work_order(wo.id)  # Resources cascade
    
    # 3. Delete all tasks
    for task in tasks:
        delete_task(task.task_id)  # Work orders cascade
    
    # 4. Now safe to delete crop cycle
    delete_crop_cycle(crop_cycle_id)
```

---

## Important Notes

1. **All enum values are lowercase** in the database. Python enum classes use UPPERCASE names but lowercase `.value` properties.

2. **Authentication:** All endpoints (except `/api/auth/login`) require JWT authentication via `Authorization: Bearer <token>` header.

3. **UUIDs:** All primary keys and foreign keys use UUID type. Frontend should handle UUIDs as strings.

4. **Timestamps:** All `created_at` and `updated_at` fields are automatically managed by the database or backend. Do not send these from frontend.

5. **Status Transitions:** 
   - When task status changes to `resolved`, `resolved_date` is automatically set to current timestamp
   - When task status is `on_hold`, `on_hold_reason` is required

6. **Financial Fields:** `total_expense`, `total_revenue`, and `profit` are typically calculated fields. Frontend should not directly set these unless explicitly allowed.

---

**End of Contract Documentation**
