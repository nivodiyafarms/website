import enum
import uuid
from datetime import datetime

from sqlalchemy import Column, Text, Numeric, Date, DateTime
from sqlalchemy.dialects.postgresql import UUID, ENUM as PGEnum

from app.database import Base
from app.models.note import RelatedType


class ExpenseReviewStatus(str, enum.Enum):
    UNREVIEWED = "unreviewed"
    VERIFIED = "verified"
    VOID = "void"


# -----------------------------
# General Expense Model
# -----------------------------
class GeneralExpense(Base):
    """
    General Operational Expense
    Matches Supabase table: public.general_expense
    """
    __tablename__ = "general_expense"

    # Primary Key
    general_expense_id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    # Classification
    category = Column(Text, nullable=True)
    subcategory = Column(Text, nullable=True)

    # Description
    description = Column(Text, nullable=True)

    # Date
    date = Column(Date, nullable=True)

    # Quantity & Cost
    qty = Column(Numeric, nullable=True)
    unit = Column(Text, nullable=True)
    unit_rate = Column(Numeric, nullable=True)
    total_cost = Column(Numeric, nullable=True)

    # Relation (optional linking) — typed enum matches related_type_enum in DB
    related_type = Column(
        PGEnum(RelatedType, name="related_type_enum", create_type=False,
               values_callable=lambda enum_cls: [e.value for e in enum_cls]),
        nullable=True
    )
    related_id = Column(UUID(as_uuid=True), nullable=True)

    # Audit
    created_by = Column(UUID(as_uuid=True), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow
    )

    # Review workflow (verify-after model: expense posts immediately, reviewed later)
    review_status = Column(
        PGEnum(ExpenseReviewStatus, name="expense_review_status_enum", create_type=False,
               values_callable=lambda e: [m.value for m in e]),
        nullable=False,
        default=ExpenseReviewStatus.UNREVIEWED,
        server_default="unreviewed",
    )
    reviewed_by = Column(UUID(as_uuid=True), nullable=True)
    void_reason = Column(Text, nullable=True)