from fastapi import APIRouter, UploadFile, Form, HTTPException
from app.database.mongo_db import get_database
from app.utils.llm_utils import get_next_question
from app.utils.speech_utils import transcribe_audio, text_to_speech
from langchain_community.chat_message_histories import ChatMessageHistory
from bson import ObjectId
import uuid
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

AUDIO_DIR = "audios"
os.makedirs(AUDIO_DIR, exist_ok=True)

@router.post("/attend")
async def attend_interview(user_id: str = Form(...), interview_id: str = Form(...), audio: UploadFile = None):
    db = get_database()
    interviews_collection = db["interviews"]
    conversations_collection = db["conversations"]

    logger.info(f"attend_interview called with interview_id: {interview_id}")

    # First try to find by MongoDB _id (since frontend sends the _id)
    try:
        interview_oid = ObjectId(interview_id)
        interview = await interviews_collection.find_one({"_id": interview_oid})
        if interview:
            logger.info(f"Found interview by _id: {interview_id}")
        else:
            # Fallback to interview_id field if _id search fails
            logger.info(f"Not found by _id, trying interview_id field")
            interview = await interviews_collection.find_one({"interview_id": interview_id})
    except Exception as e:
        logger.error(f"Error searching by _id: {e}, trying interview_id field")
        interview = await interviews_collection.find_one({"interview_id": interview_id})
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    instructions = interview.get("interview_instructions", {})
    if isinstance(instructions, dict):
        notes = instructions.get('notes', '')
        tech_stacks = ', '.join(instructions.get('tech_stacks', []))
        time = instructions.get('time', 'N/A')

        # Build instructions with special emphasis on question count if mentioned
        instructions_text = f"Time: {time}\nTech Stacks: {tech_stacks}\n"
        if notes:
            instructions_text += f"Special Instructions: {notes}"
        else:
            instructions_text += "No special instructions."
    else:
        instructions_text = "Conduct a professional interview."

    history = ChatMessageHistory()

    convo_doc = await conversations_collection.find_one({"interview_id": interview_id, "user_id": user_id})
    if convo_doc:
        for turn in convo_doc.get("conversation", []):
            history.add_user_message(turn.get("answer_transcript", ""))
            history.add_ai_message(turn.get("question", ""))

    if not audio:
        ai_question = get_next_question(history, instructions_text)
        audio_filename = f"{interview_id}_{uuid.uuid4()}.mp3"
        audio_path = os.path.join(AUDIO_DIR, audio_filename)
        audio_abs_path = os.path.abspath(audio_path)  # Store absolute path for reliable access
        text_to_speech(ai_question, audio_abs_path)

        await conversations_collection.update_one(
            {"interview_id": interview_id, "user_id": user_id},
            {"$push": {"conversation": {
                "question": ai_question,
                "answer_transcript": "",
                "answer_audio_path": ""
            }}},
            upsert=True
        )

        return {"ai_question": ai_question, "audio_path": f"/audios/{audio_filename}"}

    # Use persistent filename pattern (not temp) so audio files are available for evaluation
    audio_filename = f"{interview_id}_answer_{uuid.uuid4()}.wav"
    audio_path = os.path.join(AUDIO_DIR, audio_filename)
    audio_abs_path = os.path.abspath(audio_path)  # Store absolute path for reliable access
    with open(audio_abs_path, "wb") as f:
        f.write(await audio.read())

    user_answer = transcribe_audio(audio_abs_path)
    # Keep the audio file for evaluation analysis (don't delete)

    await conversations_collection.update_one(
        {"interview_id": interview_id, "user_id": user_id, "conversation.answer_transcript": ""},
        {"$set": {"conversation.$.answer_transcript": user_answer,
                  "conversation.$.answer_audio_path": audio_abs_path}}
    )

    history.add_user_message(user_answer)
    ai_question = get_next_question(history, instructions_text)
    ai_audio_filename = f"{interview_id}_{uuid.uuid4()}.mp3"
    ai_audio_path = os.path.join(AUDIO_DIR, ai_audio_filename)
    ai_audio_abs_path = os.path.abspath(ai_audio_path)  # Store absolute path for reliable access
    text_to_speech(ai_question, ai_audio_abs_path)

    await conversations_collection.update_one(
        {"interview_id": interview_id, "user_id": user_id},
        {"$push": {"conversation": {
            "question": ai_question,
            "answer_transcript": "",
            "answer_audio_path": ""
        }}}
    )

    return {"ai_question": ai_question, "audio_path": f"/audios/{ai_audio_filename}"}