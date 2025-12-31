"""
OpenAI API Service for Chatbot and Voice Transcription
"""
import os
from typing import Dict, Any, List, Optional
from openai import OpenAI
from app.core.config import settings


class OpenAIService:
    def __init__(self):
        # Get OpenAI API key from settings
        self.api_key = settings.OPENAI_API_KEY
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables. Please add it to your .env file.")
        
        # Initialize OpenAI client
        # Workaround for version incompatibility with httpx and proxies
        import os
        import httpx
        
        # Temporarily remove proxy env vars to avoid httpx compatibility issues
        proxy_vars = ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy', 'ALL_PROXY', 'all_proxy']
        saved_proxies = {}
        for var in proxy_vars:
            if var in os.environ:
                saved_proxies[var] = os.environ[var]
                del os.environ[var]
        
        try:
            # Create httpx client without proxies to avoid compatibility issues
            http_client = httpx.Client(
                timeout=httpx.Timeout(60.0),
                # Don't pass proxies to avoid the error
            )
            
            self.client = OpenAI(
                api_key=self.api_key,
                http_client=http_client
            )
        except Exception as e:
            # If that fails, try simple initialization
            try:
                self.client = OpenAI(api_key=self.api_key)
            except Exception as e2:
                # Restore proxy vars before raising
                for var, value in saved_proxies.items():
                    os.environ[var] = value
                raise ValueError(
                    f"OpenAI client initialization failed: {str(e2)}. "
                    "This might be due to a version incompatibility. "
                    "Try: pip uninstall openai httpx -y && pip install openai==1.51.0 httpx>=0.27.0"
                )
        finally:
            # Restore proxy env vars
            for var, value in saved_proxies.items():
                os.environ[var] = value
        
        self.transcription_model = "whisper-1"  # OpenAI Whisper model
        self.chat_model = "gpt-4o"  # GPT-4 Omni for better performance
    
    def transcribe_audio(self, audio_file_path: str, language: Optional[str] = None) -> str:
        """
        Transcribe audio file using OpenAI Whisper API with multi-language support
        
        Args:
            audio_file_path: Path to the audio file
            language: Language code ("en" for English, "hi" for Hindi, None for auto-detect)
            
        Returns:
            Transcribed text
        """
        try:
            with open(audio_file_path, "rb") as audio_file:
                # OpenAI Whisper API
                transcript = self.client.audio.transcriptions.create(
                    model=self.transcription_model,
                    file=audio_file,
                    language=language,  # None for auto-detect, "hi" for Hindi, "en" for English
                    response_format="text"
                )
            
            return transcript if isinstance(transcript, str) else transcript.text
            
        except Exception as e:
            raise Exception(f"Error transcribing audio: {str(e)}")
    
    def detect_language(self, text: str) -> str:
        """
        Detect if text is Hindi or English
        Uses simple heuristic: if text contains Devanagari characters, it's Hindi
        
        Args:
            text: Input text
            
        Returns:
            "hi" for Hindi, "en" for English
        """
        # Check for Devanagari script (Hindi)
        devanagari_range = range(0x0900, 0x097F)
        has_devanagari = any(ord(char) in devanagari_range for char in text)
        
        if has_devanagari:
            return "hi"
        return "en"
    
    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        functions: Optional[List[Dict[str, Any]]] = None,
        function_call: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Create chat completion using GPT-4
        
        Args:
            messages: List of message dicts with "role" and "content"
            functions: List of function definitions for function calling
            function_call: "auto", "none", or specific function name
            temperature: Sampling temperature (0.0 to 2.0)
            max_tokens: Maximum tokens in response
            
        Returns:
            Response dict with message content and function calls if any
        """
        try:
            params = {
                "model": self.chat_model,
                "messages": messages,
                "temperature": temperature,
            }
            
            if functions:
                params["tools"] = [{"type": "function", "function": func} for func in functions]
                if function_call:
                    if function_call == "auto":
                        params["tool_choice"] = "auto"
                    elif function_call == "none":
                        params["tool_choice"] = "none"
                    else:
                        # Specific function name
                        params["tool_choice"] = {"type": "function", "function": {"name": function_call}}
            
            if max_tokens:
                params["max_tokens"] = max_tokens
            
            response = self.client.chat.completions.create(**params)
            
            message = response.choices[0].message
            
            result = {
                "content": message.content or "",  # Handle None content
                "role": message.role,
                "function_calls": []
            }
            
            # Extract function calls if any
            if message.tool_calls:
                for tool_call in message.tool_calls:
                    result["function_calls"].append({
                        "id": tool_call.id,
                        "name": tool_call.function.name,
                        "arguments": tool_call.function.arguments
                    })
            
            return result
            
        except Exception as e:
            raise Exception(f"Error in chat completion: {str(e)}")
    
    def format_response_in_language(self, content: str, target_language: str) -> str:
        """
        Format response to match target language (Hindi or English)
        This is a helper that can be used to ensure responses match input language
        
        Args:
            content: Response content
            target_language: "hi" or "en"
            
        Returns:
            Formatted content in target language
        """
        # For now, return as-is. The GPT-4 model should handle language matching
        # based on system prompts. This can be enhanced if needed.
        return content

