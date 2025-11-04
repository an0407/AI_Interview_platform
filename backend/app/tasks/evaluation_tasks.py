"""
Background tasks for interview evaluation.

This module handles automatic evaluation of interviews when they are marked as completed.
Results are stored in the database to avoid recalculation.
"""

import asyncio
import logging
from datetime import datetime
from app.database.mongo_db import get_database
from app.operations.evaluation_service import InterviewEvaluationService
from app.operations.score_evaluation_service import ScoringService
from app.models.evaluation_result_model import EvaluationResultModel

logger = logging.getLogger(__name__)


class EvaluationTask:
    """Handles automatic evaluation of completed interviews."""

    def __init__(self):
        # Services will be initialized per-evaluation with database instance
        pass

    async def evaluate_interview(self, interview_id: str, user_id: str) -> bool:
        """
        Evaluate a completed interview and store results in database.

        Args:
            interview_id: The interview ID
            user_id: The user ID

        Returns:
            True if evaluation succeeded, False otherwise
        """
        db = get_database()
        evaluation_results_collection = db["evaluation_results"]

        try:
            logger.info(f"Starting evaluation for interview {interview_id} by user {user_id}")

            # Mark evaluation as in-progress
            in_progress_doc = EvaluationResultModel.create_in_progress_document(
                interview_id=interview_id,
                user_id=user_id
            )

            await evaluation_results_collection.update_one(
                {"interview_id": interview_id, "user_id": user_id},
                {"$set": in_progress_doc},
                upsert=True
            )

            # Perform evaluation using InterviewEvaluationService
            logger.info(f"Evaluating interview {interview_id}...")
            evaluation_service = InterviewEvaluationService(db)
            evaluation_result = await evaluation_service.evaluate(interview_id)

            # Check if evaluation was successful
            if evaluation_result.get("status") != "success":
                error_msg = evaluation_result.get("message", "Evaluation returned non-success status")
                raise Exception(error_msg)

            # Extract interview result
            interview_result = evaluation_result.get("interview_result", {})

            # Store successful evaluation
            success_doc = EvaluationResultModel.create_document(
                interview_id=interview_id,
                user_id=user_id,
                interview_result=interview_result,
                status="completed",
                error=None
            )

            await evaluation_results_collection.update_one(
                {"interview_id": interview_id, "user_id": user_id},
                {"$set": success_doc},
                upsert=True
            )

            logger.info(f"✅ Evaluation completed for interview {interview_id}")
            return True

        except Exception as e:
            error_msg = f"Evaluation failed: {str(e)}"
            logger.error(error_msg, exc_info=True)

            # Store failed evaluation
            failed_doc = EvaluationResultModel.create_document(
                interview_id=interview_id,
                user_id=user_id,
                interview_result={},
                status="failed",
                error=error_msg
            )

            try:
                await evaluation_results_collection.update_one(
                    {"interview_id": interview_id, "user_id": user_id},
                    {"$set": failed_doc},
                    upsert=True
                )
            except Exception as db_error:
                logger.error(f"Failed to store error result: {db_error}")

            return False

    async def evaluate_interview_async(self, interview_id: str, user_id: str) -> None:
        """
        Asynchronously evaluate an interview without waiting for completion.
        Designed to be called as a background task.

        Args:
            interview_id: The interview ID
            user_id: The user ID
        """
        try:
            # Run evaluation in a non-blocking way
            await self.evaluate_interview(interview_id, user_id)
        except Exception as e:
            logger.error(f"Background evaluation task failed: {e}", exc_info=True)


# Global evaluation task instance
evaluation_task = EvaluationTask()


async def trigger_evaluation(interview_id: str, user_id: str) -> None:
    """
    Trigger automatic evaluation for a completed interview.

    This function creates a background task that evaluates the interview
    without blocking the response.

    Args:
        interview_id: The interview ID
        user_id: The user ID
    """
    # Create background task (non-blocking)
    asyncio.create_task(
        evaluation_task.evaluate_interview_async(interview_id, user_id)
    )

    logger.info(f"Evaluation task queued for interview {interview_id}")
