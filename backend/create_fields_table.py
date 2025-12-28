"""
Script to create the fields table in the database.
This script creates the table based on the Field model schema.
"""
import sys
from sqlalchemy import text
from app.database import engine, Base
from app.models.field import Field

def create_fields_table():
    """Create the fields table if it doesn't exist."""
    try:
        # Import all models to ensure they're registered
        from app.models import field
        
        # Check if table already exists
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'fields'
                );
            """))
            exists = result.scalar()
            
            if exists:
                print("[OK] Fields table already exists")
                return True
            
            # Create the table
            print("Creating fields table...")
            Base.metadata.create_all(bind=engine, tables=[Field.__table__])
            print("[OK] Fields table created successfully")
            return True
            
    except Exception as e:
        print(f"[ERROR] Error creating fields table: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = create_fields_table()
    sys.exit(0 if success else 1)

