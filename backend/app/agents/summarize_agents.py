import re
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
import json

class SummaryService:
    def __init__(self, model="gpt-4o-mini"):
        self.llm = ChatOpenAI(model=model, temperature=0.5)

    async def summarize_strengths(self, strengths: list) -> str:
        if not strengths:
            return "No specific strengths identified."
        prompt = ChatPromptTemplate.from_template(
            "Summarize the following candidate strengths into a short paragraph:\n\n{points}"
        )
        return (await self.llm.ainvoke(prompt.format(points='\n'.join(strengths)))).content

    async def summarize_improvements(self, improvements: list) -> str:
        if not improvements:
            return "No major improvement areas noted."
        prompt = ChatPromptTemplate.from_template(
            "Summarize the following improvement areas into a short paragraph:\n\n{points}"
        )
        return (await self.llm.ainvoke(prompt.format(points='\n'.join(improvements)))).content

    async def summarize_feedback(self, feedbacks: str) -> str:
        if not feedbacks:
            return "No specific feedback provided."
        prompt = ChatPromptTemplate.from_template(
            "Summarize the following detailed feedback into a concise evaluation summary:\n\n{feedbacks}"
        )
        return (await self.llm.ainvoke(prompt.format(feedbacks=feedbacks))).content
