# app/models/work_order_resource.py

from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import uuid


class WorkOrderResource(Base):
    """
    Resource usage inside a Work Order.
    Matches the work_order_resources table schema exactly
    """
    __tablename__ = "work_order_resources"

    # Primary key - database uses id, not resource_uuid
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Parent Work Order - database uses work_order_id, not work_order_uuid
    work_order_id = Column(
        UUID(as_uuid=True),
        ForeignKey("work_orders.id"),
        nullable=True
    )

    # Resource classification
    resource_type = Column(String(8), nullable=True)  # VARCHAR(8) in database
    name = Column(Text, nullable=True)  # Database uses name, not resource_code

    # Quantities & cost - database uses qty, not quantity
    qty = Column(Numeric, nullable=True)  # Database uses qty
    unit = Column(Text, nullable=True)
    rate = Column(Numeric, nullable=True)
    cost = Column(Numeric, nullable=True)  # Database uses cost, not total_cost

    # Audit
    created_at = Column(DateTime, nullable=True, default=datetime.utcnow)

    # Relationships
    work_order = relationship("WorkOrder", back_populates="resources", foreign_keys=[work_order_id])
    
    # Property aliases for backward compatibility
    @property
    def resource_uuid(self):
        """Alias for id"""
        return self.id
    
    @property
    def work_order_uuid(self):
        """Alias for work_order_id"""
        return self.work_order_id
    
    @property
    def resource_code(self):
        """Alias for name"""
        return self.name
    
    @property
    def quantity(self):
        """Alias for qty"""
        return self.qty
    
    @property
    def total_cost(self):
        """Alias for cost"""
        return self.cost
