"""
Migration script to add new CropStage enum values
Run this once to add STORAGE, SALE, PAYMENT to the existing crop_cycle_incidents table
"""
from sqlalchemy import create_engine, text
from app.core.config import settings

def migrate_crop_stages():
    """Add new enum values to crop_stage enum type"""
    # Replace postgresql:// with postgresql+psycopg://
    database_url = settings.DATABASE_URL.replace("postgresql://", "postgresql+psycopg://")
    engine = create_engine(database_url)
    
    with engine.connect() as conn:
        try:
            print("Adding STORAGE to cropstage enum...")
            conn.execute(text("ALTER TYPE cropstage ADD VALUE IF NOT EXISTS 'STORAGE'"))
            conn.commit()
            print("✓ STORAGE added")
            
            print("Adding SALE to cropstage enum...")
            conn.execute(text("ALTER TYPE cropstage ADD VALUE IF NOT EXISTS 'SALE'"))
            conn.commit()
            print("✓ SALE added")
            
            print("Adding PAYMENT to cropstage enum...")
            conn.execute(text("ALTER TYPE cropstage ADD VALUE IF NOT EXISTS 'PAYMENT'"))
            conn.commit()
            print("✓ PAYMENT added")
            
            print("\n✅ Migration completed successfully!")
            print("You can now update crop cycles to STORAGE, SALE, and PAYMENT stages.")
            
        except Exception as e:
            print(f"Error during migration: {e}")
            print("\nNote: If the enum values already exist, you can ignore this error.")

if __name__ == "__main__":
    migrate_crop_stages()


