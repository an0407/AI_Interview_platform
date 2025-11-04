from fastapi import APIRouter, Depends, HTTPException
from app.operations.evaluation_service import InterviewEvaluationService
from app.schemas.interview_model_eval import InterviewData
import logging
from fastapi import logger
from app.database.mongo_db import get_database


logger = logging.getLogger(__name__)
eval_router = APIRouter()


@eval_router.get("/evaluate/{interview_id}")
async def evaluate_interview(interview_id: str, db=Depends(get_database), force_refresh: bool = False):
    """
    Get evaluation results for an interview.

    Args:
        interview_id: The interview ID
        db: Database connection
        force_refresh: If True, ignore cache and recalculate evaluation

    Returns:
        Evaluation results (from cache if available, otherwise calculated)
    """
    logger.info(f"Received evaluation request for interview_id: {interview_id}, force_refresh={force_refresh}")

    # Check if evaluation results are already cached in database
    if not force_refresh:
        evaluation_results_collection = db["evaluation_results"]
        cached_result = await evaluation_results_collection.find_one(
            {"interview_id": interview_id}
        )

        if cached_result and cached_result.get("status") == "completed":
            logger.info(f"Returning cached evaluation results for interview {interview_id}")
            # Convert ObjectId to string for JSON serialization
            if "_id" in cached_result:
                cached_result["_id"] = str(cached_result["_id"])
            if "created_at" in cached_result:
                cached_result["created_at"] = cached_result["created_at"].isoformat()
            if "updated_at" in cached_result:
                cached_result["updated_at"] = cached_result["updated_at"].isoformat()
            return cached_result

        if cached_result and cached_result.get("status") == "in_progress":
            logger.info(f"Evaluation in progress for interview {interview_id}")
            return {
                "status": "in_progress",
                "message": "Evaluation is currently in progress. Please try again in a few moments.",
                "interview_id": interview_id
            }

        if cached_result and cached_result.get("status") == "failed":
            logger.warning(f"Previous evaluation failed for interview {interview_id}: {cached_result.get('error')}")
            return {
                "status": "failed",
                "message": f"Evaluation failed: {cached_result.get('error')}",
                "interview_id": interview_id
            }

    logger.info(f"Computing/recalculating evaluation for interview {interview_id}")

    try:
        result = await InterviewEvaluationService(db).evaluate(interview_id)
        logger.info(f"Evaluation completed for interview_id {interview_id}")
        return result
    except Exception as e:
        logger.error(f"Evaluation failed for interview {interview_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")


@eval_router.post("/re-evaluate/{interview_id}")
async def re_evaluate_interview(interview_id: str, db=Depends(get_database)):
    """
    Force re-evaluation of an interview, ignoring cached results.

    This endpoint recalculates the evaluation from scratch and updates the cache.

    Args:
        interview_id: The interview ID
        db: Database connection

    Returns:
        Fresh evaluation results
    """
    logger.info(f"Received re-evaluation request for interview_id: {interview_id}")

    # Mark evaluation as in-progress
    evaluation_results_collection = db["evaluation_results"]
    await evaluation_results_collection.update_one(
        {"interview_id": interview_id},
        {
            "$set": {
                "status": "in_progress",
                "error": None
            }
        },
        upsert=True
    )

    try:
        # Recalculate evaluation
        result = await InterviewEvaluationService(db).evaluate(interview_id)
        logger.info(f"Re-evaluation completed for interview_id {interview_id}")

        # Update cache with new results
        if result.get("status") == "success":
            await evaluation_results_collection.update_one(
                {"interview_id": interview_id},
                {
                    "$set": {
                        "status": "completed",
                        "interview_result": result.get("interview_result"),
                        "error": None
                    }
                }
            )

        return result

    except Exception as e:
        error_msg = f"Re-evaluation failed: {str(e)}"
        logger.error(error_msg, exc_info=True)

        # Update cache with error
        await evaluation_results_collection.update_one(
            {"interview_id": interview_id},
            {
                "$set": {
                    "status": "failed",
                    "error": error_msg
                }
            }
        )

        raise HTTPException(status_code=500, detail=error_msg)
