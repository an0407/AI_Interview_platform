from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    id: Optional[str]
    name: str
    email: EmailStr
    password: str
    role: str
