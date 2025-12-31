# Database Connection Fix Guide

## Problem
The database hostname `db.uqloukejlruoszoapyxq.supabase.co` cannot be resolved (DNS error).

## Solutions

### 1. Check Supabase Dashboard
- Go to your Supabase project dashboard
- Navigate to **Settings** → **Database**
- Verify the connection string is correct
- Check if your database is **paused** (free tier databases pause after inactivity)
- If paused, click **Resume** to wake it up

### 2. Get the Correct Connection String
In Supabase dashboard:
- Go to **Settings** → **Database**
- Find the **Connection string** section
- Copy the **URI** format connection string
- Update your `.env` file with the correct `DATABASE_URL`

### 3. Try Connection Pooler (Recommended)
Supabase provides a connection pooler that's more reliable. Update your `.env`:

**Direct Connection (current - port 5432):**
```
DATABASE_URL=postgresql://postgres:PASSWORD@db.uqloukejlruoszoapyxq.supabase.co:5432/postgres
```

**Connection Pooler (port 6543) - Try this:**
```
DATABASE_URL=postgresql://postgres.uqloukejlruoszoapyxq:PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

Or use the **Transaction Pooler**:
```
DATABASE_URL=postgresql://postgres.uqloukejlruoszoapyxq:PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres?pgbouncer=true
```

### 4. Verify Network Connectivity
Run the test script:
```bash
python test_db_connection.py
```

### 5. Check Internet/Firewall
- Ensure you have internet connectivity
- Check if firewall is blocking port 5432 or 6543
- Try from a different network if possible

## Quick Fix Steps

1. **Resume database in Supabase dashboard** (if paused)
2. **Get new connection string** from Supabase dashboard
3. **Update `.env` file** with correct `DATABASE_URL`
4. **Restart the server**: `uvicorn app.main:app --reload`
5. **Test connection**: Visit `http://127.0.0.1:8000/health` to check database status

## After Fixing

Once the connection is working:
- The login should work properly
- Database operations will function normally
- You can delete `test_db_connection.py` if you want

