# 📊 Nivodiya Farms Database Schema Documentation

Complete database schema documentation for the Nivodiya Farms Management System.

---

## 🎯 Overview

The database is built on **PostgreSQL** and uses **SQLAlchemy ORM** for object-relational mapping. The system manages the complete lifecycle of farm operations from crop sowing to payment, including incident tracking, task management, and resource allocation.

---

## 📐 Database Architecture

### Core Concepts

1. **User Management** - Multi-role user system (Admin, Supervisor, Worker)
2. **Field Management** - Geographic field tracking with GPS coordinates
3. **Crop Cycle Management** - Complete crop lifecycle from sowing to payment
4. **Task Management** - Individual activities within crop cycles with resource tracking
5. **Incident Management** - Farm incident reporting and resolution
6. **Resource Management** - Materials, equipment, and labor tracking

---

## 📋 Database Tables

### 1. **users** - User Management

Manages all system users with role-based access control.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | UUID | PRIMARY KEY | Unique user identifier |
| `name` | VARCHAR(64) | NOT NULL | Full name of the user |
| `phone` | VARCHAR(15) | UNIQUE, NOT NULL | Phone number (login credential) |
| `password` | VARCHAR(255) | NOT NULL | Hashed password |
| `role` | ENUM(UserRole) | NOT NULL | ADMIN, SUPERVISOR, or WORKER |
| `language` | ENUM(UserLanguage) | DEFAULT 'en-IN' | en-IN or hi-IN (Hindi) |

**Enums:**
- `UserRole`: ADMIN, SUPERVISOR, WORKER
- `UserLanguage`: EN_IN (English), HI_IN (Hindi)

**Relationships:**
- One-to-Many with `crop_cycle_incidents` (as supervisor)
- One-to-Many with `tasks` (as assigned_to, created_by, approved_by)
- One-to-Many with `work_orders` (as assigned_to, created_by)
- One-to-Many with `incidents` (as reported_by, assigned_to)

**Example:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Rajesh Sharma",
  "phone": "9876543211",
  "role": "SUPERVISOR",
  "language": "hi-IN"
}
```

---

### 2. **fields** - Field Management

Stores information about farm fields with GPS boundaries.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `field_id` | VARCHAR | PRIMARY KEY | Custom field ID (e.g., "F_001") |
| `name` | VARCHAR(64) | NOT NULL | Field name |
| `area_acre` | FLOAT | NOT NULL | Area in acres |
| `soil_type` | ENUM(SoilType) | NULL | BLACK, MIX, SANDY, LOAM |
| `gps_polygon` | JSONB | NULL | GeoJSON polygon for boundaries |
| `gps_centroid_lat` | FLOAT | NULL | Latitude of field center |
| `gps_centroid_lng` | FLOAT | NULL | Longitude of field center |
| `village` | VARCHAR(100) | NULL | Village name |

**Enums:**
- `SoilType`: BLACK, MIX, SANDY, LOAM

**Relationships:**
- One-to-Many with `crop_cycle_incidents`
- One-to-Many with `incidents`

**Example:**
```json
{
  "field_id": "F_001",
  "name": "North Field",
  "area_acre": 5.5,
  "soil_type": "BLACK",
  "gps_centroid_lat": 21.1234,
  "gps_centroid_lng": 79.5678,
  "village": "Wardha"
}
```

---

### 3. **crop_cycle_incidents** - Crop Cycle Management (MAIN TABLE)

**The heart of the system** - Tracks the complete lifecycle of a crop from sowing to payment.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `incident_id` | UUID | PRIMARY KEY | Unique crop cycle identifier |
| `field_id` | VARCHAR(50) | FK → fields | Field where crop is planted |
| `crop_name` | VARCHAR(100) | NOT NULL | Name of the crop (e.g., "Moringa") |
| `crop_variety` | VARCHAR(100) | NULL | Crop variety |
| `sowing_date` | DATETIME | NOT NULL | Date when crop was sown |
| `expected_harvest_date` | DATETIME | NULL | Expected harvest date |
| `current_stage` | ENUM(CropStage) | NOT NULL | Current stage in lifecycle |
| `status` | ENUM(CropCycleStatus) | NOT NULL | OPEN or CLOSED |
| `supervisor_id` | UUID | FK → users | Supervising user |
| `short_description` | VARCHAR(200) | NULL | Brief description |
| `description` | TEXT | NULL | Detailed description |
| `notes` | TEXT | NULL | Additional notes |
| `opened_at` | DATETIME | NOT NULL | When cycle was created |
| `updated_at` | DATETIME | NOT NULL | Last update time |
| `closed_at` | DATETIME | NULL | When cycle was completed |
| `is_voice_recorded` | VARCHAR(10) | DEFAULT 'false' | Voice recording flag |
| `audio_file_path` | VARCHAR(500) | NULL | Path to audio file |
| `transcript` | TEXT | NULL | Audio transcription |

**Enums:**

**CropStage** (9 stages - Complete Lifecycle):
```
SOWING          → Initial planting
GERMINATION     → Seeds sprouting
VEGETATIVE      → Plant growth phase
FLOWERING       → Flowering stage
FRUITING        → Fruit/pod development
HARVEST         → Harvesting
STORAGE         → Post-harvest storage
SALE            → Selling produce
PAYMENT         → Payment received
```

**CropCycleStatus**: OPEN, CLOSED

**Relationships:**
- Many-to-One with `fields`
- Many-to-One with `users` (supervisor)
- One-to-Many with `tasks` (child incidents)
- One-to-Many with `work_orders`

**Example:**
```json
{
  "incident_id": "db05e475-9b89-499f-8b02-e62efa496e0e",
  "field_id": "F_001",
  "crop_name": "Moringa",
  "crop_variety": "PKM-1",
  "sowing_date": "2024-01-15T00:00:00",
  "expected_harvest_date": "2024-04-15T00:00:00",
  "current_stage": "FLOWERING",
  "status": "OPEN",
  "supervisor_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### 4. **tasks** - Task/Activity Management (Child Incidents)

Individual activities and operations within a crop cycle with detailed resource tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `task_id` | UUID | PRIMARY KEY | Unique task identifier |
| `crop_cycle_id` | UUID | FK → crop_cycle_incidents | Parent crop cycle |
| `task_type` | ENUM(TaskType) | NOT NULL | Type of task |
| `short_description` | VARCHAR(200) | NOT NULL | Brief description |
| `description` | TEXT | NULL | Detailed description |
| `assigned_to_id` | UUID | FK → users | Worker assigned |
| `created_by_id` | UUID | FK → users | Creator |
| `approved_by_id` | UUID | FK → users | Approver |
| `occurred_at` | DATETIME | NULL | When task was performed |
| `labor_count` | INTEGER | NULL | Number of workers |
| `labor_hours` | FLOAT | NULL | Hours worked |
| `total_cost` | FLOAT | NOT NULL | Total cost of task |
| `outcome_observation` | TEXT | NULL | Results/observations |
| `severity` | ENUM(SeverityLevel) | NULL | Auto-assigned based on cost |
| `status` | ENUM(TaskStatus) | NOT NULL | Current status |
| `on_hold_reason` | TEXT | NULL | Reason if on hold |
| `resolution_notes` | TEXT | NULL | Resolution details |
| `gps_lat` | FLOAT | NULL | GPS latitude |
| `gps_lng` | FLOAT | NULL | GPS longitude |
| `attachments` | TEXT | NULL | JSON array of file paths |
| `created_at` | DATETIME | NOT NULL | Creation timestamp |
| `updated_at` | DATETIME | NOT NULL | Last update |
| `closed_at` | DATETIME | NULL | Completion timestamp |
| `is_voice_recorded` | VARCHAR(10) | DEFAULT 'false' | Voice recording flag |
| `audio_file_path` | VARCHAR(500) | NULL | Audio file path |
| `transcript` | TEXT | NULL | Voice transcription |

**Enums:**

**TaskType** (16 types):
```
IRRIGATION      → Water management
FERTILIZER      → Fertilizer application
PESTICIDE       → Pesticide application
FUNGICIDE       → Fungicide application
HERBICIDE       → Herbicide application
WEEDING         → Manual weeding
LABOR           → General labor
SPRAY           → Spraying operations
SCOUTING        → Field scouting/inspection
TRANSPORT       → Transportation
HARVEST         → Harvesting activity
STORAGE_IN      → Moving to storage
STORAGE_OUT     → Taking from storage
SALE            → Sales activity
PAYMENT         → Payment processing
OTHER           → Other activities
```

**TaskStatus**: NEW, IN_PROGRESS, ON_HOLD, RESOLVED, CLOSED, REOPENED, CANCELLED

**SeverityLevel** (Auto-assigned based on cost):
```
SEV_1 (Critical)  → Cost >= ₹50,000
SEV_2 (High)      → Cost >= ₹20,000
SEV_3 (Medium)    → Cost >= ₹5,000
SEV_4 (Low)       → Cost < ₹5,000
```

**Relationships:**
- Many-to-One with `crop_cycle_incidents` (parent)
- Many-to-One with `users` (multiple relationships)
- One-to-Many with `task_resources`

---

### 5. **task_resources** - Resource Tracking

Detailed tracking of resources used in each task (labor, materials, equipment, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `resource_id` | UUID | PRIMARY KEY | Unique resource entry ID |
| `task_id` | UUID | FK → tasks | Parent task |
| `resource_type` | ENUM(ResourceType) | NOT NULL | Type of resource |
| `name` | VARCHAR(200) | NOT NULL | Resource name (e.g., "DAP 18-46-0") |
| `quantity` | FLOAT | NOT NULL | Amount used |
| `unit` | VARCHAR(50) | NOT NULL | Unit (kg, L, hr, acre) |
| `cost_per_unit` | FLOAT | NULL | Cost per unit |
| `total_cost` | FLOAT | NOT NULL | Total cost for this resource |
| `created_at` | DATETIME | NOT NULL | Creation timestamp |

**Enums:**
- `ResourceType`: LABOR, EQUIPMENT, MATERIAL, WATER, FUEL

**Relationships:**
- Many-to-One with `tasks`

**Example:**
```json
{
  "resource_id": "abc123...",
  "task_id": "xyz789...",
  "resource_type": "MATERIAL",
  "name": "DAP 18-46-0",
  "quantity": 50.0,
  "unit": "kg",
  "cost_per_unit": 32.0,
  "total_cost": 1600.0
}
```

---

### 6. **work_orders** - Work Instructions

Work orders/instructions for workers within a crop cycle.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `work_order_id` | UUID | PRIMARY KEY | Unique work order ID |
| `crop_cycle_id` | UUID | FK → crop_cycle_incidents | Parent crop cycle |
| `title` | VARCHAR(200) | NOT NULL | Work order title |
| `description` | TEXT | NOT NULL | Detailed description |
| `instructions` | TEXT | NULL | Step-by-step instructions |
| `assigned_to_id` | UUID | FK → users | Assigned worker |
| `created_by_id` | UUID | FK → users | Creator |
| `due_date` | DATETIME | NULL | Due date |
| `status` | ENUM(WorkOrderStatus) | NOT NULL | Current status |
| `linked_task_ids` | TEXT | NULL | JSON array of linked task UUIDs |
| `created_at` | DATETIME | NOT NULL | Creation timestamp |
| `updated_at` | DATETIME | NOT NULL | Last update |
| `closed_at` | DATETIME | NULL | Completion timestamp |

**Enums:**
- `WorkOrderStatus`: OPEN, IN_PROGRESS, COMPLETED, PARTIALLY_COMPLETE, CANCELLED

**Relationships:**
- Many-to-One with `crop_cycle_incidents`
- Many-to-One with `users` (assigned_to, created_by)

---

### 7. **incidents** - General Incident Reporting

Standalone incident management system for reporting farm issues.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `incident_id` | INTEGER | PRIMARY KEY | Auto-increment ID |
| `title` | VARCHAR(200) | NOT NULL | Incident title |
| `description` | TEXT | NOT NULL | Detailed description |
| `incident_type` | ENUM(IncidentType) | NOT NULL | Type of incident |
| `severity` | ENUM(IncidentSeverity) | NOT NULL | LOW, MEDIUM, HIGH, CRITICAL |
| `status` | ENUM(IncidentStatus) | NOT NULL | Current status |
| `field_id` | VARCHAR(50) | FK → fields | Affected field |
| `location_description` | VARCHAR(500) | NULL | Location details |
| `gps_lat` | FLOAT | NULL | GPS latitude |
| `gps_lng` | FLOAT | NULL | GPS longitude |
| `affected_area_acre` | FLOAT | NULL | Area affected |
| `estimated_loss` | FLOAT | NULL | Financial loss estimate |
| `crop_affected` | VARCHAR(100) | NULL | Crop affected |
| `action_taken` | TEXT | NULL | Actions taken |
| `resolution_notes` | TEXT | NULL | Resolution details |
| `reported_by_user_id` | UUID | FK → users | Reporter |
| `assigned_to_user_id` | UUID | FK → users | Assignee |
| `reported_at` | DATETIME | NOT NULL | Report timestamp |
| `incident_date` | DATETIME | NULL | When incident occurred |
| `resolved_at` | DATETIME | NULL | Resolution timestamp |
| `is_voice_recorded` | VARCHAR(10) | DEFAULT 'false' | Voice recording flag |
| `audio_file_path` | VARCHAR(500) | NULL | Audio file path |
| `transcript` | TEXT | NULL | Voice transcription |

**Enums:**
- `IncidentType`: PEST_ATTACK, DISEASE, WEATHER_DAMAGE, EQUIPMENT_FAILURE, IRRIGATION_ISSUE, THEFT, ANIMAL_DAMAGE, SOIL_ISSUE, OTHER
- `IncidentSeverity`: LOW, MEDIUM, HIGH, CRITICAL
- `IncidentStatus`: REPORTED, IN_PROGRESS, RESOLVED, CLOSED

**Relationships:**
- Many-to-One with `fields`
- Many-to-One with `users` (reported_by, assigned_to)

---

### 8. **crop_catalog** - Crop Reference Data

Master catalog of crops with varieties and growth stages.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY | Auto-increment ID |
| `crop` | VARCHAR(100) | UNIQUE, NOT NULL | Crop name |
| `varieties` | ARRAY[STRING] | NULL | List of varieties |
| `default_stages` | ARRAY[STRING] | NOT NULL | Default growth stages |

**Example:**
```json
{
  "id": 1,
  "crop": "Moringa",
  "varieties": ["PKM-1", "PKM-2", "Bhagya"],
  "default_stages": ["SOWING", "GERMINATION", "VEGETATIVE", "FLOWERING", "FRUITING", "HARVEST"]
}
```

---

### 9. **materials** - Material Catalog

Catalog of farm materials (fertilizers, pesticides, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY | Auto-increment ID |
| `name` | VARCHAR(100) | NOT NULL | Material name |
| `category` | ENUM(MaterialCategory) | NOT NULL | Category |
| `default_unit` | VARCHAR(10) | NOT NULL | Default unit (kg, L) |
| `safety_notes` | TEXT | NULL | Safety instructions |

**Enums:**
- `MaterialCategory`: FERTILIZER, PESTICIDE, FUNGICIDE, HERBICIDE, BIO

**Example:**
```json
{
  "id": 1,
  "name": "DAP 18-46-0",
  "category": "FERTILIZER",
  "default_unit": "kg",
  "safety_notes": "Store in cool, dry place"
}
```

---

### 10. **equipment** - Equipment Catalog

Catalog of farm equipment and machinery.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY | Auto-increment ID |
| `name` | VARCHAR(100) | NOT NULL | Equipment name |
| `type` | ENUM(EquipmentType) | NOT NULL | Equipment type |
| `hourly_rate` | FLOAT | NULL | Rental rate per hour |
| `plate_no` | VARCHAR(20) | NULL | Vehicle registration number |

**Enums:**
- `EquipmentType`: TRACTOR, SPRAYER, PUMP, BOOM

---

## 🔗 Entity Relationships

### Primary Relationships

```
users
  ├─→ crop_cycle_incidents (supervisor)
  ├─→ tasks (assigned_to, created_by, approved_by)
  ├─→ work_orders (assigned_to, created_by)
  └─→ incidents (reported_by, assigned_to)

fields
  ├─→ crop_cycle_incidents
  └─→ incidents

crop_cycle_incidents (PARENT)
  ├─→ tasks (CHILDREN)
  │   └─→ task_resources
  └─→ work_orders
```

### Parent-Child Hierarchy

**Crop Cycle Management (3-Tier System):**

```
Level 1: CROP CYCLE (crop_cycle_incidents)
         ↓
Level 2: TASKS (tasks) + WORK ORDERS (work_orders)
         ↓
Level 3: TASK RESOURCES (task_resources)
```

**Example Flow:**
```
Moringa Crop Cycle (F_001)
├── Task: Fertilizer Application
│   ├── Resource: DAP 18-46-0 (50kg @ ₹32/kg)
│   ├── Resource: Labor (2 workers × 3hrs)
│   └── Resource: Tractor (1hr @ ₹500/hr)
├── Task: Pest Control
│   └── Resource: Pesticide XYZ (5L)
└── Work Order: Harvest Instructions
```

---

## 🎨 Key Features

### 1. **Voice Recording Support**

Multiple tables support voice-based data entry:
- `crop_cycle_incidents`
- `tasks`
- `incidents`

Fields for voice:
- `is_voice_recorded`: "true" or "false"
- `audio_file_path`: Path to audio file
- `transcript`: AI-generated transcription

### 2. **Automatic Cost Calculation**

Tasks automatically calculate `total_cost` by summing all linked `task_resources.total_cost`.

### 3. **Automatic Severity Assignment**

Tasks auto-assign severity based on `total_cost`:
- ≥₹50,000 → SEV_1 (Critical)
- ≥₹20,000 → SEV_2 (High)
- ≥₹5,000 → SEV_3 (Medium)
- <₹5,000 → SEV_4 (Low)

### 4. **GPS Location Tracking**

Multiple tables support GPS coordinates:
- Fields: `gps_polygon`, `gps_centroid_lat/lng`
- Tasks: `gps_lat`, `gps_lng`
- Incidents: `gps_lat`, `gps_lng`

### 5. **Multi-Language Support**

System supports English and Hindi:
- User preference stored in `users.language`
- Voice transcription supports both languages
- AI extraction supports Hindi input

---

## 📊 Data Flow Examples

### Example 1: Creating a New Crop Cycle

```sql
-- 1. Create crop cycle
INSERT INTO crop_cycle_incidents (field_id, crop_name, sowing_date, current_stage, supervisor_id)
VALUES ('F_001', 'Moringa', '2024-01-15', 'SOWING', 'user-uuid');

-- 2. Add fertilizer task
INSERT INTO tasks (crop_cycle_id, task_type, short_description, assigned_to_id, total_cost)
VALUES ('cycle-uuid', 'FERTILIZER', 'Apply DAP', 'worker-uuid', 1600.0);

-- 3. Add resources to task
INSERT INTO task_resources (task_id, resource_type, name, quantity, unit, total_cost)
VALUES ('task-uuid', 'MATERIAL', 'DAP 18-46-0', 50, 'kg', 1600.0);

-- 4. Update stage progression
UPDATE crop_cycle_incidents SET current_stage = 'GERMINATION' WHERE incident_id = 'cycle-uuid';
UPDATE crop_cycle_incidents SET current_stage = 'VEGETATIVE' WHERE incident_id = 'cycle-uuid';
-- ... continue through stages ...
UPDATE crop_cycle_incidents SET current_stage = 'PAYMENT', status = 'CLOSED' WHERE incident_id = 'cycle-uuid';
```

### Example 2: Querying Crop Cycle with All Tasks

```sql
SELECT 
  cc.incident_id,
  cc.crop_name,
  cc.current_stage,
  cc.sowing_date,
  f.name as field_name,
  u.name as supervisor_name,
  COUNT(t.task_id) as total_tasks,
  SUM(t.total_cost) as total_cost_all_tasks
FROM crop_cycle_incidents cc
JOIN fields f ON cc.field_id = f.field_id
JOIN users u ON cc.supervisor_id = u.user_id
LEFT JOIN tasks t ON cc.incident_id = t.crop_cycle_id
WHERE cc.status = 'OPEN'
GROUP BY cc.incident_id, f.name, u.name;
```

---

## 🔒 Database Constraints

### Foreign Key Relationships
- All `user_id` references → `users.user_id` (UUID)
- All `field_id` references → `fields.field_id` (VARCHAR)
- All `crop_cycle_id` references → `crop_cycle_incidents.incident_id` (UUID)
- All `task_id` references → `tasks.task_id` (UUID)

### Cascade Behavior
- Deleting a `crop_cycle_incident` → Cascades to all tasks and work orders
- Deleting a `task` → Cascades to all task_resources
- Deleting audio files when records are deleted (handled in API)

---

## 🚀 Performance Considerations

### Indexes
Primary keys automatically indexed:
- `users.user_id`
- `fields.field_id`
- `crop_cycle_incidents.incident_id`
- `tasks.task_id`
- `task_resources.resource_id`
- `work_orders.work_order_id`
- `incidents.incident_id`

### Recommended Additional Indexes
```sql
CREATE INDEX idx_crop_cycle_status ON crop_cycle_incidents(status);
CREATE INDEX idx_crop_cycle_stage ON crop_cycle_incidents(current_stage);
CREATE INDEX idx_tasks_crop_cycle ON tasks(crop_cycle_id);
CREATE INDEX idx_task_resources_task ON task_resources(task_id);
CREATE INDEX idx_incidents_field ON incidents(field_id);
```

---

## 🛠️ Database Migrations

### Initial Setup
```bash
# Create database
CREATE DATABASE nivodiya_farms;

# Run seed script
python backend/seed_data.py
```

### Adding New Enum Values
```bash
# Add new crop stages (already done)
python backend/migrate_crop_stages.py
```

---

## 📝 Notes

1. **UUID vs Integer IDs**: Main entities use UUID for better security and distributed systems, while reference tables use integers for simplicity.

2. **Timestamp Management**: All tables use UTC timestamps. Frontend converts to local timezone.

3. **Soft Delete**: Currently not implemented - deletes are hard deletes.

4. **Audit Trail**: `created_at`, `updated_at` fields track changes. Consider adding audit log table for production.

5. **JSONB Fields**: Used for flexible data (GPS polygons, attachments). Queryable with PostgreSQL JSONB operators.

---

## 📚 Related Documentation

- `VOICE_INCIDENT_FEATURE.md` - Voice recording features
- `CROP_CYCLE_IMPLEMENTATION_COMPLETE.md` - Crop cycle implementation
- `INCIDENT_SETUP_COMPLETE.md` - Incident system setup
- `backend/README.md` - Backend API documentation

---

**Last Updated:** October 2024  
**Database Version:** PostgreSQL 13+  
**ORM:** SQLAlchemy 2.x


