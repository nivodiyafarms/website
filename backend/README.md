# Nivodiya Farms Backend API

FastAPI backend for the Nivodiya Farms KPI Dashboard.

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Setup PostgreSQL Database

Make sure PostgreSQL is installed and running. Create a database:

```sql
CREATE DATABASE nivodiya_farms;
```

### 3. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/nivodiya_farms
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 4. Seed the Database

Run the seed script to populate initial data:

```bash
cd backend
python seed_data.py
```

### 5. Run the Server

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

API documentation will be available at `http://localhost:8000/docs`

## Test Credentials

- **Admin**: 9876543210 / admin123
- **Supervisor**: 9876543211 / supervisor123
- **Worker**: 9876543212 / worker123

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login and get JWT token

### Users
- `GET /api/users/` - List all users
- `POST /api/users/` - Create new user
- `GET /api/users/me` - Get current user info

### Fields
- `GET /api/fields/` - List all fields
- `GET /api/fields/{field_id}` - Get field by ID
- `POST /api/fields/` - Create new field
- `PUT /api/fields/{field_id}` - Update field
- `DELETE /api/fields/{field_id}` - Delete field

### Crop Cycles (Incidents)
- `GET /api/crop-cycles/` - List all crop cycles
- `GET /api/crop-cycles/{id}` - Get crop cycle by ID
- `POST /api/crop-cycles/` - Create new crop cycle
- `PUT /api/crop-cycles/{id}` - Update crop cycle
- `DELETE /api/crop-cycles/{id}` - Delete crop cycle

### Crops
- `GET /api/crops/` - Get crop catalog

### Materials
- `GET /api/materials/` - List all materials
- `POST /api/materials/` - Create new material

### Equipment
- `GET /api/equipment/` - List all equipment
- `POST /api/equipment/` - Create new equipment

