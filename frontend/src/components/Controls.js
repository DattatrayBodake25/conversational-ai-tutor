import React from 'react';
import './Controls.css';

const Controls = ({ isListening, isSpeaking, onListen, status }) => {
  return (
    <div className="controls">
      <button 
        className={`mic-button ${isListening ? 'listening' : ''} ${isSpeaking ? 'disabled' : ''}`}
        onClick={onListen}
        disabled={isSpeaking}
      >
        <div className="mic-icon">
          <div className="mic-body"></div>
          <div className="mic-stand"></div>
          {isListening && <div className="pulse-ring"></div>}
        </div>
        <span>
          {isListening ? 'Listening...' : 
           isSpeaking ? 'AI is speaking...' : 'Click to speak'}
        </span>
      </button>
      
      <div className="status-text">
        Status: {status}
      </div>
    </div>
  );
};

export default Controls;