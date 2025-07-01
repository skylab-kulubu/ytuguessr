from pydantic import BaseModel, ConfigDict
from typing import Optional

class LocationDetail(BaseModel):
    id: int
    image_url: str
    lat: float
    lng: float

    model_config = ConfigDict(from_attributes=True)

class LocationCreate(BaseModel):
    image_url: str
    lat: float
    lng: float

    model_config = ConfigDict(from_attributes=True)

class LocationUpdate(BaseModel):
    image_url: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)
