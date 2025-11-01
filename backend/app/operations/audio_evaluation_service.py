import librosa
import numpy as np
import os
import logging

logger = logging.getLogger(__name__)

class AudioEvaluationService:
    def analyze_audio(self, file_path: str) -> dict:
        try:
            # Check if file exists
            if not os.path.exists(file_path):
                logger.warning(f"Audio file not found: {file_path}")
                return {
                    "confidence_score": 0.0,
                    "speech_rate": 0.0,
                    "status": "file_not_found"
                }

            # Load audio
            y, sr = librosa.load(file_path, sr=None)

            # Compute tempo (speech rate)
            tempo_data = librosa.beat.beat_track(y=y, sr=sr)
            tempo = float(tempo_data[0]) if isinstance(tempo_data, tuple) else float(tempo_data)

            # Compute energy (RMS)
            rms = librosa.feature.rms(y=y)
            energy = float(np.mean(rms))

            # Simple heuristic for confidence
            confidence_score = min(10.0, (energy * 20) + (tempo / 30.0))

            return {
                "confidence_score": round(confidence_score, 2),
                "speech_rate": round(tempo, 2),
                "status": "success"
            }

        except Exception as e:
            logger.error(f"Error analyzing audio {file_path}: {e}")
            return {
                "confidence_score": 0.0,
                "speech_rate": 0.0,
                "status": f"error: {str(e)}"
            }
