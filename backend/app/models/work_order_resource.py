# app/models/work_order_resource.py

from sqlalchemy import (
    Column,
    Text,
    Numeric,
    DateTime,
    ForeignKey,
    String
)
from sqlalchemy.dialects.postgresql import UUID, ENUM as PGEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base
from app.models.enums import ResourceType


# -----------------------------
# Work Order Resource Model
# -----------------------------
class WorkOrderResource(Base):
    """
    Resource consumption inside a Work Order
    (Stock OUT / cost attribution)
    """
    __tablename__ = "work_order_resources"

    # Primary key
    work_order_resources_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Parent Work Order
    work_order_id = Column(
        UUID(as_uuid=True),
        ForeignKey("work_orders.work_order_id", ondelete="CASCADE"),
        nullable=True,
    )

    # Classification
    resource_type = Column(
        PGEnum(ResourceType, name="resource_type_enum", create_type=False, values_callable=lambda enum_cls: [e.value for e in enum_cls]),
        nullable=True
    )

    # Resource details — Numeric() without precision to match DB
    name = Column(Text, nullable=True)
    qty = Column(Numeric(), nullable=True)
    unit = Column(Text, nullable=True)
    rate = Column(Numeric(), nullable=True)
    cost = Column(Numeric(), nullable=True)

    # Audit
    created_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=True
    )

    # Relationships
    work_order = relationship("WorkOrder", back_populates="resources")
