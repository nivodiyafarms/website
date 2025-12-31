# app/models/work_order_resource.py

from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import uuid


class WorkOrderResource(Base):
    """
    Resource usage inside a Work Order.
    This is the base for all cost calculations.
    """
    __tablename__ = "work_order_resources"

    # Primary key
    resource_uuid = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Parent Work Order
    work_order_uuid = Column(
        UUID(as_uuid=True),
        ForeignKey("work_orders.work_order_id"),
        nullable=False,
        index=True
    )

    # Resource classification (from master_options)
    resource_type = Column(String(50), nullable=False)   # LABOR / FUEL / MATERIAL / MACHINE / CONTRACT
    resource_code = Column(String(100), nullable=False)  # e.g. DIESEL, DAP, TRACTOR_1

    # Quantities & cost
    quantity = Column(Numeric(10, 2), nullable=False)
    unit = Column(String(20), nullable=False)            # kg / litre / hour / acre
    rate = Column(Numeric(12, 2), nullable=True)
    total_cost = Column(Numeric(14, 2), nullable=False)

    # Audit
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    work_order = relationship("WorkOrder", back_populates="resources")
