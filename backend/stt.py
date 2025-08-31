#import libraries
import whisper
import tempfile
import sounddevice as sd
import wavio

# Load Whisper model (can use smaller model for faster processing)
model = whisper.load_model("base")

def listen_from_mic(duration=5, fs=16000) -> str:
    """
    Records audio from microphone for a given duration (seconds)
    and returns the transcribed text using Whisper.
    """
    print(f"Recording for {duration} seconds... Speak now.")
    
    # Record audio
    recording = sd.rec(int(duration * fs), samplerate=fs, channels=1)
    sd.wait()  # Wait until recording is finished

    # Save to a temporary WAV file
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmpfile:
        wavio.write(tmpfile.name, recording, fs, sampwidth=2)
        audio_file_path = tmpfile.name

    # Transcribe using Whisper
    result = model.transcribe(audio_file_path)
    text = result["text"].strip()
    print("Transcribed Text:", text)
    return text