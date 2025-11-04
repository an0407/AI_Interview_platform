from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from enum import Enum

class InterviewInstructions(BaseModel):
    time: str
    tech_stacks: List[str]
    notes: Optional[str] = None

class AssignInterviewRequest(BaseModel):
    interview_id: str = str(uuid.uuid4())  # auto-generate UUID
    manager_id: str
    employee_ids: List[str]
    interview_instructions: InterviewInstructions

class Status(str, Enum):
    assigned = "assigned"
    in_progress = "InProgress"
    completed = "completed"

class Interview(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    interview_id: str
    manager_id: str
    employee_ids: List[str]
    interview_instructions: InterviewInstructions
    status: Status