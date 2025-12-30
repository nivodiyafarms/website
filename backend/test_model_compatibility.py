"""
Test Model Compatibility with Database
Verifies that all models can query the database correctly
"""
from app.database import SessionLocal, engine
from sqlalchemy import inspect, text
from app.models import *

def test_compatibility():
    """Test if models can query the database"""
    inspector = inspect(engine)
    db = SessionLocal()
    
    print("=" * 70)
    print("TESTING MODEL COMPATIBILITY")
    print("=" * 70)
    
    results = {}
    
    try:
        # Test each model that exists in database
        models_to_test = [
            ("CropCycle", CropCycle, "crop_cycles"),
            ("Task", Task, "tasks"),
            ("WorkOrder", WorkOrder, "work_orders"),
            ("WorkOrderResource", WorkOrderResource, "work_order_resources"),
            ("Note", Note, "notes"),
        ]
        
        for name, model, table_name in models_to_test:
            try:
                # Check if table exists
                if table_name not in inspector.get_table_names():
                    print(f"[SKIP] {name}: Table {table_name} not found in database")
                    results[name] = "skipped"
                    continue
                
                # Try to query
                count = db.query(model).count()
                print(f"[OK] {name}: {count} records found")
                results[name] = "ok"
                
                # Try to get first record if any exist
                if count > 0:
                    first = db.query(model).first()
                    print(f"      First record ID: {first.id if hasattr(first, 'id') else 'N/A'}")
                
            except Exception as e:
                error_msg = str(e)[:100]
                print(f"[FAIL] {name}: Error - {error_msg}")
                results[name] = f"error: {error_msg}"
        
        # Test User model (auth.users)
        try:
            # User model points to auth.users
            count = db.query(User).count()
            print(f"[OK] User: {count} records found (auth.users)")
            results["User"] = "ok"
        except Exception as e:
            error_msg = str(e)[:100]
            print(f"[FAIL] User: Error - {error_msg}")
            results["User"] = f"error: {error_msg}"
        
        # Test models that don't exist in database (should fail gracefully)
        models_not_in_db = [
            ("Field", Field, "fields"),
            ("Material", Material, "materials"),
            ("Equipment", Equipment, "equipment"),
            ("CropCatalog", CropCatalog, "crop_catalog"),
        ]
        
        print(f"\n{'='*70}")
        print("MODELS NOT IN DATABASE (Expected to fail)")
        print(f"{'='*70}")
        
        for name, model, table_name in models_not_in_db:
            try:
                count = db.query(model).count()
                print(f"[WARN] {name}: {count} records (table may not exist)")
            except Exception as e:
                print(f"[EXPECTED] {name}: Cannot query - {str(e)[:80]}")
        
        # Test relationships
        print(f"\n{'='*70}")
        print("TESTING RELATIONSHIPS")
        print(f"{'='*70}")
        
        try:
            # Test CropCycle -> Tasks relationship
            cycles = db.query(CropCycle).limit(1).all()
            if cycles:
                cycle = cycles[0]
                tasks_count = len(cycle.tasks) if hasattr(cycle, 'tasks') else 0
                print(f"[OK] CropCycle.tasks relationship: {tasks_count} tasks")
            else:
                print(f"[SKIP] CropCycle.tasks: No crop cycles to test")
        except Exception as e:
            print(f"[FAIL] CropCycle.tasks relationship: {str(e)[:80]}")
        
        try:
            # Test Task -> WorkOrder relationship
            tasks = db.query(Task).limit(1).all()
            if tasks:
                task = tasks[0]
                work_orders_count = len(task.work_orders) if hasattr(task, 'work_orders') else 0
                print(f"[OK] Task.work_orders relationship: {work_orders_count} work orders")
            else:
                print(f"[SKIP] Task.work_orders: No tasks to test")
        except Exception as e:
            print(f"[FAIL] Task.work_orders relationship: {str(e)[:80]}")
        
        # Summary
        print(f"\n{'='*70}")
        print("SUMMARY")
        print(f"{'='*70}")
        
        ok_count = sum(1 for v in results.values() if v == "ok")
        fail_count = sum(1 for v in results.values() if "error" in str(v))
        skip_count = sum(1 for v in results.values() if v == "skipped")
        
        print(f"Successful: {ok_count}")
        print(f"Failed: {fail_count}")
        print(f"Skipped: {skip_count}")
        
        if fail_count == 0:
            print("\n[OK] All compatible models work correctly!")
        else:
            print(f"\n[WARN] {fail_count} model(s) have issues")
        
    except Exception as e:
        print(f"\n[FAIL] Error during compatibility test: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_compatibility()







