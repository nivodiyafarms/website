"""
Seed data script for Nivodiya Farms
Run this script to populate the database with initial data
"""
from app.database import SessionLocal, Base, engine
from app.models.user import User, UserRole, UserLanguage
from app.models.field import Field, SoilType
from app.models.crop_catalog import CropCatalog
from app.models.material import Material, MaterialCategory
from app.models.equipment import Equipment, EquipmentType
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
                soil_type=SoilType.BLACK,
                gps_centroid_lat=23.515,
                gps_centroid_lng=78.303,
                village="Nivodiya"
            ),
            Field(
                field_id="F_002",
                name="Field 2",
                area_acre=3.5,
                soil_type=SoilType.LOAM,
                gps_centroid_lat=23.516,
                gps_centroid_lng=78.304,
                village="Nivodiya"
            ),
            Field(
                field_id="F_003",
                name="Field 3",
                area_acre=2.5,
                soil_type=SoilType.BLACK,
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
        
        # Create Materials
        materials = [
            Material(
                name="Urea",
                category=MaterialCategory.FERTILIZER,
                default_unit="kg",
                safety_notes="Store in dry place. Avoid direct contact with skin."
            ),
            Material(
                name="DAP",
                category=MaterialCategory.FERTILIZER,
                default_unit="kg",
                safety_notes="Handle with care. Use protective equipment."
            ),
            Material(
                name="Chlorpyrifos",
                category=MaterialCategory.PESTICIDE,
                default_unit="L",
                safety_notes="Highly toxic. Use protective equipment. Avoid inhalation."
            ),
            Material(
                name="Mancozeb",
                category=MaterialCategory.FUNGICIDE,
                default_unit="kg",
                safety_notes="Wear gloves and mask during application."
            ),
        ]
        db.add_all(materials)
        db.commit()
        print("✓ Materials created")
        
        # Create Equipment
        equipment_list = [
            Equipment(
                name="John Deere 5050",
                type=EquipmentType.TRACTOR,
                hourly_rate=500.0,
                plate_no="MP-09-AB-1234"
            ),
            Equipment(
                name="Spray Pump 100L",
                type=EquipmentType.SPRAYER,
                hourly_rate=150.0,
                plate_no=None
            ),
            Equipment(
                name="Water Pump 5HP",
                type=EquipmentType.PUMP,
                hourly_rate=200.0,
                plate_no=None
            ),
        ]
        db.add_all(equipment_list)
        db.commit()
        print("✓ Equipment created")
        
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

