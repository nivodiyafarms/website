"""
Script to import field data from CSV file into the fields table.
CSV file path: Downloads/Field Name Mapping  - Novodiya_Farms.2 (1).csv
"""
import csv
import sys
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.field import Field

import os
CSV_PATH = os.path.join(os.path.expanduser("~"), "Downloads", "Field Name Mapping  - Novodiya_Farms.2 (1).csv")

def parse_float(value):
    """Parse float value, handling empty strings and invalid values."""
    if not value or value.strip() == '' or value.strip() == '.':
        return None
    try:
        return float(value.strip())
    except (ValueError, AttributeError):
        return None

def import_fields_from_csv():
    """Import fields from CSV file."""
    db: Session = SessionLocal()
    imported_count = 0
    skipped_count = 0
    error_count = 0
    
    try:
        with open(CSV_PATH, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            
            for row_num, row in enumerate(reader, start=2):  # Start at 2 (row 1 is header)
                try:
                    # Extract and clean data - handle column name variations
                    farm_id = (row.get('Farm ID ', '') or row.get('Farm ID', '')).strip()
                    name = row.get('Name', '').strip()
                    area_str = (row.get('Area (in acre)', '') or row.get('Area (in acre) ', '')).strip()
                    ownership = row.get('Ownership', '').strip()
                    gavn = row.get('Gavn', '').strip()
                    x_str = row.get('X', '').strip()  # Longitude
                    y_str = row.get('Y', '').strip()  # Latitude
                    
                    # Skip rows with missing essential data
                    if not farm_id or not name:
                        print(f"Row {row_num}: Skipping - missing farm_id or name")
                        skipped_count += 1
                        continue
                    
                    # Use farm_id as field_id
                    field_id = farm_id
                    
                    # Check if field already exists
                    existing = db.query(Field).filter(Field.field_id == field_id).first()
                    if existing:
                        print(f"Row {row_num}: Field {field_id} already exists, skipping")
                        skipped_count += 1
                        continue
                    
                    # Parse area
                    area_acre = parse_float(area_str)
                    if area_acre is None or area_acre <= 0:
                        print(f"Row {row_num}: Invalid area '{area_str}', setting to 0")
                        area_acre = 0.0
                    
                    # Parse coordinates
                    gps_centroid_lng = parse_float(x_str)
                    gps_centroid_lat = parse_float(y_str)
                    
                    # Create field object
                    field = Field(
                        field_id=field_id,
                        name=name,
                        area_acre=area_acre,
                        gps_centroid_lng=gps_centroid_lng,
                        gps_centroid_lat=gps_centroid_lat,
                        ownership=ownership if ownership else None,
                        gavn=gavn if gavn else None,
                        farm_id=farm_id,
                        village=gavn if gavn else None  # Use gavn as village
                    )
                    
                    db.add(field)
                    db.commit()  # Commit after each field to handle duplicates
                    imported_count += 1
                    print(f"Row {row_num}: Imported {field_id} - {name}")
                    
                except Exception as e:
                    db.rollback()  # Rollback on error
                    if "duplicate key" in str(e).lower() or "unique constraint" in str(e).lower():
                        print(f"Row {row_num}: Field {field_id} already exists, skipping")
                        skipped_count += 1
                    else:
                        print(f"Row {row_num}: Error - {e}")
                        error_count += 1
                    continue
            print(f"\n[OK] Import completed:")
            print(f"  - Imported: {imported_count} fields")
            print(f"  - Skipped: {skipped_count} fields")
            print(f"  - Errors: {error_count} fields")
            
            return True
            
    except FileNotFoundError:
        print(f"[ERROR] CSV file not found at {CSV_PATH}")
        print("Please ensure the file exists and the path is correct.")
        return False
    except Exception as e:
        print(f"[ERROR] Error importing fields: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = import_fields_from_csv()
    sys.exit(0 if success else 1)

