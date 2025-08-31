class TextToSpeech {
  constructor() {
    this.utterance = null;
    this.isAvailable = false;
    this.voices = [];
    
    this.init();
  }

  init() {
    if (!('speechSynthesis' in window)) {
      console.error('Speech Synthesis API is not supported in this browser');
      this.isAvailable = false;
      return;
    }

    this.isAvailable = true;
    
    // Load voices
    this.voices = speechSynthesis.getVoices();
    if (this.voices.length === 0) {
      speechSynthesis.addEventListener('voiceschanged', () => {
        this.voices = speechSynthesis.getVoices();
        console.log('Voices loaded:', this.voices);
      });
    }

    console.log('TTS initialized. Available voices:', this.voices);
  }

  speak(text, onStart, onEnd, onError) {
    if (!this.isAvailable) {
      console.error('TTS not available');
      onError && onError('TTS not available');
      return;
    }

    if (!text || typeof text !== 'string') {
      console.error('Invalid text for TTS');
      onError && onError('Invalid text');
      return;
    }

    // Cancel any ongoing speech
    this.stop();

    // Create new utterance
    this.utterance = new SpeechSynthesisUtterance(text);
    
    // Configure utterance for softer, bot-like sound
    this.utterance.volume = 1;
    this.utterance.rate = 1.0;    // Slightly faster for bot-like sound
    this.utterance.pitch = 1.2;   // Higher pitch for less mature sound
    
    // Select a voice - prefer female or higher-pitched voices for softer sound
    if (this.voices.length > 0) {
      // First, try to find Google UK Female or similar soft voices
      let preferredVoice = this.voices.find(voice => 
        voice.name.includes('Google UK Female') || 
        voice.name.includes('Samantha') ||
        voice.name.includes('Karen') ||
        voice.name.includes('Tessa') ||
        voice.name.includes('Fiona') ||
        voice.name.includes('Moira') ||
        voice.name.includes('Veena') ||
        voice.name.includes('Female') ||
        voice.name.includes('Woman')
      );

      // If no specific female voice found, look for any higher-pitched voice
      if (!preferredVoice) {
        preferredVoice = this.voices.find(voice => 
          voice.lang.includes('en') && 
          !voice.name.includes('Male') &&
          !voice.name.includes('Man')
        );
      }

      // Fallback to any English voice
      if (!preferredVoice) {
        preferredVoice = this.voices.find(voice => voice.lang.includes('en')) || this.voices[0];
      }
      
      this.utterance.voice = preferredVoice;
      console.log('Using voice:', preferredVoice.name, 'Lang:', preferredVoice.lang);
    }

    // Set up event handlers
    this.utterance.onstart = () => {
      console.log('TTS started speaking');
      onStart && onStart();
    };

    this.utterance.onend = () => {
      console.log('TTS finished speaking');
      onEnd && onEnd();
      this.utterance = null;
    };

    this.utterance.onerror = (event) => {
      console.error('TTS error:', event.error);
      onError && onError(event.error);
      this.utterance = null;
    };

    // Start speaking
    console.log('Speaking text:', text);
    speechSynthesis.speak(this.utterance);
  }

  // Method to list all available voices for debugging
  listVoices() {
    console.log('Available voices:');
    this.voices.forEach((voice, index) => {
      console.log(`${index + 1}. ${voice.name} (${voice.lang}) - ${voice.localService ? 'Local' : 'Remote'}`);
    });
    return this.voices;
  }

  // Method to manually set a specific voice
  setVoice(voiceName) {
    const voice = this.voices.find(v => v.name.includes(voiceName));
    if (voice) {
      console.log('Setting voice to:', voice.name);
      return voice;
    }
    console.log('Voice not found:', voiceName);
    return null;
  }

  stop() {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      console.log('TTS stopped');
    }
    this.utterance = null;
  }

  isSpeaking() {
    return speechSynthesis.speaking;
  }
}

// Create a singleton instance
const tts = new TextToSpeech();
export default tts;