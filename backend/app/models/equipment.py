from sqlalchemy import Column, String, Integer, Float, Enum as SQLEnum
import enum
from app.database import Base


class EquipmentType(str, enum.Enum):
    TRACTOR = "TRACTOR"
    SPRAYER = "SPRAYER"
    PUMP = "PUMP"
    BOOM = "BOOM"


class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    type = Column(SQLEnum(EquipmentType), nullable=False)
    hourly_rate = Column(Float, nullable=True)
    plate_no = Column(String(20), nullable=True)

