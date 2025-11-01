import statistics

class ScoringService:
    def aggregate(self, technical_scores: dict) -> dict:
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
                averages[m] = round(statistics.mean(q[m] for q in question_results), 2)
            except Exception:
                averages[m] = 0.0

        # Calculate overall average
        overall = round(statistics.mean(averages.values()), 2)

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

        # Build final summarized feedback paragraph
        summary_feedback = (
            f"Overall, the candidate shows a technical score of {averages['technical_score']}/10, "
            f"depth score of {averages['depth_score']}/10, clarity score of {averages['clarity_score']}/10, "
            f"and practical understanding score of {averages['practical_score']}/10. "
            f"The overall performance score is {overall}/10. "
            f"Key strengths include {', '.join(strengths[:3]) if strengths else 'general competence'}, "
            f"while improvement areas include {', '.join(improvements[:3]) if improvements else 'minor refinements'}."
        )

        # Return structured report
        return {
            "overall_score": overall,
            "criteria_scores": averages,
            "strengths": strengths,
            "improvement_areas": improvements,
            "combined_feedback": " ".join(feedbacks),
            "summary": summary_feedback
        }
