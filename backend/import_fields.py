"""
Import CSV field data into the database
CSV Format: X,Y,Name,Area (in acre),Ownership,Gavn,Farm ID
"""
import csv
from app.database import SessionLocal, Base, engine
from app.models.field import Field
from app.models import *  # Import all models to ensure relationships are registered


def import_fields_from_csv(csv_file_path):
    """Import fields from CSV file"""
    # Ensure all tables are created
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    fields_processed = []
    fields_skipped = []
    
    try:
        with open(csv_file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            for row_num, row in enumerate(reader, start=2):  # Start at 2 to account for header
                # Skip empty rows
                if not row.get('Name', '').strip():
                    continue
                
                # Extract data - handle potential trailing spaces in column names
                field_id = (row.get('Farm ID') or row.get('Farm ID ', '')).strip()
                name = (row.get('Name') or row.get('Name ', '')).strip()
                area_str = (row.get('Area (in acre)') or row.get('Area (in acre) ', '')).strip()
                ownership = (row.get('Ownership') or row.get('Ownership ', '')).strip()
                gavn = (row.get('Gavn') or row.get('Gavn ', '')).strip()
                x_coord = (row.get('X') or row.get('X ', '')).strip()
                y_coord = (row.get('Y') or row.get('Y ', '')).strip()
                
                # Validate required fields
                if not field_id or not name:
                    print(f"WARN: Row {row_num}: Skipping (missing field_id or name)")
                    fields_skipped.append(row_num)
                    continue
                
                # Handle area - convert to float or default to 0
                try:
                    area_acre = float(area_str) if area_str and area_str != '.' else 0.0
                except ValueError:
                    print(f"WARN: Row {row_num}: Invalid area '{area_str}', defaulting to 0")
                    area_acre = 0.0
                
                # Handle GPS coordinates
                gps_lng = None
                gps_lat = None
                if x_coord and y_coord:
                    try:
                        gps_lng = float(x_coord)
                        gps_lat = float(y_coord)
                    except ValueError:
                        print(f"WARN: Row {row_num}: Invalid GPS coordinates")
                
                # Check if field already exists (in DB or already processed in this batch)
                existing = db.query(Field).filter(Field.field_id == field_id).first()
                if existing or field_id in fields_processed:
                    print(f"INFO: Row {row_num}: Field {field_id} already exists, skipping")
                    fields_skipped.append(row_num)
                    continue
                
                # Create field
                field = Field(
                    field_id=field_id,
                    name=name,
                    area_acre=area_acre,
                    ownership=ownership if ownership else None,
                    gavn=gavn if gavn else None,
                    gps_centroid_lat=gps_lat,
                    gps_centroid_lng=gps_lng,
                    village=gavn if gavn else None  # Use Gavn as village
                )
                
                db.add(field)
                db.commit()  # Commit immediately to avoid duplicates
                fields_processed.append(field_id)
                print(f"OK: Row {row_num}: Created field '{name}' ({field_id}) - {area_acre} acres")
            
            print("\nSUCCESS: Fields imported successfully!")
            print(f"Total processed: {len(fields_processed)}, Skipped: {len(fields_skipped)}")
            
    except FileNotFoundError:
        print(f"ERROR: File '{csv_file_path}' not found")
    except Exception as e:
        print(f"ERROR importing fields: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    # Update this path to your CSV file location
    csv_path = r"c:\Users\Teds Design\Downloads\Field Name Mapping  - Novodiya_Farms.2.csv"
    import_fields_from_csv(csv_path)
