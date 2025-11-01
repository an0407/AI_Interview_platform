from pydantic import BaseModel, Field
from typing import Optional

class User(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    name: str
    email: str
    role: str  # "manager" or "employee"
