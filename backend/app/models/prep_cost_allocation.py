import uuid
from datetime import datetime

from sqlalchemy import Column, Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class PrepCostAllocation(Base):
    """
    Manual allocation of a field-prep work-order's cost to one or more crop cycles.

    Anchor: work_order_id (cost lives in work_order_resources under the WO, not the task).

    0 rows  = unattributed (cost sits in per-field overhead ledger).
    1 row   = fully attributed to one cycle.
    N rows  = split across cycles.

    App MUST enforce: SUM(amount per work_order_id) ≤ WO total resource cost.
    SQL CHECK cannot aggregate across rows, so this is an application-level rule.
    User specifies shares; the system never auto-allocates.
    """
    __tablename__ = "prep_cost_allocation"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    work_order_id = Column(
        UUID(as_uuid=True),
        ForeignKey("work_orders.work_order_id",
                   name="prep_cost_allocation_work_order_id_fkey",
                   ondelete="CASCADE"),
        nullable=False,
    )
    crop_cycle_id = Column(
        UUID(as_uuid=True),
        ForeignKey("crop_cycles.crop_cycle_id",
                   name="prep_cost_allocation_crop_cycle_id_fkey",
                   ondelete="RESTRICT"),
        nullable=False,
    )

    # Amount in farm currency (absolute ₹). Percentage variant deferred to later slice.
    amount = Column(Numeric(), nullable=True)

    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=True)

    crop_cycle = relationship("CropCycle", backref="prep_allocations")
    work_order = relationship("WorkOrder", backref="prep_allocations")
