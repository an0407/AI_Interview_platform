from pydantic import BaseModel
from typing import List, Optional
import uuid

class InterviewInstructions(BaseModel):
    time: str
    tech_stacks: List[str]
    notes: Optional[str] = None

class AssignInterviewRequest(BaseModel):
    interview_id: str = str(uuid.uuid4())  # auto-generate UUID
    manager_id: str
    employee_ids: List[str]
    interview_instructions: InterviewInstructions
