# backend/tts.py
from gtts import gTTS
import tempfile
import os

def speak_text(text: str, lang: str = "en"):
    """
    Converts text to speech using gTTS.
    Saves audio to a temporary MP3 file and returns the file path.

    Args:
        text (str): The text to convert to speech.
        lang (str): Language code (default: "en").
    
    Returns:
        str: Path to the generated MP3 file.
    """
    # Create temporary file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
    
    # Generate speech
    tts = gTTS(text=text, lang=lang)
    tts.save(temp_file.name)
    
    return temp_file.name