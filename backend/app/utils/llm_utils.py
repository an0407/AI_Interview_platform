from langchain_openai import ChatOpenAI
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
import os

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

llm = ChatOpenAI(model=OPENAI_MODEL, api_key=OPENAI_API_KEY)

SYSTEM_PROMPT = """You are an AI interviewer.
Your task is to conduct a professional interview with the candidate based on the given instructions.
Follow a conversational style, ask one question at a time, and keep the tone natural.
IMPORTANT: Follow the manager's instructions carefully, especially regarding the NUMBER OF QUESTIONS to ask.
If the manager specifies a specific number of questions, stop after that exact number and politely conclude the interview.

Instructions from manager:
{interview_instructions}
"""

def get_next_question(chat_history: ChatMessageHistory, interview_instructions: str):
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("placeholder", "{chat_history}"),
        ("user", "Based on the previous conversation, ask the next interview question.")
    ])

    messages = prompt.format_messages(
        interview_instructions=interview_instructions,
        chat_history=chat_history.messages
    )

    response = llm.invoke(messages)
    return response.content