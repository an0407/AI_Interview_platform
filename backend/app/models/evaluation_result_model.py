"""
Evaluation Result Model

Stores permanent evaluation results for interviews.
This prevents recalculation of evaluation every time results are viewed.
"""

from datetime import datetime
from typing import Dict, List, Any, Optional
from enum import Enum
from bson import ObjectId


class EvaluationResultModel:
    """
    Represents a permanent evaluation result stored in the database.

    Structure:
    {
        "_id": ObjectId,
        "interview_id": str,
        "user_id": str,
        "created_at": datetime,
        "updated_at": datetime,
        "status": "completed" | "failed" | "in_progress",
        "interview_result": {
            "technical_scores": {
                "question_1": {
                    "technical_score": 8,
                    "depth_score": 7,
                    "clarity_score": 9,
                    "practical_score": 8,
                    "overall_score": 80,
                    "feedback": "...",
                    "strengths": [...],
                    "improvements": [...]
                },
                ...
            },
            "audio_results": {
                "question_1": {
                    "confidence_score": 0.85,
                    "speech_rate": 120,
                    "status": "success"
                },
                ...
            },
            "aggregated_scores": {
                "overall_score": 82,
                "criteria_scores": {
                    "technical_score": 80,
                    "depth_score": 75,
                    "clarity_score": 85,
                    "practical_score": 80
                },
                "strengths": "...",
                "improvement_areas": "...",
                "combined_feedback": "..."
            }
        },
        "error": None | str  # If evaluation failed
    }
    """

    collection_name = "evaluation_results"

    @staticmethod
    def create_document(
        interview_id: str,
        user_id: str,
        interview_result: Dict[str, Any],
        status: str = "completed",
        error: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create an evaluation result document for storage.

        Args:
            interview_id: The interview ID
            user_id: The user ID
            interview_result: The evaluation result data
            status: "completed", "failed", or "in_progress"
            error: Error message if evaluation failed

        Returns:
            Dictionary ready for MongoDB insertion
        """
        now = datetime.utcnow()

        return {
            "interview_id": interview_id,
            "user_id": user_id,
            "created_at": now,
            "updated_at": now,
            "status": status,
            "interview_result": interview_result,
            "error": error
        }

    @staticmethod
    def create_in_progress_document(interview_id: str, user_id: str) -> Dict[str, Any]:
        """
        Create an in-progress evaluation result document.

        Args:
            interview_id: The interview ID
            user_id: The user ID

        Returns:
            Dictionary ready for MongoDB insertion
        """
        return EvaluationResultModel.create_document(
            interview_id=interview_id,
            user_id=user_id,
            interview_result={},
            status="in_progress",
            error=None
        )
