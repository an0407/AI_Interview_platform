from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from bson import ObjectId
from app.database.mongo_db import get_database

class User(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    name: str
    email: EmailStr
    password: Optional[str] = None  # Should not be returned in responses
    role: str  # "manager" or "employee"
    created_at: Optional[str] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

# Get users collection from database
def get_users_collection():
    db = get_database()
    return db["users"]
