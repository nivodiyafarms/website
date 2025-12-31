# app/models/master_option.py

from sqlalchemy import Column, String, Boolean, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
import uuid


class MasterOption(Base):
    """
    Centralized master table for all dropdowns.
    Supports bilingual labels (Hindi + English).
    """
    __tablename__ = "master_options"

    option_uuid = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Classification
    category = Column(String(50), index=True, nullable=False)
    code = Column(String(100), index=True, nullable=False)  # stable internal key

    # Display labels
    label_en = Column(String(200), nullable=False)
    label_hi = Column(String(200), nullable=False)

    # UI helpers
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    __table_args__ = (
        UniqueConstraint("category", "code", name="uq_master_option_category_code"),
    )

