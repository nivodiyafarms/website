"""
Database Schema Inspection Script
Inspects the existing Supabase database schema to understand the structure
"""
from app.database import engine
from sqlalchemy import inspect, text
import json
from datetime import datetime

def test_connection():
    """Test database connection"""
    print("=" * 70)
    print("STEP 1: Testing Database Connection")
    print("=" * 70)
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version();"))
            version = result.fetchone()[0]
            print(f"[OK] Connection successful!")
            print(f"PostgreSQL version: {version[:80]}...")
            
            # Test a simple query
            result = conn.execute(text("SELECT current_database();"))
            db_name = result.fetchone()[0]
            print(f"Connected to database: {db_name}")
            return True
    except Exception as e:
        print(f"[FAIL] Connection failed: {e}")
        return False

def inspect_database():
    """Inspect the existing database schema"""
    print("\n" + "=" * 70)
    print("STEP 2: Inspecting Database Schema")
    print("=" * 70)
    
    inspector = inspect(engine)
    
    # Get all tables
    tables = inspector.get_table_names()
    print(f"\nTotal Tables Found: {len(tables)}\n")
    
    schema_info = {}
    
    for table_name in sorted(tables):
        print(f"\n{'='*70}")
        print(f"Table: {table_name}")
        print(f"{'='*70}")
        
        # Get columns
        columns = inspector.get_columns(table_name)
        print(f"\nColumns ({len(columns)}):")
        table_columns = {}
        
        for col in columns:
            col_info = {
                'name': col['name'],
                'type': str(col['type']),
                'nullable': col['nullable'],
                'default': str(col['default']) if col['default'] is not None else None,
                'primary_key': col.get('primary_key', False),
                'autoincrement': col.get('autoincrement', False)
            }
            table_columns[col['name']] = col_info
            
            pk_marker = " [PK]" if col_info['primary_key'] else ""
            nullable_marker = " [NULL]" if col_info['nullable'] else " [NOT NULL]"
            default_marker = f" DEFAULT={col_info['default']}" if col_info['default'] else ""
            auto_marker = " [AUTO]" if col_info['autoincrement'] else ""
            
            print(f"  - {col['name']}: {col['type']}{pk_marker}{nullable_marker}{auto_marker}{default_marker}")
        
        # Get foreign keys
        foreign_keys = inspector.get_foreign_keys(table_name)
        if foreign_keys:
            print(f"\nForeign Keys ({len(foreign_keys)}):")
            for fk in foreign_keys:
                constrained_cols = ', '.join(fk['constrained_columns'])
                referred_table = fk['referred_table']
                referred_cols = ', '.join(fk['referred_columns'])
                print(f"  - {constrained_cols} -> {referred_table}({referred_cols})")
        else:
            print(f"\nForeign Keys: None")
        
        # Get indexes
        indexes = inspector.get_indexes(table_name)
        if indexes:
            print(f"\nIndexes ({len(indexes)}):")
            for idx in indexes:
                idx_cols = ', '.join(idx['column_names'])
                unique = " [UNIQUE]" if idx['unique'] else ""
                print(f"  - {idx['name']}: {idx_cols}{unique}")
        else:
            print(f"\nIndexes: None")
        
        # Get primary keys
        pk_constraint = inspector.get_pk_constraint(table_name)
        if pk_constraint and pk_constraint.get('constrained_columns'):
            pk_cols = ', '.join(pk_constraint['constrained_columns'])
            print(f"\nPrimary Key: {pk_cols}")
        else:
            print(f"\nPrimary Key: None")
        
        schema_info[table_name] = {
            'columns': table_columns,
            'foreign_keys': foreign_keys,
            'indexes': indexes,
            'primary_key': pk_constraint
        }
    
    # Save to JSON file for reference
    output_file = 'database_schema.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(schema_info, f, indent=2, default=str)
    
    print(f"\n{'='*70}")
    print("[OK] Schema inspection complete!")
    print(f"Schema saved to: {output_file}")
    print(f"{'='*70}")
    
    return schema_info

if __name__ == "__main__":
    # Test connection first
    if not test_connection():
        print("\n[FAIL] Cannot proceed without database connection")
        exit(1)
    
    # Inspect schema
    try:
        schema = inspect_database()
        print(f"\n[OK] Successfully inspected {len(schema)} tables")
    except Exception as e:
        print(f"\n[FAIL] Error inspecting database: {e}")
        import traceback
        traceback.print_exc()
        exit(1)

