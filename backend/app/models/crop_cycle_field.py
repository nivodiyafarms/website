from sqlalchemy import Column, String, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class CropCycleField(Base):
    """
    Junction table: one crop cycle can span many fields.
    Replaces the single field_code string on crop_cycles.
    field_code is kept as a safety net until this is verified.
    """
    __tablename__ = "crop_cycle_fields"

    crop_cycle_id = Column(
        UUID(as_uuid=True),
        ForeignKey("crop_cycles.crop_cycle_id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
    )
    field_id = Column(
        String,
        ForeignKey("fields.field_id", ondelete="RESTRICT"),
        primary_key=True,
        nullable=False,
    )
    allocated_acres = Column(Numeric(), nullable=True)

    crop_cycle = relationship("CropCycle", back_populates="cycle_fields")
    field = relationship("Field")
