from sqlalchemy import Column, String, Integer
from sqlalchemy.dialects.postgresql import ARRAY
from app.database import Base


class CropCatalog(Base):
    __tablename__ = "crop_catalog"

    id = Column(Integer, primary_key=True, autoincrement=True)
    crop = Column(String(100), nullable=False, unique=True)
    varieties = Column(ARRAY(String), nullable=True)
    default_stages = Column(ARRAY(String), nullable=False)

