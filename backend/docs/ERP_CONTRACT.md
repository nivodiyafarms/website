# ERP API Contract Documentation

**Version:** 1.1.0  
**Last Updated:** March 2026  
**Database:** PostgreSQL (Supabase)  
**API Framework:** FastAPI  

**Schema source:** Table and column names below are aligned with `backend/app/models/*.py` (SQLAlchemy ↔ Supabase `public` schema). If Supabase differs, treat the database as authoritative and update models + this doc together.

---

## Table of Contents

1. [Database Schema](#database-schema)
2. [Enum Types](#enum-types)
3. [API Endpoints](#api-endpoints)
4. [Field Ownership Rules](#field-ownership-rules)
5. [Deletion Rules](#deletion-rules)

---

## Database Schema

Tables below use **Supabase `public` column names** as implemented in `backend/app/models/*.py`.

---

### Table: `users`

| Column (DB) | Type | Nullable | Description |
|-------------|------|----------|-------------|
| `user_id` | UUID | NO | Primary key |
| `name` | VARCHAR(64) | NO | Display name |
| `phone` | VARCHAR(15) | NO | Unique login phone |
| `password` | VARCHAR(255) | NO | Hashed password |
| `role` | `userrole` (enum) | NO | `admin`, `supervisor`, `worker` |
| `language` | `userlanguage` (enum) | YES | `en_in`, `hi_in` |

**Indexes / constraints:** PK `user_id`; UNIQUE `phone`

---

### Table: `fields`

| Column (DB) | Type | Nullable | Description |
|-------------|------|----------|-------------|
| `field_id` | TEXT / VARCHAR | NO | Primary key (business id, e.g. NID001) |
| `name` | VARCHAR(64) | NO | Field name |
| `area_acre` | DOUBLE PRECISION | NO | Area in acres |
| `gps_centroid_lat` | DOUBLE PRECISION | YES | Map centroid latitude |
| `gps_centroid_lng` | DOUBLE PRECISION | YES | Map centroid longitude |
| `village` | VARCHAR(100) | YES | Village |
| `ownership` | VARCHAR(50) | YES | Ownership label |

**Indexes / constraints:** PK `field_id`

---

### Table: `crop_cycles`

| Column (DB) | Type | Nullable | Default | Description |
|-------------|------|----------|---------|-------------|
| `crop_cycle_id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `incident_no` | VARCHAR(20) | NO | - | Unique human-readable id (CC0001, …) |
| `field_code` | VARCHAR / TEXT | NO | - | FK logical ref → `fields.field_id` |
| `created_by` | UUID | YES | - | FK → `users.user_id` |
| `crop_name` | VARCHAR(100) | NO | - | Crop name |
| `seed_category` | VARCHAR(100) | YES | - | Seed variety/category |
| `season` | VARCHAR(20) | YES | - | kharif / rabi / zaid |
| `cultivated_area` | NUMERIC(10,2) | YES | - | Area in acres |
| `seed_quantity` | NUMERIC(10,2) | YES | - | Seed quantity |
| `sowing_date` | DATE | NO | - | Sowing date |
| `expected_harvest_date` | DATE | YES | - | Expected harvest |
| `actual_harvest_date` | DATE | YES | - | Actual harvest |
| `current_stage` | `cycle_stage_enum` | NO | `sowing` | Lifecycle stage |
| `status` | `cycle_status_enum` | NO | `open` | Cycle status |
| `total_expense` | NUMERIC(14,2) | YES | `0` | Rolled-up expense |
| `total_revenue` | NUMERIC(14,2) | YES | `0` | Rolled-up revenue |
| `profit` | NUMERIC(14,2) | YES | `0` | Profit |
| `resolved_date` | DATE | YES | - | Resolution date |
| `resolution_comments` | VARCHAR / TEXT | YES | - | Resolution notes |
| `observation` | VARCHAR / TEXT | YES | - | Observation |
| `short_description` | VARCHAR / TEXT | YES | - | Short description |
| `description` | VARCHAR / TEXT | YES | - | Full description |
| `created_at` | TIMESTAMP | NO | server default | Created |
| `updated_at` | TIMESTAMP | NO | server default | Updated |

**Indexes / constraints:** PK `crop_cycle_id`; UNIQUE `incident_no`

**ORM note:** Python attribute `CropCycle.id` maps to column `crop_cycle_id`.

---

### Table: `tasks`

| Column (DB) | Type | Nullable | Default | Description |
|-------------|------|----------|---------|-------------|
| `task_id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `task_number` | VARCHAR(20) | NO | - | Unique human-readable id (TSK0001, …) |
| `crop_cycle_id` | UUID | NO | - | FK → `crop_cycles.crop_cycle_id` **ON DELETE RESTRICT** |
| `category` | `task_category_enum` | YES | - | Task category |
| `subcategory` | `task_subcategory_enum` | YES | - | Task subcategory |
| `short_description` | VARCHAR(200) | NO | - | Short description |
| `description` | TEXT | YES | - | Full description |
| `assigned_to_id` | UUID | NO | - | FK → `users.user_id` |
| `created_by_id` | UUID | NO | - | FK → `users.user_id` |
| `status` | `task_status_enum` | NO | `new` | Task status |
| `on_hold_reason` | TEXT | YES | - | Required when `on_hold` |
| `resolved_date` | TIMESTAMPTZ | YES | - | Resolution time |
| `resolution_comments` | TEXT | YES | - | Resolution notes |
| `observation` | TEXT | YES | - | Observation |
| `severity` | `severity_enum` | YES | - | Severity |
| `total_expense` | NUMERIC(14,2) | YES | `0` | Task expense total |
| `created_at` | TIMESTAMPTZ | NO | - | Created |
| `updated_at` | TIMESTAMPTZ | NO | - | Updated |
| `closed_at` | TIMESTAMPTZ | YES | - | Closed |

**Indexes / constraints:** PK `task_id`; UNIQUE `task_number`; FK `crop_cycle_id` → `crop_cycles.crop_cycle_id` (RESTRICT)

---

### Table: `work_orders`

| Column (DB) | Type | Nullable | Default | Description |
|-------------|------|----------|---------|-------------|
| `work_order_id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `work_order_number` | VARCHAR / TEXT | NO | - | Unique human-readable id (WO0001, …) |
| `task_id` | UUID | NO | - | FK → `tasks.task_id` **ON DELETE CASCADE** |
| `short_description` | TEXT | NO | - | Short title / summary |
| `description` | TEXT | YES | - | Long description |
| `assigned_to` | UUID | YES | - | FK → `users.user_id` |
| `created_by` | UUID | YES | - | FK → `users.user_id` |
| `status` | `work_order_status_enum` | YES | `open` | Work order status |
| `due_date` | DATE | YES | - | Due date |
| `created_at` | TIMESTAMPTZ | NO | - | Created |
| `updated_at` | TIMESTAMPTZ | NO | - | Updated |
| `closed_at` | TIMESTAMPTZ | YES | - | Closed |

**Indexes / constraints:** PK `work_order_id`; UNIQUE `work_order_number`; FK `task_id` → `tasks.task_id` (CASCADE)

---

### Table: `work_order_resources`

| Column (DB) | Type | Nullable | Description |
|-------------|------|----------|-------------|
| `work_order_resources_id` | UUID | NO | Primary key |
| `work_order_id` | UUID | NO | FK → `work_orders.work_order_id` **ON DELETE CASCADE** |
| `resource_type` | `resource_type_enum` | NO | Resource type |
| `name` | TEXT | NO | Resource name |
| `qty` | NUMERIC(10,2) | NO | Quantity |
| `unit` | TEXT | NO | Unit |
| `rate` | NUMERIC(12,2) | YES | Rate per unit |
| `cost` | NUMERIC(14,2) | NO | Line cost |
| `created_at` | TIMESTAMPTZ | NO | Created |

**Indexes / constraints:** PK `work_order_resources_id`; FK `work_order_id` → `work_orders.work_order_id` (CASCADE)

---

### Table: `general_expense`

| Column (DB) | Type | Nullable | Description |
|-------------|------|----------|-------------|
| `general_expense_id` | UUID | NO | Primary key |
| `category` | TEXT | YES | Category |
| `subcategory` | TEXT | YES | Subcategory |
| `description` | TEXT | YES | Description |
| `date` | DATE | YES | Expense date |
| `qty` | NUMERIC | YES | Quantity |
| `unit` | TEXT | YES | Unit |
| `unit_rate` | NUMERIC | YES | Unit rate |
| `total_cost` | NUMERIC | YES | Total cost |
| `related_type` | TEXT | YES | Optional polymorphic type |
| `related_id` | UUID | YES | Optional polymorphic id |
| `created_by` | UUID | YES | FK → `users.user_id` (logical) |
| `created_at` | TIMESTAMPTZ | YES | Created |

**Indexes / constraints:** PK `general_expense_id`

---

### Table: `notes`

Polymorphic notes (crop cycles, tasks, work orders, expenses). Stored as `public.notes`.

| Column (DB) | Type | Nullable | Description |
|-------------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `related_type` | `related_type_enum` | YES | `crop_cycle`, `task`, `work_order`, `expense` |
| `related_id` | UUID | YES | Target row id |
| `author_id` | UUID | YES | FK → `users.user_id` (optional) |
| `text` | TEXT | YES | Note body |
| `media_url` | VARCHAR / TEXT | YES | Attachment URL |
| `media_type` | VARCHAR(20) | YES | MIME / type hint |
| `created_at` | TIMESTAMPTZ | YES | Created |

**Indexes / constraints:** PK `id`

---

### Table: `crop_cycle_incidents` (legacy / parallel schema)

Present in `app/models/crop_cycle_incident.py`. **Application tasks** in the current ORM link to **`crop_cycles.crop_cycle_id`**, not this table. Confirm in Supabase whether this table is still populated and whether any FKs point to it.

| Column (DB) | Type | Nullable | Description |
|-------------|------|----------|-------------|
| `incident_id` | UUID | NO | Primary key |
| `field_id` | VARCHAR(50) | NO | FK → `fields.field_id` |
| `crop_name` | VARCHAR(100) | NO | Crop name |
| `crop_variety` | VARCHAR(100) | YES | Variety |
| `sowing_date` | TIMESTAMP | NO | Sowing |
| `expected_harvest_date` | TIMESTAMP | YES | Expected harvest |
| `current_stage` | VARCHAR(11) | NO | Stage (string) |
| `status` | VARCHAR(6) | NO | Status (string) |
| `supervisor_id` | UUID | NO | FK → `users.user_id` |
| `short_description` | VARCHAR(200) | YES | Short description |
| `description` | TEXT | YES | Description |
| `notes` | TEXT | YES | Notes |
| `opened_at` | TIMESTAMP | NO | Opened |
| `updated_at` | TIMESTAMP | NO | Updated |
| `closed_at` | TIMESTAMP | YES | Closed |
| `is_voice_recorded` | VARCHAR(10) | NO | Default `no` |
| `audio_file_path` | VARCHAR(500) | YES | Audio path |
| `transcript` | TEXT | YES | Transcript |

**Indexes / constraints:** PK `incident_id`

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
- `construction`

### `related_type_enum` (Notes — `notes.related_type`)

- `crop_cycle`
- `task`
- `work_order`
- `expense`

### `userrole` (Users — `users.role`)

- `admin`
- `supervisor`
- `worker`

### `userlanguage` (Users — `users.language`)

- `en_in`
- `hi_in`

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

### WhatsApp (Twilio webhook)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/whatsapp/webhook` | Twilio WhatsApp status/message webhook (form-data) | No (Twilio) |

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

3. **`work_orders.work_order_number`**
   - Format: `WO0001`, `WO0002`, etc.
   - Generated by: `generate_work_order_id(db)` (or equivalent)
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
- **Work Orders:** `short_description`, `description`, `assigned_to`, `due_date`
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

3. **`work_order_resources.work_order_id` → `work_orders.work_order_id`**
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
            delete_work_order_resources(wo.work_order_id)  # Optional - cascades anyway
            delete_work_order(wo.work_order_id)  # Resources cascade
    
    # 3. Delete all tasks
    for task in tasks:
        delete_task(task.task_id)  # Work orders cascade
    
    # 4. Now safe to delete crop cycle
    delete_crop_cycle(crop_cycle_id)
```

---

## Important Notes

1. **All enum values are lowercase** in the database. Python enum classes use UPPERCASE names but lowercase `.value` properties.

2. **Authentication:** Most endpoints require JWT via `Authorization: Bearer <token>`. Exceptions include **`POST /api/auth/login`** and integration webhooks such as **`POST /api/whatsapp/webhook`** (Twilio; not JWT — validate via Twilio signature in production).

3. **Primary keys:** Most tables use UUID PKs; **`fields`** uses a string `field_id` (business key). Frontend should send UUIDs as strings where applicable.

4. **Timestamps:** All `created_at` and `updated_at` fields are automatically managed by the database or backend. Do not send these from frontend.

5. **Status Transitions:** 
   - When task status changes to `resolved`, `resolved_date` is automatically set to current timestamp
   - When task status is `on_hold`, `on_hold_reason` is required

6. **Financial Fields:** `total_expense`, `total_revenue`, and `profit` are typically calculated fields. Frontend should not directly set these unless explicitly allowed.

---

**End of Contract Documentation**
