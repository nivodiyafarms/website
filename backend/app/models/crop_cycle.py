# backend/app/models/crop_cycle.py
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Date,
    DateTime,
    Numeric,
    ForeignKey,
    UniqueConstraint,
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
    __table_args__ = (
        # Matches live DB constraint name; do not rename via migration.
        UniqueConstraint('incident_no', name='crop_cycles_incident_no_key'),
    )

    # Primary key - maps to database column 'crop_cycle_id'
    id = Column('crop_cycle_id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Property to expose crop_cycle_id for API compatibility
    @property
    def crop_cycle_id(self):
        """Alias for id to match API response format"""
        return self.id

    # Human-readable code (CC0001) — uniqueness enforced via __table_args__ constraint
    incident_no = Column(Text, nullable=True)

    # Basic relations
    field_code = Column(String, nullable=False)
    # FK name matches live DB: crop_cycles_created_by_fkey → public.users.user_id
    created_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", name="crop_cycles_created_by_fkey", ondelete="SET NULL"),
        nullable=True,
    )

    # Crop details
    crop_name = Column(String(100), nullable=False)
    seed_category = Column(String(100), nullable=True)
    season = Column(String(20), nullable=False)  # kharif / rabi / zaid — NOT NULL in DB
    # crop_year = calendar year of sowing. UI: "{season} {crop_year}" e.g. "Kharif 2025".
    # NOT unique alone — identity is season + crop_year + crop_name + seed_category.
    crop_year = Column(Integer(), nullable=False)

    # Area & seed
    cultivated_area = Column(Numeric(), nullable=True)
    seed_quantity = Column(Numeric(10, 2), nullable=True)

    # Dates
    sowing_date = Column(Date, nullable=True)
    expected_harvest_date = Column(Date, nullable=True)
    actual_harvest_date = Column(Date, nullable=True)

    # Stage & status
    current_stage = Column(
        PGEnum(CropStage, name="cycle_stage_enum", create_type=False, schema="public", values_callable=lambda enum_cls: [e.value for e in enum_cls]),
        nullable=True,
        default=CropStage.SOWING,
    )
    status = Column(
        PGEnum(CropCycleStatus, name="cycle_status_enum", create_type=False, schema="public", values_callable=lambda enum_cls: [e.value for e in enum_cls]),
        nullable=True,
        default=CropCycleStatus.OPEN,
    )

    # Financial rollups — plain Numeric to match DB (no precision/scale specified)
    total_expense = Column(Numeric(), default=0)
    total_revenue = Column(Numeric(), default=0)
    profit = Column(Numeric(), default=0)

    # Resolution
    resolved_date = Column(Date, nullable=True)
    resolution_comments = Column(String, nullable=True)
    observation = Column(String, nullable=True)
    
    # Additional fields from database
    short_description = Column(String, nullable=True)
    description = Column(String, nullable=True)

    # Audit — timestamptz nullable to match DB
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=True)
    updated_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=True,
    )

    # Fields this cycle spans (via junction table)
    cycle_fields = relationship(
        "CropCycleField",
        back_populates="crop_cycle",
        cascade="all, delete-orphan",
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
