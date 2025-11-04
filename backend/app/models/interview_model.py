from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
from app.database.mongo_db import get_database

class InterviewStatus(str, Enum):
    assigned = "assigned"
    in_progress = "InProgress"
    completed = "completed"

class InterviewInstructions(BaseModel):
    time: str
    tech_stacks: List[str]
    notes: Optional[str] = None

class Interview(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    interview_id: str
    manager_id: str
    employee_ids: List[str]
    interview_instructions: InterviewInstructions
    status: InterviewStatus = InterviewStatus.assigned
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

# Get interviews collection from database
def get_interviews_collection():
    db = get_database()
    return db["interviews"]
