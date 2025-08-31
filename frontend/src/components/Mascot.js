import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'react-lottie';
import './Mascot.css';

// Lottie animations (you'll need to add these files)
import speakingAnimation from './animations/speaking.json';
import thinkingAnimation from './animations/thinking.json';
import happyAnimation from './animations/happy.json';
import explainingAnimation from './animations/explaining.json';

const Mascot = ({ isListening, isSpeaking, emotion, message }) => {
  const [currentEmotion, setCurrentEmotion] = useState(emotion || 'neutral');
  const soundWaveRef = useRef(null);
  const emotionTimeoutRef = useRef(null);

  // Emotion mapping to Lottie animations
  const emotionAnimations = {
    happy: happyAnimation,
    thinking: thinkingAnimation,
    explaining: explainingAnimation,
    neutral: speakingAnimation,
    speaking: speakingAnimation
  };

  // Update emotion with smooth transition
  useEffect(() => {
    if (emotionTimeoutRef.current) {
      clearTimeout(emotionTimeoutRef.current);
    }
    
    setCurrentEmotion(emotion);
    
    // Reset to neutral after 5 seconds for certain emotions
    if (emotion !== 'neutral' && emotion !== 'speaking') {
      emotionTimeoutRef.current = setTimeout(() => {
        setCurrentEmotion('neutral');
      }, 5000);
    }
    
    return () => {
      if (emotionTimeoutRef.current) {
        clearTimeout(emotionTimeoutRef.current);
      }
    };
  }, [emotion]);

  // Sound wave animation effect
  useEffect(() => {
    const waves = soundWaveRef.current?.querySelectorAll('.wave');
    if (!waves) return;
    
    if (isSpeaking) {
      waves.forEach((wave, index) => {
        wave.style.animation = `soundWave 1.5s infinite ${index * 0.2}s`;
      });
    } else {
      waves.forEach(wave => {
        wave.style.animation = 'none';
      });
    }
  }, [isSpeaking]);

  const lottieOptions = (animationData) => ({
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice'
    }
  });

  return (
    <motion.div 
      className="mascot-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mascot-card">
        {/* Sound waves animation when speaking */}
        <div 
          ref={soundWaveRef}
          className="sound-waves"
          style={{ opacity: isSpeaking ? 1 : 0 }}
        >
          {[...Array(5)].map((_, i) => (
            <div key={i} className="wave"></div>
          ))}
        </div>

        {/* Mascot animation */}
        <div className="mascot-animation">
          <Lottie 
            options={lottieOptions(emotionAnimations[currentEmotion])}
            height={280}
            width={280}
            isStopped={false}
            isPaused={false}
          />
        </div>

        {/* Emotion label with animation */}
        <AnimatePresence>
          {currentEmotion !== 'neutral' && currentEmotion !== 'speaking' && (
            <motion.div
              className="emotion-badge"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            >
              {currentEmotion}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Listening indicator */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              className="listening-indicator"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="pulsating-mic"></div>
              <span>Listening...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message bubble */}
        <AnimatePresence>
          {message && (
            <motion.div
              className="message-bubble"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <p>{message}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Mascot;