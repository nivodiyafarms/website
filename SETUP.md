# Nivodiya Farms - Complete Setup Guide

This guide will walk you through setting up the Nivodiya Farms KPI Dashboard from scratch.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.9 or higher** - [Download](https://www.python.org/downloads/)
- **Node.js 18 or higher** - [Download](https://nodejs.org/)
- **PostgreSQL 14 or higher** - [Download](https://www.postgresql.org/download/)
- **Git** (optional, for version control)

## Step 1: Database Setup

### 1.1 Install PostgreSQL

Download and install PostgreSQL from the official website. During installation, remember the password you set for the `postgres` user.

### 1.2 Create Database

Open PostgreSQL command line (psql) or pgAdmin and run:

```sql
CREATE DATABASE nivodiya_farms;
```

Or use the command line:

```bash
# Windows (PowerShell as Administrator)
psql -U postgres

# Then in psql:
CREATE DATABASE nivodiya_farms;
\q
```

## Step 2: Backend Setup

### 2.1 Navigate to Backend Directory

```bash
cd backend
```

### 2.2 Create Virtual Environment (Optional but Recommended)

**Windows:**
```bash
python -m venv venv
.\venv\Scripts\activate
```

**Mac/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 2.3 Install Dependencies

```bash
pip install -r requirements.txt
```

### 2.4 Configure Environment Variables

1. Copy the example environment file:
   ```bash
   # Windows (PowerShell)
   Copy-Item .env.example .env
   
   # Mac/Linux
   cp .env.example .env
   ```

2. Edit `.env` file with your settings:
   ```
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/nivodiya_farms
   SECRET_KEY=your-secret-key-here-change-in-production-use-long-random-string
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```

   **Important:** Replace `your_password` with your PostgreSQL password!

### 2.5 Seed the Database

This will create tables and populate them with initial data:

```bash
python seed_data.py
```

You should see:
```
✓ Users created
✓ Fields created
✓ Crop catalog created
✓ Materials created
✓ Equipment created

✅ Database seeded successfully!

Test Credentials:
Admin: 9876543210 / admin123
Supervisor: 9876543211 / supervisor123
Worker: 9876543212 / worker123
```

### 2.6 Start the Backend Server

```bash
uvicorn app.main:app --reload
```

The backend should now be running at `http://localhost:8000`

You can access the API documentation at `http://localhost:8000/docs`

## Step 3: Frontend Setup

### 3.1 Open New Terminal

Keep the backend running and open a new terminal window.

### 3.2 Navigate to Frontend Directory

```bash
cd frontend
```

### 3.3 Install Dependencies

```bash
npm install
```

This will take a few minutes as it downloads all the necessary packages.

### 3.4 Configure Environment Variables

1. Create `.env` file:
   ```bash
   # Windows (PowerShell)
   Copy-Item .env.example .env
   
   # Mac/Linux
   cp .env.example .env
   ```

2. The default `.env` should work:
   ```
   VITE_API_URL=http://localhost:8000
   ```

### 3.5 Start the Frontend Development Server

```bash
npm run dev
```

The frontend should now be running at `http://localhost:3000`

## Step 4: Access the Application

1. Open your web browser
2. Go to `http://localhost:3000`
3. You should see the login page
4. Login with test credentials:
   - Phone: `9876543210`
   - Password: `admin123`

## Verification Checklist

- [ ] PostgreSQL is installed and running
- [ ] Database `nivodiya_farms` is created
- [ ] Backend dependencies installed (`pip install -r requirements.txt`)
- [ ] Backend `.env` file configured
- [ ] Database seeded successfully (`python seed_data.py`)
- [ ] Backend server running at `http://localhost:8000`
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Frontend `.env` file configured
- [ ] Frontend server running at `http://localhost:3000`
- [ ] Can login to the application

## Common Issues and Solutions

### Issue: "Module not found" error in backend

**Solution:** Make sure you're in the virtual environment and all dependencies are installed:
```bash
pip install -r requirements.txt
```

### Issue: "Connection refused" to database

**Solution:** 
1. Check if PostgreSQL is running
2. Verify the DATABASE_URL in `.env` has the correct password and database name
3. Ensure the database `nivodiya_farms` exists

### Issue: Backend server won't start

**Solution:** 
1. Check if port 8000 is already in use
2. Try running on a different port: `uvicorn app.main:app --reload --port 8001`
3. Update frontend `.env` to match: `VITE_API_URL=http://localhost:8001`

### Issue: Frontend won't start

**Solution:**
1. Delete `node_modules` folder and run `npm install` again
2. Check if port 3000 is already in use
3. Clear npm cache: `npm cache clean --force`

### Issue: Can't login

**Solution:**
1. Make sure backend is running
2. Check browser console for errors (F12)
3. Verify the database was seeded: `python seed_data.py`
4. Check if the API is accessible: visit `http://localhost:8000/health`

### Issue: CORS errors in browser

**Solution:** Make sure both backend and frontend are running on the correct ports (8000 and 3000 respectively).

## Next Steps

After successful setup:

1. **Explore the Dashboard** - View KPI metrics
2. **Create Incidents** - Add crop cycles
3. **Manage Data** - Add fields, users, materials

## Development Workflow

### Running Both Servers

You need two terminal windows:

**Terminal 1 (Backend):**
```bash
cd backend
uvicorn app.main:app --reload
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

### Making Changes

- **Backend changes:** Server auto-reloads (--reload flag)
- **Frontend changes:** Vite hot-reloads automatically

## Production Deployment

For production deployment:

1. **Backend:**
   - Set strong SECRET_KEY
   - Use production database
   - Deploy with gunicorn or similar
   - Set up HTTPS

2. **Frontend:**
   - Build: `npm run build`
   - Serve the `dist` folder
   - Update VITE_API_URL to production API

## Support

For issues:
1. Check this guide's troubleshooting section
2. Check the main README.md
3. Review backend/README.md and frontend/README.md
4. Contact the development team

## Additional Resources

- FastAPI Documentation: https://fastapi.tiangolo.com/
- React Documentation: https://react.dev/
- Tailwind CSS: https://tailwindcss.com/
- PostgreSQL Documentation: https://www.postgresql.org/docs/

