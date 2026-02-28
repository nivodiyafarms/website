from sqlalchemy import Column, String, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
import enum
from app.database import Base


# SoilType enum REMOVED - soil_type column removed from database


class OwnershipType(str, enum.Enum):
    SELF = "Self"
    OTHER = "Other"


class Field(Base):
    __tablename__ = "fields"

    field_id = Column(String, primary_key=True)  # e.g., "F_003"
    name = Column(String(64), nullable=False)
    area_acre = Column(Float, nullable=False)
    # soil_type column removed from database
    gps_polygon = Column(JSONB, nullable=True)  # GeoJSON polygon
    gps_centroid_lat = Column(Float, nullable=True)
    gps_centroid_lng = Column(Float, nullable=True)
    village = Column(String(100), nullable=True)
    ownership = Column(String(50), nullable=True)  # "Self" or "Other"
    gavn = Column(String(100), nullable=True)  # Town/Village name
    farm_id = Column(String(100), nullable=True)  # Farm ID from CSV

