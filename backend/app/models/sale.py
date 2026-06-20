import enum
import uuid
from datetime import datetime

from sqlalchemy import Column, Text, Date, Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ENUM as PGEnum
from sqlalchemy.orm import relationship

from app.database import Base


class SaleChannel(str, enum.Enum):
    MANDI = "mandi"
    SOCIETY = "society"
    PRIVATE = "private"
    SEED_LOT = "seed_lot"


class Sale(Base):
    """
    A sale line item at the variety (crop_cycle) level.
    Many sales per crop_cycle, many buyers/dates.
    """
    __tablename__ = "sales"

    sale_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    crop_cycle_id = Column(
        UUID(as_uuid=True),
        ForeignKey("crop_cycles.crop_cycle_id", ondelete="RESTRICT"),
        nullable=False,
    )
    sale_date = Column(Date, nullable=False)
    quantity = Column(Numeric(), nullable=False)
    unit = Column(Text, nullable=False)
    rate = Column(Numeric(), nullable=False)
    total_amount = Column(Numeric(), nullable=False)
    buyer = Column(Text, nullable=True)
    channel = Column(
        PGEnum(SaleChannel, name="sale_channel_enum", create_type=False,
               values_callable=lambda e: [m.value for m in e]),
        nullable=False,
    )
    notes = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=True)

    crop_cycle = relationship("CropCycle", backref="sales")
