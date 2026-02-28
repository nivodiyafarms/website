"""
CropCycleNote model - DEPRECATED
The database uses 'notes' table with polymorphic relationships, not 'crop_cycle_notes'.
This model is kept for backward compatibility but should use Note instead.
"""
from app.models.note import Note

# Alias CropCycleNote to Note for backward compatibility
# Note: Use Note model with related_type='crop_cycle' and related_id=<crop_cycle_id>
CropCycleNote = Note


