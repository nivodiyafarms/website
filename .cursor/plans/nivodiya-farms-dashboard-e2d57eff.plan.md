---
name: Nivodiya Farms KPI Dashboard Implementation Plan
overview: ""
todos:
  - id: cfc11e4b-9c9b-4baa-bd8d-e00a2702d8e9
    content: Build incident list view with status badges, create/edit modal, and CRUD functionality
    status: pending
isProject: false
---

# Nivodiya Farms KPI Dashboard Implementation Plan

## Tech Stack

- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL with PostGIS (for GeoJSON support)
- **Frontend**: React with Tailwind CSS
- **Authentication**: JWT tokens

## Project Structure

```
nivodiya-farms/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── api/
│   │   ├── auth/
│   │   └── core/
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── services/
    │   ├── contexts/
    │   └── utils/
    ├── package.json
    └── tailwind.config.js
```

## Backend Implementation

### 1. Database Models (`backend/app/models/`)

Create SQLAlchemy models for:

- **User** model with role enum (ADMIN/SUPERVISOR/WORKER), phone, language
- **Field** model with UUID, area_acre, soil_type enum, GeoJSON polygon/centroid
- **CropCatalog** model for crop types, varieties, and default stages
- **Material** model with category (FERTILIZER/PESTICIDE/etc.), unit, safety notes
- **Equipment** model with type, hourly_rate, plate_no
- **CropCycle** model (parent incident) with field_id, crop, variety, stage, status, supervisor_id

### 2. Pydantic Schemas (`backend/app/schemas/`)

Create request/response schemas for all models with proper validation:

- Field validation (2-64 chars for names, >0 for area)
- Date validation (expected_harvest >= sowing_date)
- Enum validation for soil_type, crop stage, status

### 3. Authentication System (`backend/app/auth/`)

- JWT token generation and validation
- Password hashing with bcrypt
- Login endpoint (`/api/auth/login`)
- Token refresh endpoint
- Protected route dependencies

### 4. API Endpoints (`backend/app/api/`)

Create RESTful endpoints:

- `/api/auth/login` - POST (login)
- `/api/users/` - GET, POST (list, create users)
- `/api/fields/` - GET, POST, PUT, DELETE (CRUD for fields)
- `/api/crop-cycles/` - GET, POST, PUT (incident management)
- `/api/crop-cycles/{id}` - GET, PUT, DELETE
- `/api/crops/` - GET (crop catalog)
- `/api/materials/` - GET, POST (materials/equipment)

### 5. Database Setup

- PostgreSQL connection with SQLAlchemy
- Alembic for migrations
- PostGIS extension for GeoJSON support
- Seed data script for master data

## Frontend Implementation

### 1. Authentication (`frontend/src/`)

- `contexts/AuthContext.jsx` - JWT token management, user state
- `services/api.js` - Axios instance with JWT interceptor
- `utils/PrivateRoute.jsx` - Protected route wrapper

### 2. Login Page (`frontend/src/pages/Login.jsx`)

- Clean login form with email/phone and password
- JWT token storage in localStorage
- Redirect to dashboard on success

### 3. Dashboard Layout (`frontend/src/components/Layout.jsx`)

- Left sidebar navigation with:
  - Dashboard (home icon)
  - Incident (list icon)
- Top header with user info and logout
- Main content area
- Responsive design with Tailwind

### 4. Dashboard Page (`frontend/src/pages/Dashboard.jsx`)

- KPI cards showing:
  - Total active crop cycles
  - Fields in use
  - Incidents by stage
  - Recent activities
- Charts/graphs for data visualization

### 5. Incident Management (`frontend/src/pages/Incident.jsx`)

- **Header** with "Create Incident" button
- **List view** showing:
  - Crop cycle ID, Field name, Crop type
  - Stage badge (color-coded)
  - Status badge (OPEN/CLOSED with green/gray)
  - Sowing date, Supervisor name
  - Actions (view/edit/delete icons)
- **Create/Edit Modal** with form:
  - Field selector (dropdown)
  - Crop selector from catalog
  - Variety (optional)
  - Sowing date (date picker)
  - Expected harvest (date picker)
  - Stage selector
  - Supervisor selector
  - Notes (textarea)

### 6. Styling with Tailwind CSS

- Configure `tailwind.config.js` with custom colors (farm green theme)
- Responsive grid layouts
- Custom component classes for cards, badges, buttons
- Smooth transitions and hover effects

## Configuration Files

### Backend (`backend/requirements.txt`)

```
fastapi
uvicorn
sqlalchemy
psycopg2-binary
pydantic
python-jose[cryptography]
passlib[bcrypt]
python-multipart
alembic
geoalchemy2
```

### Frontend (`frontend/package.json`)

```
react
react-dom
react-router-dom
axios
tailwindcss
postcss
autoprefixer
lucide-react (for icons)
```

## Environment Setup

- `.env` for backend (DB_URL, SECRET_KEY, JWT settings)
- `.env` for frontend (VITE_API_URL or REACT_APP_API_URL)

## Key Implementation Details

1. Use UUID for all primary keys
2. Proper CORS configuration in FastAPI
3. Error handling with custom exception handlers
4. API response format: `{success: bool, data: any, message: string}`
5. Date format: ISO 8601 (yyyy-mm-dd)
6. Status badges: color-coded (green=OPEN, gray=CLOSED)
7. Stage badges: different colors for each stage