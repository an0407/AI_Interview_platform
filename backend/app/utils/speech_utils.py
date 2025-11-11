import os
import tempfile
import whisper_timestamped as whisper
from gtts import gTTS
import torch

# Load Whisper model once at module level for better performance
_whisper_model = None

def get_whisper_model():
    """Get or initialize the Whisper model (singleton pattern)"""
    global _whisper_model
    if _whisper_model is None:
        _whisper_model = whisper.load_model("base", device="cpu")
    return _whisper_model

def transcribe_audio(audio_path: str) -> str:
    model = get_whisper_model()  # Reuse loaded model
    audio = whisper.load_audio(audio_path)
    result = whisper.transcribe(model, audio)
    return result["text"]

def text_to_speech(text: str, output_path: str):
    tts = gTTS(text)
    tts.save(output_path)
    return output_path