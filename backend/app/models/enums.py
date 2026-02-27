# backend/app/models/enums.py

from enum import Enum

class ResourceType(str, Enum):
    labor = "labor"
    fuel = "fuel"
    material = "material"
    machine = "machine"
    water = "water"
    service = "service"
    contract = "contract"
    other = "other"
    construction = "construction"