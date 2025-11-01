from fastapi import APIRouter, Depends
from app.operations.evaluation_service import InterviewEvaluationService
from app.schemas.interview_model_eval import InterviewData
import logging
from fastapi import logger
from app.database.mongo_db import get_database


logger = logging.getLogger(__name__)
eval_router = APIRouter()


@eval_router.get("/evaluate/{interview_id}")
async def evaluate_interview(interview_id: str, db=Depends(get_database)):

    logger.info(f"Received evaluation request for interview_id: {interview_id}")

    result = await InterviewEvaluationService(db).evaluate(interview_id)

    logger.info(f"Evaluation result for interview_id {interview_id}: {result}")

    return result
