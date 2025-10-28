from sqlalchemy import Column, String, Date, Text, DateTime, Enum as SQLEnum, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import enum
from datetime import datetime
from app.database import Base


class CropStage(str, enum.Enum):
    SOWING = "SOWING"
    GERMINATION = "GERMINATION"
    VEGETATIVE = "VEGETATIVE"
    FLOWERING = "FLOWERING"
    FRUITING = "FRUITING"
    HARVEST = "HARVEST"


class CropCycleStatus(str, enum.Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"


class CropCycle(Base):
    __tablename__ = "crop_cycles"

    crop_cycle_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    field_id = Column(String, ForeignKey("fields.field_id"), nullable=False)
    crop = Column(String(100), nullable=False)
    variety = Column(String(100), nullable=True)
    sowing_date = Column(Date, nullable=False)
    expected_harvest = Column(Date, nullable=True)
    stage = Column(SQLEnum(CropStage), nullable=False, default=CropStage.SOWING)
    status = Column(SQLEnum(CropCycleStatus), nullable=False, default=CropCycleStatus.OPEN)
    supervisor_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    notes = Column(Text, nullable=True)
    geo_context_lat = Column(Float, nullable=True)
    geo_context_lng = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    field = relationship("Field", foreign_keys=[field_id])
    supervisor = relationship("User", foreign_keys=[supervisor_id])

