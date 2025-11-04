import os
import tempfile
import whisper_timestamped as whisper
from gtts import gTTS
import torch

def transcribe_audio(audio_path: str) -> str:
    model = whisper.load_model("base", device="cpu")
    audio = whisper.load_audio(audio_path)
    result = whisper.transcribe(model, audio)
    return result["text"]

def text_to_speech(text: str, output_path: str):
    tts = gTTS(text)
    tts.save(output_path)
    return output_path