# app/models/general_expense.py

from sqlalchemy import Column, String, Numeric, Date, DateTime
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from app.database import Base
import uuid


class GeneralExpense(Base):
    """
    GeneralExpense = Procurement / Purchase ledger
    Example: Diesel purchase, Fertilizer purchase, Tool purchase
    """
    __tablename__ = "general_expenses"

    # Primary key
    expense_uuid = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Human readable ID (GE00001)
    expense_code = Column(String(20), unique=True, index=True, nullable=False)

    # Classification (from master_options)
    resource_type = Column(String(50), nullable=False)   # FUEL / MATERIAL / MACHINE / SERVICE
    resource_code = Column(String(100), nullable=False)  # DIESEL / DAP / TRACTOR_1

    # Procurement details
    quantity = Column(Numeric(10, 2), nullable=False)
    unit = Column(String(20), nullable=False)            # litre / kg / unit
    rate = Column(Numeric(12, 2), nullable=True)
    total_amount = Column(Numeric(14, 2), nullable=False)

    # Metadata
    expense_date = Column(Date, nullable=False)
    vendor_name = Column(String(200), nullable=True)
    invoice_no = Column(String(100), nullable=True)

    # Notes / remarks
    notes = Column(String, nullable=True)

    # Audit
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)