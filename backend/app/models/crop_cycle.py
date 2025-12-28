from sqlalchemy import Column, String, Date, Text, DateTime, Enum as SQLEnum, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, foreign
import uuid
import enum
from datetime import datetime
from app.database import Base


class CropStage(str, enum.Enum):
    SOWING = "sowing"
    GERMINATION = "germination"
    VEGETATIVE = "vegetative"
    FLOWERING = "flowering"
    FRUITING = "fruiting"
    HARVEST = "harvest"
    STORAGE = "storage"
    SALE = "sale"
    PAYMENT = "payment"


class CropCycleStatus(str, enum.Enum):
    OPEN = "open"
    CLOSED = "closed"


class CropCycle(Base):
    """
    Crop Cycle - Represents a crop cycle in the database
    Matches the crop_cycles table schema exactly
    """
    __tablename__ = "crop_cycles"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Incident Number
    incident_no = Column(Text, nullable=True, unique=True)
    
    # Field Information
    field_code = Column(Text, nullable=False)  # Changed from field_id
    
    # Season
    season = Column(Text, nullable=False)
    
    # Crop Information
    crop_name = Column(Text, nullable=False)  # Changed from crop
    seed_category = Column(Text, nullable=True)  # Changed from variety
    
    # Dates
    sowing_date = Column(Date, nullable=True)  # Changed from NOT NULL
    expected_harvest_date = Column(Date, nullable=True)  # Changed from expected_harvest
    actual_harvest_date = Column(Date, nullable=True)  # New field
    resolved_date = Column(Date, nullable=True)  # New field
    
    # Area
    cultivated_area = Column(Numeric, nullable=True)  # New field
    
    # Current Status
    current_stage = Column(String(11), nullable=True)  # Changed from stage, enum type
    status = Column(String(9), nullable=True)  # Changed from NOT NULL, enum type
    
    # Descriptions
    short_description = Column(Text, nullable=True)  # New field
    description = Column(Text, nullable=True)  # New field
    observation = Column(Text, nullable=True)  # New field
    resolution_comments = Column(Text, nullable=True)  # New field
    
    # Financial
    total_expense = Column(Numeric, nullable=True, default=0)  # New field
    total_revenue = Column(Numeric, nullable=True, default=0)  # New field
    profit = Column(Numeric, nullable=True, default=0)  # New field
    
    # Created By (FK to auth.users)
    created_by = Column(UUID(as_uuid=True), ForeignKey("auth.users.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, nullable=True, default=datetime.utcnow)  # Changed from NOT NULL
    updated_at = Column(DateTime, nullable=True, default=datetime.utcnow, onupdate=datetime.utcnow)  # Changed from NOT NULL
    
    # Relationships
    # Note: field relationship removed since field_code is TEXT, not FK
    # Note: supervisor relationship removed since created_by is the user reference
    tasks = relationship("Task", back_populates="crop_cycle", foreign_keys="Task.crop_cycle_id")
    notes = relationship("Note", primaryjoin="and_(foreign(Note.related_id)==CropCycle.id, Note.related_type=='crop_cycle')", viewonly=True)
    
    # Property aliases for backward compatibility (if needed)
    @property
    def crop_cycle_id(self):
        """Alias for id for backward compatibility"""
        return self.id
    
    @property
    def crop(self):
        """Alias for crop_name for backward compatibility"""
        return self.crop_name
    
    @property
    def variety(self):
        """Alias for seed_category for backward compatibility"""
        return self.seed_category
    
    @property
    def expected_harvest(self):
        """Alias for expected_harvest_date for backward compatibility"""
        return self.expected_harvest_date
    
    @property
    def stage(self):
        """Alias for current_stage for backward compatibility"""
        return self.current_stage
    
    # Additional aliases for CropCycleIncident compatibility
    @property
    def incident_id(self):
        """Alias for id for CropCycleIncident compatibility"""
        return self.id
    
    @property
    def field_id(self):
        """Alias for field_code for backward compatibility"""
        return self.field_code
    
    @field_id.setter
    def field_id(self, value):
        """Setter for field_code"""
        self.field_code = value
    
    @property
    def crop_variety(self):
        """Alias for seed_category for backward compatibility"""
        return self.seed_category
    
    @property
    def opened_at(self):
        """Alias for created_at for backward compatibility"""
        return self.created_at
    
    @property
    def closed_at(self):
        """Alias for resolved_date for backward compatibility"""
        return self.resolved_date
    
    @closed_at.setter
    def closed_at(self, value):
        """Setter for resolved_date"""
        self.resolved_date = value
    
    @property
    def supervisor_id(self):
        """Alias for created_by for backward compatibility"""
        return self.created_by
    
    # Properties for CropCycleIncidentResponse compatibility
    @property
    def is_voice_recorded(self):
        """Default value for is_voice_recorded (not in database)"""
        return "no"
    
    @property
    def audio_file_path(self):
        """Default value for audio_file_path (not in database)"""
        return None
    
    @property
    def transcript(self):
        """Default value for transcript (not in database)"""
        return None
    
    # Property to convert Date to datetime for response schema
    @property
    def sowing_date_datetime(self):
        """Convert sowing_date (Date) to datetime for response"""
        if self.sowing_date:
            from datetime import datetime
            return datetime.combine(self.sowing_date, datetime.min.time())
        return None
    
    @property
    def expected_harvest_date_datetime(self):
        """Convert expected_harvest_date (Date) to datetime for response"""
        if self.expected_harvest_date:
            from datetime import datetime
            return datetime.combine(self.expected_harvest_date, datetime.min.time())
        return None
