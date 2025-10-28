from pydantic import BaseModel
from typing import List, Optional


class CropCatalogResponse(BaseModel):
    id: int
    crop: str
    varieties: Optional[List[str]]
    default_stages: List[str]

    class Config:
        from_attributes = True

