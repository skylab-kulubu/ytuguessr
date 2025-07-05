from pydantic import BaseModel, EmailStr
from typing import Optional

class StartGameRequest(BaseModel):
    school_mail: Optional[EmailStr] = None
    show_name: bool = True
    again: bool = False

class GuessRequest(BaseModel):
    latitude: float
    longitude: float