import uuid
from datetime import datetime

from sqlalchemy import Column, Text, Date, Numeric, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class YieldRecord(Base):
    """
    Harvest yield per crop_cycle, optionally scoped to a specific field.
    """
    __tablename__ = "yields"

    yield_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    crop_cycle_id = Column(
        UUID(as_uuid=True),
        ForeignKey("crop_cycles.crop_cycle_id", ondelete="RESTRICT"),
        nullable=False,
    )
    field_id = Column(
        String,
        ForeignKey("fields.field_id"),
        nullable=True,
    )
    harvest_date = Column(Date, nullable=False)
    quantity = Column(Numeric(), nullable=False)
    unit = Column(Text, nullable=False)
    quality_grade = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=True)

    crop_cycle = relationship("CropCycle", backref="yield_records")
    field = relationship("Field")
