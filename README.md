# Nivodiya Farms KPI Dashboard

A full-stack web application for managing crop cycles, fields, and farm operations at Nivodiya Farms.

## Overview

This is an admin dashboard for Nivodiya Farms featuring:
- User authentication with JWT tokens
- Dashboard with KPI metrics
- Incident (Crop Cycle) management
- Field, crop, and supervisor tracking
- Master data management (crops, materials, equipment)

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Database with PostGIS support
- **SQLAlchemy** - ORM
- **Pydantic** - Data validation
- **JWT** - Authentication

### Frontend
- **React** - UI library
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Axios** - HTTP client
- **React Router** - Navigation

## Project Structure

```
nivodiya-farms/
├── backend/
│   ├── app/
│   │   ├── api/           # API endpoints
│   │   ├── auth/          # Authentication
│   │   ├── core/          # Configuration
│   │   ├── models/        # Database models
│   │   └── schemas/       # Pydantic schemas
│   ├── requirements.txt
│   ├── seed_data.py       # Database seeding
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── utils/         # Utilities
│   ├── package.json
│   └── README.md
└── README.md
```

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL 14+

### Backend Setup

1. **Install Python dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Setup PostgreSQL database:**
   ```sql
   CREATE DATABASE nivodiya_farms;
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Seed the database:**
   ```bash
   python seed_data.py
   ```

5. **Run the backend server:**
   ```bash
   uvicorn app.main:app --reload
   ```

   API will be available at `http://localhost:8000`
   API docs at `http://localhost:8000/docs`

### Frontend Setup

1. **Install Node dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your API URL
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

   App will be available at `http://localhost:3000`

## Test Credentials

After seeding the database, you can login with:

- **Admin**: `9876543210` / `admin123`
- **Supervisor**: `9876543211` / `supervisor123`
- **Worker**: `9876543212` / `worker123`

## Features

### Authentication
- Secure JWT-based authentication
- Role-based access (Admin, Supervisor, Worker)
- Protected routes

### Dashboard
- Active crop cycles count
- Total fields count
- Total and completed crop cycles
- Recent activities

### Incident Management (Crop Cycles)
- Create, read, update, delete crop cycles
- Track crop stages (Sowing → Germination → Vegetative → Flowering → Fruiting → Harvest)
- Manage status (Open/Closed)
- Assign supervisors
- Field selection
- Notes and additional information

### Master Data
- Fields with area, soil type, GPS coordinates
- Crop catalog with varieties and stages
- Materials (fertilizers, pesticides, etc.)
- Equipment tracking

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login

### Users
- `GET /api/users/` - List users
- `POST /api/users/` - Create user
- `GET /api/users/me` - Current user info

### Fields
- `GET /api/fields/` - List fields
- `POST /api/fields/` - Create field
- `PUT /api/fields/{id}` - Update field
- `DELETE /api/fields/{id}` - Delete field

### Crop Cycles
- `GET /api/crop-cycles/` - List crop cycles
- `POST /api/crop-cycles/` - Create crop cycle
- `PUT /api/crop-cycles/{id}` - Update crop cycle
- `DELETE /api/crop-cycles/{id}` - Delete crop cycle

### Other
- `GET /api/crops/` - Crop catalog
- `GET /api/materials/` - Materials
- `GET /api/equipment/` - Equipment

## Database Schema

### Key Models
- **User** - Admin, Supervisor, Worker roles
- **Field** - Farm fields with GPS data
- **CropCatalog** - Available crops and varieties
- **CropCycle** - Parent incident for tracking crop lifecycle
- **Material** - Farm materials and chemicals
- **Equipment** - Farm machinery

## Development

### Backend Development
```bash
cd backend
uvicorn app.main:app --reload
```

### Frontend Development
```bash
cd frontend
npm run dev
```

### Database Migrations
Using Alembic for database migrations:
```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## Production Deployment

### Backend
1. Set production environment variables
2. Use PostgreSQL with PostGIS extension
3. Run behind reverse proxy (nginx)
4. Use gunicorn or uvicorn workers

### Frontend
1. Build production bundle: `npm run build`
2. Serve static files with nginx or CDN
3. Configure proper CORS settings

## License

Proprietary - Nivodiya Farms

## Support

For issues or questions, contact the development team.

