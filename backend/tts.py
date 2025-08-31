#import library
import pyttsx3

# Initialize TTS engine once
engine = pyttsx3.init()

# Optional: Configure voice properties
engine.setProperty('rate', 150) 
engine.setProperty('volume', 1.0)

def speak_text(text: str, wait: bool = True):
    """
    Converts text to speech.
    
    Args:
        text (str): The text to speak.
        wait (bool): Whether to wait until speech is finished (default: True).
    """
    engine.say(text)
    if wait:
        engine.runAndWait()
    else:
        engine.startLoop(False)
