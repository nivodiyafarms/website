from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.database import Base


class CropCycleNote(Base):
    """
    Notes for crop cycles with image support.
    Designed to be synced with external applications.
    """
    __tablename__ = "crop_cycle_notes"

    note_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    crop_cycle_id = Column(UUID(as_uuid=True), ForeignKey("crop_cycle_incidents.incident_id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    content = Column(Text, nullable=False)
    image_path = Column(String(500), nullable=True)  # Path to uploaded image
    source = Column(String(50), nullable=False, default="web")  # 'web' or 'app' for tracking origin
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    crop_cycle = relationship("CropCycleIncident", foreign_keys=[crop_cycle_id])
    user = relationship("User", foreign_keys=[user_id])


