"""
Database migration script for Crop Cycle Notes
Creates the crop_cycle_notes table
"""
from app.database import engine, Base
from app.models.crop_cycle_note import CropCycleNote
from app.models.crop_cycle_incident import CropCycleIncident
from app.models.user import User

def migrate():
    """Create crop_cycle_notes table"""
    print("Starting migration for crop cycle notes...")
    
    try:
        # Create all tables (will skip existing ones)
        Base.metadata.create_all(bind=engine)
        print("[SUCCESS] Migration completed successfully!")
        print("[SUCCESS] crop_cycle_notes table created/verified")
        print("\nNotes feature is now available!")
        print("Notes can be accessed in the crop cycle detail view.")
        
    except Exception as e:
        print(f"[ERROR] Migration failed: {str(e)}")
        raise

if __name__ == "__main__":
    migrate()

