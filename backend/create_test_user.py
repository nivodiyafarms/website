"""
Create a test user for authentication testing
TEMPORARY: This bypasses Supabase Auth and creates a user directly
WARNING: Only use for development/testing!
"""
from app.database import SessionLocal, engine
from sqlalchemy import text
from app.auth.security import get_password_hash
import uuid

def create_test_user():
    """Create a test user in auth.users for testing"""
    db = SessionLocal()
    
    try:
        # Generate a test user
        user_id = uuid.uuid4()
        email = "test@example.com"
        phone = "1234567890"
        password = "test123"
        hashed_password = get_password_hash(password)
        
        # Create user in auth.users
        # Note: This requires direct SQL since auth.users is managed by Supabase
        result = db.execute(text("""
            INSERT INTO auth.users (
                id,
                instance_id,
                email,
                encrypted_password,
                email_confirmed_at,
                raw_user_meta_data,
                created_at,
                updated_at,
                confirmation_token,
                email_change,
                email_change_token_new,
                recovery_token
            ) VALUES (
                :id,
                '00000000-0000-0000-0000-000000000000',
                :email,
                :encrypted_password,
                NOW(),
                :user_metadata,
                NOW(),
                NOW(),
                '',
                '',
                '',
                ''
            )
            ON CONFLICT (id) DO NOTHING
            RETURNING id
        """), {
            "id": str(user_id),
            "email": email,
            "encrypted_password": hashed_password,
            "user_metadata": f'{{"phone": "{phone}", "name": "Test User", "role": "ADMIN", "language": "en-IN"}}'
        })
        
        db.commit()
        
        user = result.fetchone()
        if user:
            print(f"[OK] Test user created successfully!")
            print(f"  User ID: {user_id}")
            print(f"  Email: {email}")
            print(f"  Phone: {phone}")
            print(f"  Password: {password}")
            print(f"\nYou can now login with:")
            print(f"  Phone: {phone}")
            print(f"  Password: {password}")
        else:
            print("[INFO] User may already exist or creation failed")
            
    except Exception as e:
        db.rollback()
        print(f"[FAIL] Error creating test user: {e}")
        print("\nAlternative: Create user via Supabase Dashboard")
        print("1. Go to Supabase Dashboard > Authentication > Users")
        print("2. Click 'Add User'")
        print("3. Set email and password")
        print("4. Update user_metadata with: {\"phone\": \"1234567890\", \"name\": \"Test User\", \"role\": \"ADMIN\"}")
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()









