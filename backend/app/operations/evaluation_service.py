from app.schemas.interview_model_eval import InterviewData
import logging
from app.agents.evaluater_agent import TextEvaluationService
from app.operations.audio_evaluation_service import AudioEvaluationService
from app.operations.score_evaluation_service import ScoringService
from bson import ObjectId


logger = logging.getLogger(__name__)

class InterviewEvaluationService:

    def __init__(self, db):
        self.db = db
        self.collection = db["interview_conversations"]
        self.evaluation_service = TextEvaluationService()
        self.audio_service = AudioEvaluationService()
        self.scoring_service = ScoringService()

    async def evaluate(self, interview_id: str):
        # Simulate some evaluation logic
        logger.info(f"Evaluating interview data for interview_id: {interview_id}")
        interview_data = await self.collection.find_one({"interview_id": interview_id})
        if not interview_data:
            logger.error(f"No interview data found for interview_id: {interview_id}")
            return {"status": "error", "message": "Interview data not found"}
        
        logger.info(f"Interview data found: {interview_id}")

        technical_scores = {}
        audio_results = {}
        qs_count = 1
        for convo in interview_data["conversation"]:
            question = convo["question"]
            answer = convo["answer_transcript"]
            result = await self.evaluation_service.evaluate_answer(question, answer)
            logger.info(f"Evaluation result for question {qs_count}")
            technical_scores[qs_count] = result
            qs_count += 1
        
        qs_count = 1
        for convo in interview_data["conversation"]:
            audio_file_path = convo["answer_audio_path"]
            result = self.audio_service.analyze_audio(audio_file_path)
            logger.info(f"Audio analysis result for file '{audio_file_path}'")
            audio_results[qs_count] = result
            qs_count += 1

        aggregated_scores = await self.scoring_service.aggregate(technical_scores)
        logger.info(f"Aggregated scores computed for interview_id {interview_id}")

        return {"status": "success",
                 "interview_result": {
                    "technical_scores": technical_scores,
                    "aggregated_scores": aggregated_scores,
                    "audio_results": audio_results
                }
        }