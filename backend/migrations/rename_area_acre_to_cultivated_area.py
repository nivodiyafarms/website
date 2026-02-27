"""
Migration script to rename area_acre column to cultivated_area in crop_cycles table.

This migration:
1. Renames the column from area_acre to cultivated_area
2. Preserves all existing data

To run:
    python -m backend.migrations.rename_area_acre_to_cultivated_area

To rollback:
    python -m backend.migrations.rename_area_acre_to_cultivated_area --rollback
"""

import sys
import os
from sqlalchemy import text
from sqlalchemy.orm import Session

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine


def migrate_forward(db: Session):
    """Rename area_acre to cultivated_area"""
    try:
        # Check if column exists
        check_query = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'crop_cycles' 
            AND column_name = 'area_acre'
        """)
        result = db.execute(check_query).fetchone()
        
        if result:
            print("Renaming column area_acre to cultivated_area...")
            # Rename the column
            rename_query = text("ALTER TABLE crop_cycles RENAME COLUMN area_acre TO cultivated_area")
            db.execute(rename_query)
            db.commit()
            print("✓ Successfully renamed area_acre to cultivated_area")
        else:
            # Check if cultivated_area already exists
            check_cultivated = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'crop_cycles' 
                AND column_name = 'cultivated_area'
            """)
            if db.execute(check_cultivated).fetchone():
                print("✓ Column cultivated_area already exists, skipping migration")
            else:
                print("⚠ Column area_acre not found. Migration may have already been applied or column doesn't exist.")
        
    except Exception as e:
        db.rollback()
        print(f"✗ Error during migration: {e}")
        raise


def migrate_rollback(db: Session):
    """Rename cultivated_area back to area_acre"""
    try:
        # Check if column exists
        check_query = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'crop_cycles' 
            AND column_name = 'cultivated_area'
        """)
        result = db.execute(check_query).fetchone()
        
        if result:
            print("Rolling back: Renaming cultivated_area to area_acre...")
            # Rename the column back
            rename_query = text("ALTER TABLE crop_cycles RENAME COLUMN cultivated_area TO area_acre")
            db.execute(rename_query)
            db.commit()
            print("✓ Successfully rolled back: cultivated_area renamed to area_acre")
        else:
            print("⚠ Column cultivated_area not found. Nothing to rollback.")
        
    except Exception as e:
        db.rollback()
        print(f"✗ Error during rollback: {e}")
        raise


def main():
    """Main migration function"""
    rollback = "--rollback" in sys.argv
    
    db = SessionLocal()
    try:
        if rollback:
            print("Starting rollback migration...")
            migrate_rollback(db)
        else:
            print("Starting forward migration...")
            migrate_forward(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
