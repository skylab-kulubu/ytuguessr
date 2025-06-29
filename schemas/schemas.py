from pydantic import BaseModel, EmailStr

class StartGameRequest(BaseModel):
    school_mail: EmailStr
    show_name: bool = True