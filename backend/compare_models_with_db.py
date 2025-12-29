"""
Compare SQLAlchemy models with actual database schema
Identifies all differences that need to be fixed
"""
from app.database import engine, Base
from sqlalchemy import inspect
from app.models import *

def compare_models_with_database():
    """Compare SQLAlchemy models with actual database schema"""
    inspector = inspect(engine)
    db_tables = set(inspector.get_table_names())
    
    print("=" * 70)
    print("MODEL vs DATABASE COMPARISON")
    print("=" * 70)
    
    # Get all model tables
    model_tables = set(Base.metadata.tables.keys())
    
    print(f"\nDatabase Tables: {len(db_tables)}")
    print(f"Model Tables: {len(model_tables)}")
    
    # Find differences
    missing_in_db = model_tables - db_tables
    missing_in_models = db_tables - model_tables
    
    if missing_in_db:
        print(f"\n[WARN] Tables in models but NOT in database:")
        for table in sorted(missing_in_db):
            print(f"  - {table}")
    
    if missing_in_models:
        print(f"\n[WARN] Tables in database but NOT in models:")
        for table in sorted(missing_in_models):
            print(f"  - {table}")
    
    # Compare columns for each table
    print(f"\n{'='*70}")
    print("COLUMN COMPARISON BY TABLE")
    print(f"{'='*70}")
    
    all_issues = {}
    
    for table_name in sorted(db_tables & model_tables):
        print(f"\nTable: {table_name}")
        print("-" * 70)
        
        # Database columns
        db_columns = {col['name']: col for col in inspector.get_columns(table_name)}
        
        # Model columns
        if table_name not in Base.metadata.tables:
            print(f"  [ERROR] Table {table_name} not found in models!")
            continue
            
        model_table = Base.metadata.tables[table_name]
        model_columns = {col.name: col for col in model_table.columns}
        
        # Find differences
        db_col_names = set(db_columns.keys())
        model_col_names = set(model_columns.keys())
        
        missing_in_model = db_col_names - model_col_names
        missing_in_db = model_col_names - db_col_names
        
        issues = []
        
        if missing_in_model:
            print(f"  [MISSING IN MODEL] Columns in DB but NOT in model:")
            for col_name in sorted(missing_in_model):
                col_info = db_columns[col_name]
                col_type = str(col_info['type'])
                nullable = "NULL" if col_info['nullable'] else "NOT NULL"
                print(f"    - {col_name}: {col_type} [{nullable}]")
                issues.append(f"Missing column: {col_name}")
        
        if missing_in_db:
            print(f"  [EXTRA IN MODEL] Columns in model but NOT in DB:")
            for col_name in sorted(missing_in_db):
                col = model_columns[col_name]
                print(f"    - {col_name}: {col.type}")
                issues.append(f"Extra column: {col_name}")
        
        # Compare types for matching columns
        matching_cols = db_col_names & model_col_names
        type_mismatches = []
        for col_name in matching_cols:
            db_type = str(db_columns[col_name]['type']).upper()
            model_type = str(model_columns[col_name].type).upper()
            
            # Normalize type comparisons
            db_type_norm = db_type.replace('VARCHAR', 'STRING').replace('TEXT', 'STRING')
            model_type_norm = model_type.replace('VARCHAR', 'STRING').replace('TEXT', 'STRING')
            
            if db_type_norm != model_type_norm and 'UUID' not in db_type and 'UUID' not in model_type:
                # Check if it's a significant difference
                significant_diff = True
                if 'NUMERIC' in db_type and 'FLOAT' in model_type:
                    significant_diff = True
                elif 'DATE' in db_type and 'DATETIME' in model_type:
                    significant_diff = True
                elif 'TIMESTAMP' in db_type and 'DATETIME' in model_type:
                    significant_diff = False  # These are compatible
                else:
                    significant_diff = True
                
                if significant_diff:
                    type_mismatches.append((col_name, db_type, model_type))
        
        if type_mismatches:
            print(f"  [TYPE MISMATCH] Column type differences:")
            for col_name, db_type, model_type in type_mismatches:
                print(f"    - {col_name}: DB={db_type}, Model={model_type}")
                issues.append(f"Type mismatch: {col_name} (DB: {db_type}, Model: {model_type})")
        
        # Check nullability
        nullability_mismatches = []
        for col_name in matching_cols:
            db_nullable = db_columns[col_name]['nullable']
            model_nullable = model_columns[col_name].nullable
            if db_nullable != model_nullable:
                nullability_mismatches.append((col_name, db_nullable, model_nullable))
        
        if nullability_mismatches:
            print(f"  [NULLABILITY MISMATCH]:")
            for col_name, db_null, model_null in nullability_mismatches:
                db_str = "NULL" if db_null else "NOT NULL"
                model_str = "NULL" if model_null else "NOT NULL"
                print(f"    - {col_name}: DB={db_str}, Model={model_str}")
                issues.append(f"Nullability mismatch: {col_name}")
        
        # Check primary keys
        db_pk = inspector.get_pk_constraint(table_name)
        db_pk_cols = set(db_pk.get('constrained_columns', []))
        model_pk_cols = {col.name for col in model_table.primary_key.columns}
        
        if db_pk_cols != model_pk_cols:
            print(f"  [PRIMARY KEY MISMATCH]:")
            print(f"    DB PK: {', '.join(db_pk_cols) if db_pk_cols else 'None'}")
            print(f"    Model PK: {', '.join(model_pk_cols) if model_pk_cols else 'None'}")
            issues.append(f"Primary key mismatch")
        
        if not missing_in_model and not missing_in_db and not type_mismatches and not nullability_mismatches and db_pk_cols == model_pk_cols:
            print(f"  [OK] All columns match!")
        else:
            all_issues[table_name] = issues
    
    # Summary
    print(f"\n{'='*70}")
    print("SUMMARY")
    print(f"{'='*70}")
    
    if not all_issues and not missing_in_db and not missing_in_models:
        print("\n[OK] All models match database perfectly!")
    else:
        print(f"\n[ISSUES FOUND]")
        print(f"  - Tables missing in DB: {len(missing_in_db)}")
        print(f"  - Tables missing in models: {len(missing_in_models)}")
        print(f"  - Tables with issues: {len(all_issues)}")
        print(f"\nReview the details above to fix the issues.")
    
    return {
        'missing_in_db': missing_in_db,
        'missing_in_models': missing_in_models,
        'table_issues': all_issues
    }

if __name__ == "__main__":
    try:
        comparison = compare_models_with_database()
    except Exception as e:
        print(f"\n[FAIL] Error comparing: {e}")
        import traceback
        traceback.print_exc()




