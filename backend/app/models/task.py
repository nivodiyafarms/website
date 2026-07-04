# backend/app/models/task.py

from sqlalchemy import (
    Column, Integer, String, DateTime, Text, ForeignKey,
    Numeric, Boolean, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID, ENUM as PGEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum, uuid

from app.database import Base


# -----------------------------
# Enums
# -----------------------------
class TaskStatus(str, enum.Enum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    RESOLVED = "resolved"
    REOPENED = "reopened"
    CLOSED = "closed"
    CANCELLED = "cancelled"


# TaskType enum REMOVED - tasks now use category and subcategory (PostgreSQL enums)


class SeverityLevel(str, enum.Enum):
    SEV1 = "sev1"
    SEV2 = "sev2"
    SEV3 = "sev3"
    SEV4 = "sev4"


class TaskCategory(str, enum.Enum):
    SOWING = "sowing"
    IRRIGATION = "irrigation"
    FERTILIZER = "fertilizer"
    HARVEST = "harvest"
    FUEL = "fuel"
    SALE = "sale"
    STORAGE = "storage"


class TaskSubcategory(str, enum.Enum):
    KHURAR = "khurar"
    ROTAVATOR = "rotavator"
    LEVELING = "leveling"
    SEEDING = "seeding"
    PLOUGHING = "ploughing"
    MULCHING = "mulching"
    PALEVA = "paleva"
    FIRST_IRRIGATION = "first_irrigation"
    SECOND_IRRIGATION = "second_irrigation"
    THIRD_IRRIGATION = "third_irrigation"
    FOURTH_IRRIGATION = "fourth_irrigation"
    FIFTH_IRRIGATION = "fifth_irrigation"
    CONTRACT_IRRIGATION = "contract_irrigation"
    SEED_TREATMENT = "seed_treatment"
    DAP = "dap"
    UREA = "urea"
    PESTICIDE = "pesticide"
    POTASH = "potash"
    ZINC = "zinc"
    SULFUR = "sulfur"
    SUPER_PHOSPHATE = "super_phosphate"
    MANUAL_CUTTING = "manual_cutting"
    THRESHER = "thresher"
    HARVESTER = "harvester"
    WINNOWING = "winnowing"
    CONTRACT_HARVEST = "contract_harvest"
    DIESEL = "diesel"
    PETROL = "petrol"
    MANDI_SALE = "mandi_sale"
    SOCIETY_SALE = "society_sale"
    FARM_ID = "farm_id"
    WAREHOUSE = "warehouse"
    OTHER = "other"


# -----------------------------
# Task Model
# -----------------------------
class Task(Base):
    __tablename__ = "tasks"
    __table_args__ = (
        # Matches live DB constraint name (legacy "task_code" name); do not rename.
        UniqueConstraint('task_number', name='tasks_task_code_key'),
    )

    task_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    task_number = Column(String(20), nullable=False)

    crop_cycle_id = Column(
        UUID(as_uuid=True),
        ForeignKey("crop_cycles.crop_cycle_id", ondelete="RESTRICT"),
        nullable=True,   # nullable: field-prep tasks have no crop cycle
    )

    # Field tag — nullable; set for both crop tasks and field-prep tasks
    field_id = Column(
        String,
        ForeignKey("fields.field_id"),
        nullable=True,
    )

    # Classification (category and subcategory replace task_type)
    category = Column(
        PGEnum(TaskCategory, name="task_category_enum", create_type=False, values_callable=lambda enum_cls: [e.value for e in enum_cls]),
        nullable=False
    )
    subcategory = Column(
        PGEnum(TaskSubcategory, name="task_subcategory_enum", create_type=False, values_callable=lambda enum_cls: [e.value for e in enum_cls]),
        nullable=True
    )

    short_description = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)

    assigned_to_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id"),
        nullable=False
    )
    created_by_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id"),
        nullable=False
    )
    approved_by_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id"),
        nullable=True
    )

    # Prep-task season tag — set on field-prep tasks (crop_cycle_id NULL) to assign the
    # prep cost to a season+year; null on crop tasks and untagged prep tasks.
    # UI label: "{prep_season} {prep_crop_year}" e.g. "Kharif 2025".
    # Invariant (enforced by create endpoint, not DB): crop_cycle_id and
    # prep_season/prep_crop_year are mutually exclusive.
    prep_season = Column(String(20), nullable=True)
    prep_crop_year = Column(Integer(), nullable=True)

    # Voice integration fields (Sarvam STT — populated by WhatsApp agent)
    is_voice_created = Column(Boolean, nullable=True, default=False)
    transcript = Column(Text, nullable=True)

    status = Column(
        PGEnum(TaskStatus, name="task_status_enum", create_type=False, values_callable=lambda enum_cls: [e.value for e in enum_cls]),
        default=TaskStatus.NEW,
        nullable=False
    )

    on_hold_reason = Column(Text, nullable=True)

    # Resolution
    resolved_date = Column(DateTime, nullable=True)
    resolution_comments = Column(Text, nullable=True)
    observation = Column(Text, nullable=True)

    severity = Column(PGEnum(SeverityLevel, name="severity_enum", create_type=False, values_callable=lambda enum_cls: [e.value for e in enum_cls]), nullable=True)

    total_expense = Column(Numeric(14, 2), default=0)

    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    closed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    crop_cycle = relationship("CropCycle", backref="tasks")
    field = relationship("Field", foreign_keys=[field_id])
    task_fields = relationship("TaskField", back_populates="task", cascade="all, delete-orphan")
    work_orders = relationship("WorkOrder", back_populates="task")
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])
    created_by = relationship("User", foreign_keys=[created_by_id])
    approved_by = relationship("User", foreign_keys=[approved_by_id])
