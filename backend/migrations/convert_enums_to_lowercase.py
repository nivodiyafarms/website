"""
Migration script to convert enum values to lowercase in crop_cycles table.

This migration:
1. Converts current_stage enum values: "SOWING" → "sowing", etc.
2. Converts status enum values: "OPEN" → "open", "RESOLVED" → "resolved", etc.
3. Preserves all existing data

To run:
    python -m backend.migrations.convert_enums_to_lowercase

To rollback:
    python -m backend.migrations.convert_enums_to_lowercase --rollback
"""

import sys
import os
from sqlalchemy import text
from sqlalchemy.orm import Session

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal

# Enum mappings
STAGE_MAPPING = {
    "SOWING": "sowing",
    "GERMINATION": "germination",
    "VEGETATIVE": "vegetative",
    "FLOWERING": "flowering",
    "FRUITING": "fruiting",
    "HARVEST": "harvest",
    "STORAGE": "storage",
    "SALE": "sale",
    "PAYMENT": "payment",
}

STATUS_MAPPING = {
    "OPEN": "open",
    "RESOLVED": "resolved",
    "REOPENED": "reopened",
    "CLOSED": "closed",
    "CANCELLED": "cancelled",
}

# Reverse mappings for rollback
STAGE_REVERSE = {v: k for k, v in STAGE_MAPPING.items()}
STATUS_REVERSE = {v: k for k, v in STATUS_MAPPING.items()}


def migrate_forward(db: Session):
    """Convert enum values to lowercase"""
    try:
        print("Converting enum values to lowercase...")
        
        # Update current_stage values
        for upper, lower in STAGE_MAPPING.items():
            update_query = text("""
                UPDATE crop_cycles 
                SET current_stage = :lower 
                WHERE current_stage = :upper
            """)
            result = db.execute(update_query, {"upper": upper, "lower": lower})
            if result.rowcount > 0:
                print(f"  ✓ Updated {result.rowcount} records: current_stage '{upper}' → '{lower}'")
        
        # Update status values
        for upper, lower in STATUS_MAPPING.items():
            update_query = text("""
                UPDATE crop_cycles 
                SET status = :lower 
                WHERE status = :upper
            """)
            result = db.execute(update_query, {"upper": upper, "lower": lower})
            if result.rowcount > 0:
                print(f"  ✓ Updated {result.rowcount} records: status '{upper}' → '{lower}'")
        
        db.commit()
        print("✓ Successfully converted all enum values to lowercase")
        
    except Exception as e:
        db.rollback()
        print(f"✗ Error during migration: {e}")
        raise


def migrate_rollback(db: Session):
    """Convert enum values back to uppercase"""
    try:
        print("Rolling back: Converting enum values to uppercase...")
        
        # Update current_stage values
        for lower, upper in STAGE_REVERSE.items():
            update_query = text("""
                UPDATE crop_cycles 
                SET current_stage = :upper 
                WHERE current_stage = :lower
            """)
            result = db.execute(update_query, {"upper": upper, "lower": lower})
            if result.rowcount > 0:
                print(f"  ✓ Rolled back {result.rowcount} records: current_stage '{lower}' → '{upper}'")
        
        # Update status values
        for lower, upper in STATUS_REVERSE.items():
            update_query = text("""
                UPDATE crop_cycles 
                SET status = :upper 
                WHERE status = :lower
            """)
            result = db.execute(update_query, {"upper": upper, "lower": lower})
            if result.rowcount > 0:
                print(f"  ✓ Rolled back {result.rowcount} records: status '{lower}' → '{upper}'")
        
        db.commit()
        print("✓ Successfully rolled back: all enum values converted to uppercase")
        
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
