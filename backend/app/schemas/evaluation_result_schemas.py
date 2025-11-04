"""
Pydantic schemas for evaluation results.
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime


class TechnicalScoreDetail(BaseModel):
    """Technical score for a single question."""
    technical_score: float = Field(..., ge=0, le=10)
    depth_score: float = Field(..., ge=0, le=10)
    clarity_score: float = Field(..., ge=0, le=10)
    practical_score: float = Field(..., ge=0, le=10)
    overall_score: float = Field(..., ge=0, le=100)
    feedback: Optional[str] = None
    strengths: Optional[List[str]] = None
    improvements: Optional[List[str]] = None


class AudioAnalysisResult(BaseModel):
    """Audio analysis for a single question."""
    confidence_score: float = Field(..., ge=0, le=1)
    speech_rate: float = Field(...)  # BPM or words per minute
    status: str  # "success" or error message


class CriteriaScores(BaseModel):
    """Aggregated criteria scores."""
    technical_score: float = Field(..., ge=0, le=100)
    depth_score: float = Field(..., ge=0, le=100)
    clarity_score: float = Field(..., ge=0, le=100)
    practical_score: float = Field(..., ge=0, le=100)


class AggregatedScores(BaseModel):
    """Overall aggregated scores and feedback."""
    overall_score: float = Field(..., ge=0, le=100)
    criteria_scores: Dict[str, float]
    strengths: Optional[str] = None
    improvement_areas: Optional[str] = None
    combined_feedback: Optional[str] = None


class InterviewEvaluationResult(BaseModel):
    """Complete interview evaluation result."""
    technical_scores: Dict[str, TechnicalScoreDetail]
    audio_results: Dict[str, AudioAnalysisResult]
    aggregated_scores: AggregatedScores


class EvaluationResultResponse(BaseModel):
    """Response model for evaluation results."""
    interview_id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    status: str  # "completed", "failed", or "in_progress"
    interview_result: InterviewEvaluationResult
    error: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "interview_id": "507f1f77bcf86cd799439011",
                "user_id": "507f1f77bcf86cd799439012",
                "created_at": "2024-01-15T10:30:00Z",
                "updated_at": "2024-01-15T10:30:00Z",
                "status": "completed",
                "interview_result": {
                    "technical_scores": {},
                    "audio_results": {},
                    "aggregated_scores": {}
                },
                "error": None
            }
        }


class EvaluationResultCreateRequest(BaseModel):
    """Request model for creating evaluation results."""
    interview_id: str
    user_id: str
    interview_result: InterviewEvaluationResult


class EvaluationResultUpdateRequest(BaseModel):
    """Request model for updating evaluation results."""
    status: Optional[str] = None
    interview_result: Optional[InterviewEvaluationResult] = None
    error: Optional[str] = None
