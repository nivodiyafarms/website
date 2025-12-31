from app.database import engine
from sqlalchemy import text

conn = engine.connect()

# Check if resolved_date and resolution_comments exist
result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'tasks' AND column_name IN ('resolved_date', 'resolution_comments');"))
existing = [r[0] for r in result.fetchall()]
print("Existing:", existing)

# Add missing columns
if 'resolved_date' not in existing:
    conn.execute(text("ALTER TABLE tasks ADD COLUMN resolved_date TIMESTAMP;"))
    print("Added resolved_date")
if 'resolution_comments' not in existing:
    conn.execute(text("ALTER TABLE tasks ADD COLUMN resolution_comments TEXT;"))
    print("Added resolution_comments")
    
conn.commit()
print("Done")
