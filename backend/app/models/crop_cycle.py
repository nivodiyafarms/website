# backend/app/models/crop_cycle.py
from sqlalchemy import (
    Column,
    String,
    Date,
    DateTime,
    Numeric,
    and_,
)
from sqlalchemy.dialects.postgresql import UUID, ENUM as PGEnum
from sqlalchemy.orm import relationship, foreign
import uuid
import enum
from datetime import datetime
from app.database import Base


# -----------------------------
# Crop Stage (Lifecycle) - Lowercase to match Supabase
# -----------------------------
class CropStage(str, enum.Enum):
    SOWING = "sowing"
    GERMINATION = "germination"
    VEGETATIVE = "vegetative"
    FLOWERING = "flowering"
    FRUITING = "fruiting"
    HARVEST = "harvest"
    STORAGE = "storage"
    SALE = "sale"
    PAYMENT = "payment"


# -----------------------------
# Crop Cycle Status - Lowercase to match Supabase
# -----------------------------
class CropCycleStatus(str, enum.Enum):
    OPEN = "open"
    RESOLVED = "resolved"
    REOPENED = "reopened"
    CLOSED = "closed"
    CANCELLED = "cancelled"


# -----------------------------
# Crop Cycle Model
# -----------------------------
class CropCycle(Base):
    """
    Crop Cycle = 1 crop on 1 field for 1 season
    This is the ROOT entity for tasks & work orders
    """
    __tablename__ = "crop_cycles"

    # Primary key - maps to database column 'crop_cycle_id'
    id = Column('crop_cycle_id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Property to expose crop_cycle_id for API compatibility
    @property
    def crop_cycle_id(self):
        """Alias for id to match API response format"""
        return self.id

    # Human-readable code (INC00001)
    incident_no = Column(String(20), unique=True, nullable=False, index=True)

    # Basic relations (kept loose for demo)
    field_code = Column(String, nullable=False)
    created_by = Column(UUID(as_uuid=True), nullable=True)

    # Crop details
    crop_name = Column(String(100), nullable=False)
    seed_category = Column(String(100), nullable=True)
    season = Column(String(20), nullable=True)  # kharif / rabi / zaid

    # Area & seed
    cultivated_area = Column(Numeric(10, 2), nullable=True)  # Changed from area_acre to match Supabase
    seed_quantity = Column(Numeric(10, 2), nullable=True)

    # Dates
    sowing_date = Column(Date, nullable=False)
    expected_harvest_date = Column(Date, nullable=True)
    actual_harvest_date = Column(Date, nullable=True)

    # Stage & status
    current_stage = Column(
        PGEnum(CropStage, name="cycle_stage_enum", create_type=False, schema="public", values_callable=lambda enum_cls: [e.value for e in enum_cls]),
        nullable=False,
        default=CropStage.SOWING,
    )
    status = Column(
        PGEnum(CropCycleStatus, name="cycle_status_enum", create_type=False, schema="public", values_callable=lambda enum_cls: [e.value for e in enum_cls]),
        nullable=False,
        default=CropCycleStatus.OPEN,
    )

    # Financial rollups
    total_expense = Column(Numeric(14, 2), default=0)
    total_revenue = Column(Numeric(14, 2), default=0)
    profit = Column(Numeric(14, 2), default=0)

    # Resolution
    resolved_date = Column(Date, nullable=True)
    resolution_comments = Column(String, nullable=True)
    observation = Column(String, nullable=True)
    
    # Additional fields from database
    short_description = Column(String, nullable=True)
    description = Column(String, nullable=True)

    # Audit
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )


# -----------------------------
# Notes relationship (polymorphic)
# -----------------------------
def _configure_crop_cycle_notes():
    from app.models.note import Note

    CropCycle.notes = relationship(
        "Note",
        primaryjoin=and_(
            foreign(Note.related_id) == CropCycle.id,
            Note.related_type == "crop_cycle",
        ),
        viewonly=True,
    )


_configure_crop_cycle_notes()
