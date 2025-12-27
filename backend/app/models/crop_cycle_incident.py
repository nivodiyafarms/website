"""
CropCycleIncident model - DEPRECATED
The database uses 'crop_cycles' table, not 'crop_cycle_incidents'.
This model is kept for backward compatibility but should use CropCycle instead.
"""
from app.models.crop_cycle import CropCycle, CropStage, CropCycleStatus

# Alias CropCycleIncident to CropCycle for backward compatibility
CropCycleIncident = CropCycle

# Export enums for backward compatibility
__all__ = ["CropCycleIncident", "CropStage", "CropCycleStatus"]
