import enum
from sqlalchemy import Column, String, Float
from app.database import Base


class OwnershipType(str, enum.Enum):
    SELF = "Self"
    OTHER = "Other"


class Field(Base):
    __tablename__ = "fields"

    field_id = Column(String, primary_key=True)
    name = Column(String(64), nullable=False)
    area_acre = Column(Float, nullable=False)
    gps_centroid_lat = Column(Float, nullable=True)
    gps_centroid_lng = Column(Float, nullable=True)
    village = Column(String(100), nullable=True)
    ownership = Column(String(50), nullable=True)
