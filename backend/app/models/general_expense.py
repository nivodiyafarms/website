from sqlalchemy import Column, String, Date, Text, Numeric, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.database import Base


class GeneralExpense(Base):
    """
    General Expense - Represents non-crop operational expenses
    Matches the general_expense table schema exactly
    """
    __tablename__ = "general_expense"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Expense Information
    category = Column(Text, nullable=True)
    subcategory = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    date = Column(Date, nullable=True)
    
    # Quantity and Pricing
    qty = Column(Numeric, nullable=True)
    unit = Column(Text, nullable=True)
    unit_rate = Column(Numeric, nullable=True)
    total_cost = Column(Numeric, nullable=True)
    
    # Related Entity (optional - can link to tasks, work orders, etc.)
    related_type = Column(String(10), nullable=True)
    related_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Assignment (FK to users.user_id)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, nullable=True, default=datetime.utcnow)




