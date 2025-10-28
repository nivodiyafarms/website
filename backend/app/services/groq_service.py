"""
GROQ API Service for Voice Transcription and Incident Data Extraction
"""
import os
import json
import base64
from typing import Dict, Any
from groq import Groq
from app.schemas.incident import IncidentFromTranscript
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
    
    def extract_incident_data(self, transcript: str) -> IncidentFromTranscript:
        """
        Extract structured incident data from transcript using GROQ LLM
        Supports multiple languages including Hindi and English
        
        Args:
            transcript: The transcribed text from audio (any language)
            
        Returns:
            IncidentFromTranscript object with extracted data
        """
        system_prompt = """You are an AI assistant helping farmers report farm incidents in India. 
You understand BOTH English and Hindi languages.

Your task is to extract structured information from their voice recording transcript (which may be in Hindi, English, or Hinglish).

Extract the following information if mentioned:
- title: A short English title for the incident (generate one if not explicitly stated)
- description: Detailed English description of what happened (translate from Hindi if needed)
- incident_type: One of: PEST_ATTACK, DISEASE, WEATHER_DAMAGE, EQUIPMENT_FAILURE, IRRIGATION_ISSUE, THEFT, ANIMAL_DAMAGE, SOIL_ISSUE, OTHER
- severity: One of: LOW, MEDIUM, HIGH, CRITICAL
  - "कम" or "थोड़ा" → LOW
  - "मध्यम" or "ठीक-ठाक" → MEDIUM  
  - "ज्यादा" or "गंभीर" → HIGH
  - "बहुत गंभीर" or "खतरनाक" → CRITICAL
- field_id: Field identifier if mentioned (e.g., "F_001", "खेत 1", "फील्ड एक")
- location_description: Where in the farm this happened (translate to English)
- affected_area_acre: Area affected in acres (extract number from "एकड़", "एकर", "acre")
- estimated_loss: Estimated financial loss in rupees (extract number from "रुपये", "रुपए", "rupees")
- crop_affected: Which crop is affected (translate crop names: "गेहूं"→Wheat, "सोयाबीन"→Soybean, "मोरिंगा"→Moringa, etc.)
- incident_date: When it happened (ISO format)
- action_taken: Any immediate action taken (translate to English)

Common Hindi terms to recognize:
- कीट प्रकोप / कीड़ा लगना = PEST_ATTACK
- बीमारी / रोग = DISEASE
- मौसम क्षति / तूफ़ान = WEATHER_DAMAGE
- मशीन खराब = EQUIPMENT_FAILURE
- सिंचाई समस्या / पानी की कमी = IRRIGATION_ISSUE
- चोरी = THEFT
- जानवर का नुकसान = ANIMAL_DAMAGE

Return ONLY a valid JSON object with these fields in English. Use null for missing information.
Do not include any explanation, just the JSON."""

        user_prompt = f"""Here is the farmer's incident report:

{transcript}

Extract the incident information and return as JSON."""

        try:
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model=self.llm_model,
                temperature=0.1,
                max_tokens=1000,
                response_format={"type": "json_object"}
            )
            
            response_text = chat_completion.choices[0].message.content
            extracted_data = json.loads(response_text)
            
            # Convert to IncidentFromTranscript schema
            incident_data = IncidentFromTranscript(**extracted_data)
            
            return incident_data
            
        except json.JSONDecodeError as e:
            raise Exception(f"Error parsing LLM response: {str(e)}")
        except Exception as e:
            raise Exception(f"Error extracting incident data: {str(e)}")
    
    def process_voice_incident(self, audio_file_path: str, language: str = "auto") -> Dict[str, Any]:
        """
        Complete pipeline: transcribe audio and extract incident data
        Supports Hindi, English, and auto-detection
        
        Args:
            audio_file_path: Path to the audio file
            language: Language code ("en", "hi", or "auto" for auto-detect)
            
        Returns:
            Dictionary with transcript and extracted data
        """
        # Transcribe audio (supports Hindi, English, auto-detect)
        transcript = self.transcribe_audio(audio_file_path, language)
        
        # Extract structured data (works with both Hindi and English)
        extracted_data = self.extract_incident_data(transcript)
        
        return {
            "transcript": transcript,
            "extracted_data": extracted_data
        }

