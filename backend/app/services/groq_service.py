"""
GROQ API Service for Voice Transcription
"""
import os
import json
from typing import Dict, Any
from groq import Groq
from app.core.config import settings


class GroqService:
    def __init__(self):
        # Get GROQ API key from settings
        self.api_key = settings.GROQ_API_KEY
        if not self.api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables. Please add it to your .env file.")
        
        self.client = Groq(api_key=self.api_key)
        self.transcription_model = "whisper-large-v3"
        self.llm_model = "llama-3.3-70b-versatile"
    
    def transcribe_audio(self, audio_file_path: str, language: str = "auto") -> str:
        """
        Transcribe audio file using GROQ Whisper API with multi-language support
        
        Args:
            audio_file_path: Path to the audio file
            language: Language code ("en" for English, "hi" for Hindi, "auto" for auto-detect)
            
        Returns:
            Transcribed text
        """
        try:
            with open(audio_file_path, "rb") as audio_file:
                # Auto-detect language if not specified
                # Whisper supports: en, hi, and many other languages
                # Use None for auto-detection
                lang_param = None if language == "auto" else language
                
                transcription = self.client.audio.transcriptions.create(
                    file=(os.path.basename(audio_file_path), audio_file.read()),
                    model=self.transcription_model,
                    response_format="text",
                    language=lang_param,  # None for auto-detect, "hi" for Hindi, "en" for English
                    temperature=0.0
                )
            
            return transcription
            
        except Exception as e:
            raise Exception(f"Error transcribing audio: {str(e)}")
    
    def process_voice_incident(self, audio_file_path: str, language: str = "auto") -> Dict[str, Any]:
        """
        Complete pipeline: transcribe audio
        Supports Hindi, English, and auto-detection
        
        Args:
            audio_file_path: Path to the audio file
            language: Language code ("en", "hi", or "auto" for auto-detect)
            
        Returns:
            Dictionary with transcript
        """
        # Transcribe audio (supports Hindi, English, auto-detect)
        transcript = self.transcribe_audio(audio_file_path, language)
        
        return {
            "transcript": transcript,
            "extracted_data": {}
        }

