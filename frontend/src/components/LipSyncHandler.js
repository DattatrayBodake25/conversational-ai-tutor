import { useEffect, useRef } from 'react';
import tts from '../utils/tts';

const LipSyncHandler = ({ text, onStartSpeaking, onEndSpeaking }) => {
  const isSpeakingRef = useRef(false);

  useEffect(() => {
    if (text && text.trim() !== '' && !isSpeakingRef.current) {
      isSpeakingRef.current = true;
      
      tts.speak(
        text,
        () => {
          console.log('Speech started callback');
          onStartSpeaking && onStartSpeaking();
        },
        () => {
          console.log('Speech ended callback');
          isSpeakingRef.current = false;
          onEndSpeaking && onEndSpeaking();
        },
        (error) => {
          console.error('Speech error:', error);
          isSpeakingRef.current = false;
          onEndSpeaking && onEndSpeaking();
        }
      );
    }

    return () => {
      // Cleanup if component unmounts during speech
      if (isSpeakingRef.current) {
        tts.stop();
        isSpeakingRef.current = false;
      }
    };
  }, [text, onStartSpeaking, onEndSpeaking]);

  return null;
};

export default LipSyncHandler;