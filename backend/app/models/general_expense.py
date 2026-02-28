from sqlalchemy import (
    Column,
    Text,
    Numeric,
    Date,
    DateTime
)
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from app.database import Base


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

    # Relation (optional linking)
    related_type = Column(Text, nullable=True)
    related_id = Column(UUID(as_uuid=True), nullable=True)

    # Audit
    created_by = Column(UUID(as_uuid=True), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow
    )