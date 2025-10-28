# Quick Start Guide - Nivodiya Farms Dashboard

Get up and running in 5 minutes!

## Prerequisites Check

- [ ] Python 3.9+ installed
- [ ] Node.js 18+ installed
- [ ] PostgreSQL 14+ installed and running

## Quick Setup (5 Steps)

### 1. Create Database

```bash
# Windows (PowerShell as Administrator)
psql -U postgres -c "CREATE DATABASE nivodiya_farms;"
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Create .env file (edit with your PostgreSQL password)
# DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/nivodiya_farms
# SECRET_KEY=your-secret-key-change-this-in-production
# ALGORITHM=HS256
# ACCESS_TOKEN_EXPIRE_MINUTES=30

# Seed database
python seed_data.py

# Start backend
uvicorn app.main:app --reload
```

Backend is now running at `http://localhost:8000` ✓

### 3. Frontend Setup (New Terminal)

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env file
# VITE_API_URL=http://localhost:8000

# Start frontend
npm run dev
```

Frontend is now running at `http://localhost:3000` ✓

### 4. Login

Open browser to `http://localhost:3000`

**Login with:**
- Phone: `9876543210`
- Password: `admin123`

### 5. Explore!

You're all set! Explore the dashboard and create your first incident.

## What's Next?

- **Dashboard**: View KPI metrics
- **Incidents**: Create and manage crop cycles
- **API Docs**: Visit `http://localhost:8000/docs`

## Need Help?

See `SETUP.md` for detailed setup instructions and troubleshooting.

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌────────────┐
│   React     │ ◄────── │   FastAPI    │ ◄────── │ PostgreSQL │
│  Frontend   │  HTTP   │   Backend    │   ORM   │  Database  │
│  (Port 3000)│         │  (Port 8000) │         │            │
└─────────────┘         └──────────────┘         └────────────┘
```

## Project Structure

```
nivodiya-farms/
├── backend/          # FastAPI backend
│   ├── app/
│   │   ├── api/      # REST endpoints
│   │   ├── models/   # Database models
│   │   └── schemas/  # Pydantic schemas
│   └── seed_data.py  # Database seeding
│
├── frontend/         # React frontend
│   └── src/
│       ├── pages/    # Dashboard, Incident, Login
│       ├── components/ # Layout
│       └── services/ # API calls
│
└── README.md         # Main documentation
```

Enjoy! 🌱

