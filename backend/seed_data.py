"""
Seed data script for Nivodiya Farms
Run this script to populate the database with initial data
"""
from app.database import SessionLocal, Base, engine
from app.models.user import User, UserRole, UserLanguage
from app.models.field import Field
from app.models.crop_catalog import CropCatalog
from app.auth.security import get_password_hash


def seed_database():
    # Create all tables
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("SUCCESS: Tables created\n")
    db = SessionLocal()
    
    try:
        # Check if data already exists
        if db.query(User).first():
            print("Database already seeded!")
            return
        
        # Create Users
        import uuid
        users = [
            User(
                user_id=uuid.uuid4(),
                name="Admin User",
                phone="9876543210",
                password=get_password_hash("admin123"),
                role=UserRole.ADMIN.value,  # Use .value to get string
                language=UserLanguage.EN_IN.value if UserLanguage.EN_IN else None
            ),
            User(
                user_id=uuid.uuid4(),
                name="Rajesh Sharma",
                phone="9876543211",
                password=get_password_hash("supervisor123"),
                role=UserRole.SUPERVISOR.value,  # Use .value to get string
                language=UserLanguage.HI_IN.value if UserLanguage.HI_IN else None
            ),
            User(
                user_id=uuid.uuid4(),
                name="Amit Kumar",
                phone="9876543212",
                password=get_password_hash("worker123"),
                role=UserRole.WORKER.value,  # Use .value to get string
                language=UserLanguage.HI_IN.value if UserLanguage.HI_IN else None
            ),
        ]
        db.add_all(users)
        db.commit()
        print("✓ Users created")
        
        # Create Fields
        fields = [
            Field(
                field_id="F_001",
                name="Field 1",
                area_acre=5.0,
                gps_centroid_lat=23.515,
                gps_centroid_lng=78.303,
                village="Nivodiya"
            ),
            Field(
                field_id="F_002",
                name="Field 2",
                area_acre=3.5,
                gps_centroid_lat=23.516,
                gps_centroid_lng=78.304,
                village="Nivodiya"
            ),
            Field(
                field_id="F_003",
                name="Field 3",
                area_acre=2.5,
                gps_centroid_lat=23.517,
                gps_centroid_lng=78.305,
                village="Nivodiya"
            ),
        ]
        db.add_all(fields)
        db.commit()
        print("✓ Fields created")
        
        # Create Crop Catalog
        crops = [
            CropCatalog(
                crop="WHEAT",
                varieties=["Lok-1", "JW-3020", "HD-2967"],
                default_stages=["SOWING", "GERMINATION", "VEGETATIVE", "FLOWERING", "FRUITING", "HARVEST"]
            ),
            CropCatalog(
                crop="SOYBEAN",
                varieties=["JS-335", "JS-95-60", "NRC-37"],
                default_stages=["SOWING", "GERMINATION", "VEGETATIVE", "FLOWERING", "FRUITING", "HARVEST"]
            ),
            CropCatalog(
                crop="MORINGA",
                varieties=["PKM-1", "PKM-2", "Bhagya"],
                default_stages=["SOWING", "GERMINATION", "VEGETATIVE", "FLOWERING", "HARVEST"]
            ),
            CropCatalog(
                crop="CORN",
                varieties=["Golden", "Sweet", "Hybrid"],
                default_stages=["SOWING", "GERMINATION", "VEGETATIVE", "FLOWERING", "FRUITING", "HARVEST"]
            ),
        ]
        db.add_all(crops)
        db.commit()
        print("✓ Crop catalog created")
        
        print("\n✅ Database seeded successfully!")
        print("\nTest Credentials:")
        print("Admin: 9876543210 / admin123")
        print("Supervisor: 9876543211 / supervisor123")
        print("Worker: 9876543212 / worker123")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

