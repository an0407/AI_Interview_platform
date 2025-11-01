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

        return result
