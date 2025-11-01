from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return str(v)

class UserCreate(BaseModel):
    user_id: str
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "employee"

class User(BaseModel):
    id: Optional[str] = Field(alias="_id")
    user_id: str
    name: str
    email: EmailStr
    password: Optional[str] = None
    role: Optional[str] = "employee"

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class LoginRequest(BaseModel):
    email: str
    password: str