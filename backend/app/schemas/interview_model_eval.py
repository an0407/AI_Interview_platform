from pydantic import BaseModel
from typing import List

class QAItem(BaseModel):
    question: str
    answer_transcript: str
    answer_audio_path: str | None = None

class InterviewData(BaseModel):
    interview_id: str
    user_id: str
    interview_instruction: str
    title: str
    conversation: List[QAItem]


