// Speech-to-text utility
export const speechToText = () => {
  return new Promise((resolve, reject) => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      reject(new Error('Speech recognition not supported'));
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      resolve(transcript);
    };

    recognition.onerror = (event) => {
      reject(event.error);
    };

    recognition.onend = () => {
      // If no result after ending, reject
      if (!recognition.finalTranscript) {
        reject(new Error('No speech detected'));
      }
    };

    recognition.start();
  });
};

// Text-to-speech utility
export const textToSpeech = (text, onEnd) => {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Text-to-speech not supported'));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.onend = () => {
      if (onEnd) onEnd();
      resolve();
    };
    
    utterance.onerror = (event) => {
      reject(event.error);
    };
    
    speechSynthesis.speak(utterance);
  });
};