from sqlalchemy import Column, String, Integer, Enum as SQLEnum, Text
import enum
from app.database import Base


class MaterialCategory(str, enum.Enum):
    FERTILIZER = "FERTILIZER"
    PESTICIDE = "PESTICIDE"
    FUNGICIDE = "FUNGICIDE"
    HERBICIDE = "HERBICIDE"
    BIO = "BIO"


class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    category = Column(SQLEnum(MaterialCategory), nullable=False)
    default_unit = Column(String(10), nullable=False)  # kg, L, etc.
    safety_notes = Column(Text, nullable=True)

