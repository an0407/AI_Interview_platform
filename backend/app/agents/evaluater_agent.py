import re
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
import json

load_dotenv()

class TextEvaluationService:
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.4)

    async def evaluate_answer(self, question: str, answer: str) -> dict:
        prompt = ChatPromptTemplate.from_template("""
        You are an expert interviewer.
        Evaluate the candidate's answer below:
        Question: {question}
        Answer: {answer}

        Rate the following from 1–10:
        - Technical correctness
        - Depth of knowledge
        - Clarity of explanation
        - Practical understanding

        Then summarize strengths and improvements in 2–3 sentences.
        Always provide constructive feedback.
        Your response must be in valid JSON format as shown below: Don't include any explanations outside the JSON.
        Return output as JSON:
        {{
            "technical_score": ...,
            "depth_score": ...,
            "clarity_score": ...,
            "practical_score": ...,
            "feedback": "...",
            "strengths": [...],
            "improvements": [...]
        }}
        """)
        chain = prompt | self.llm
        response = await chain.ainvoke({"question": question, "answer": answer})
        response_text = response.content.strip()
        response_text = re.sub(r'^```json|```$', '', response_text).strip()
        try:
            result = json.loads(response_text)
        except json.JSONDecodeError:
            result = {"technical_score": 0, "feedback": "Failed to parse response"}

        # Calculate overall_score from the 4 metrics (1-10 scale)
        # Convert to 0-100 scale for frontend display
        try:
            avg_score = (
                result.get("technical_score", 0) +
                result.get("depth_score", 0) +
                result.get("clarity_score", 0) +
                result.get("practical_score", 0)
            ) / 4
            result["overall_score"] = round(avg_score * 10, 2)  # Convert 1-10 to 0-100
        except Exception as e:
            result["overall_score"] = 0

        return result
