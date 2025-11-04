import statistics
from app.agents.summarize_agents import SummaryService

class ScoringService:
    def __init__(self):
        self.summary_service = SummaryService()

    async def aggregate(self, technical_scores: dict) -> dict:
        """
        Aggregate all question results into an overall evaluation summary.
        """
        # Convert the dict values (each question result) into a list
        question_results = list(technical_scores.values())

        # Metrics to average
        metrics = ["technical_score", "depth_score", "clarity_score", "practical_score"]

        # Calculate averages for each metric
        averages = {}
        for m in metrics:
            try:
                avg = statistics.mean(q[m] for q in question_results)
                # Scale from 1-10 to 0-100 for frontend display
                averages[m] = round(avg * 10, 2)
            except Exception:
                averages[m] = 0.0

        # Calculate overall average (scale to 0-100)
        try:
            overall = round(statistics.mean(q.get("overall_score", 0) for q in question_results), 2)
        except Exception:
            overall = 0.0

        # Collect all strengths and improvements across questions
        strengths = []
        improvements = []
        feedbacks = []

        for q in question_results:
            strengths.extend(q.get("strengths", []))
            improvements.extend(q.get("improvements", []))
            feedbacks.append(q.get("feedback", ""))

        # Deduplicate and clean
        strengths = list(set(strengths))
        improvements = list(set(improvements))

        summarized_strengths = await self.summary_service.summarize_strengths(strengths)
        summarized_improvements = await self.summary_service.summarize_improvements(improvements)
        summarized_feedback = await self.summary_service.summarize_feedback(" ".join(feedbacks))

        # summary_feedback = (
        #     f"Overall, the candidate achieved an average technical score of {averages['technical_score']}/10 "
        #     f"and an overall score of {overall}/10. "
        #     f"{summarized_feedback}\n\n"
        #     f"**Strengths Summary:** {summarized_strengths}\n\n"
        #     f"**Improvement Summary:** {summarized_improvements}"
        # )

        return {
            "overall_score": overall,
            "criteria_scores": averages,
            "strengths": summarized_strengths,
            "improvement_areas": summarized_improvements,
            "combined_feedback": summarized_feedback,
            #"summary": summary_feedback
        }
