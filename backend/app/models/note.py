from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, foreign
import uuid
from datetime import datetime
from app.database import Base


class Note(Base):
    """
    Notes - Polymorphic notes that can be attached to any entity
    Matches the notes table schema exactly
    """
    __tablename__ = "notes"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Polymorphic relationship
    related_type = Column(String(10), nullable=True)  # e.g., 'crop_cycle', 'task', 'work_order'
    related_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Author (FK to users.user_id, not auth.users.id)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    
    # Content
    text = Column(Text, nullable=True)
    media_url = Column(Text, nullable=True)  # Changed from image_path
    media_type = Column(Text, nullable=True)  # New field
    
    # Timestamps
    created_at = Column(DateTime, nullable=True, default=datetime.utcnow)
    
    # Relationships
    # Note: Polymorphic relationships use foreign() annotation
    # These are viewonly relationships since there's no direct FK
    # User relationship via author_id - references users.user_id
    user = relationship("User", foreign_keys=[author_id], viewonly=True)
    
    # Property aliases for backward compatibility
    @property
    def note_id(self):
        """Alias for id for backward compatibility"""
        return self.id
    
    @property
    def crop_cycle_id(self):
        """Get crop_cycle_id if related_type is 'crop_cycle'"""
        if self.related_type == 'crop_cycle':
            return self.related_id
        return None
    
    @property
    def user_id(self):
        """Alias for author_id for backward compatibility"""
        return self.author_id
    
    @property
    def content(self):
        """Alias for text for backward compatibility"""
        return self.text
    
    @property
    def image_path(self):
        """Alias for media_url for backward compatibility"""
        return self.media_url

