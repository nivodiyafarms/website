# 🚀 Quick Start Guide - Start Both Servers

## Prerequisites
- ✅ PostgreSQL/Supabase database configured
- ✅ `.env` file in `backend/` directory
- ✅ Dependencies installed (both backend and frontend)

---

## Start Backend

### Option 1: Windows PowerShell
```powershell
cd backend
uvicorn app.main:app --reload
```

### Option 2: Windows Command Prompt
```cmd
cd backend
uvicorn app.main:app --reload
```

### Option 3: Git Bash / Unix
```bash
cd backend
uvicorn app.main:app --reload
```

**Backend will be available at:**
- API: http://localhost:8000
- Docs: http://localhost:8000/docs

---

## Start Frontend

Open a **NEW terminal window** (keep backend running):

### Option 1: Windows PowerShell / CMD
```powershell
cd frontend
npm run dev
```

### Option 2: Git Bash / Unix
```bash
cd frontend
npm run dev
```

**Frontend will be available at:**
- App: http://localhost:5173

---

## Login Credentials

```
Admin:
  Phone: 9876543210
  Password: admin123

Supervisor:
  Phone: 9876543211
  Password: supervisor123

Worker:
  Phone: 9876543212
  Password: worker123
```

---

## Common Errors & Solutions

### ❌ "No module named 'app'"
**Cause:** Running uvicorn from wrong directory  
**Solution:** Make sure you're in the `backend` directory

```bash
# Check current directory
pwd  # or "cd" on Windows

# Should show: .../NivodiyaFarms Website/backend
# If not, navigate to backend:
cd backend
```

### ❌ "Port 8000 is already in use"
**Cause:** Backend already running or other app using port  
**Solution:** Stop the running process or use different port

```bash
# Use different port
uvicorn app.main:app --reload --port 8001

# Update frontend API URL if using different port
# Edit frontend/.env:
# VITE_API_URL=http://localhost:8001
```

### ❌ "Address already in use" (Frontend)
**Cause:** Frontend already running  
**Solution:** Stop the running process (Ctrl+C) or use different port

```bash
# Vite will automatically suggest next available port
# Just answer 'y' when prompted
```

### ❌ Database connection errors
**Cause:** DATABASE_URL not configured  
**Solution:** Check `backend/.env` file

```env
# backend/.env must have:
DATABASE_URL=postgresql://...your_supabase_url...
SECRET_KEY=your-secret-key
GROQ_API_KEY=your_groq_key  # Optional but needed for voice
```

---

## Verify Everything is Working

### 1. Backend Health Check
```bash
curl http://localhost:8000/health
```

Should return:
```json
{"success": true, "message": "API is healthy"}
```

### 2. Frontend Loading
Open browser: http://localhost:5173  
Should see login page

### 3. Login Test
Use credentials above to login  
Should redirect to dashboard

### 4. API Docs
Visit: http://localhost:8000/docs  
Should see FastAPI Swagger UI with all endpoints

---

## Full Startup Sequence

### Terminal 1 (Backend):
```bash
cd "D:\Shambho\NivodiyaFarms Website\backend"
uvicorn app.main:app --reload
```

Wait for:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

### Terminal 2 (Frontend):
```bash
cd "D:\Shambho\NivodiyaFarms Website\frontend"
npm run dev
```

Wait for:
```
  VITE v5.0.8  ready in XXX ms
  
  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

---

## Stop Servers

### To stop backend:
Press `Ctrl+C` in the backend terminal

### To stop frontend:
Press `Ctrl+C` in the frontend terminal

---

## Troubleshooting Checklist

- [ ] In correct directory? (`backend` for backend, `frontend` for frontend)
- [ ] Dependencies installed? (`pip install -r requirements.txt`, `npm install`)
- [ ] `.env` file exists in backend?
- [ ] Database URL correct in `.env`?
- [ ] Port 8000 available? (for backend)
- [ ] Port 5173 available? (for frontend)
- [ ] Python 3.10+ installed?
- [ ] Node.js 16+ installed?

---

## Need Help?

1. **Check terminal output** for error messages
2. **Read error messages carefully** - they usually tell you what's wrong
3. **Verify file paths** - make sure you're in the right directory
4. **Restart servers** - sometimes fixes transient issues
5. **Check documentation** - `FRONTEND_VOICE_INCIDENTS_GUIDE.md`

---

**Happy coding! 🚀**

