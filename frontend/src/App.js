import React, { useState, useRef, useEffect } from 'react';
import Mascot from "./components/Mascot";
import LipSyncHandler from "./components/LipSyncHandler";
import Controls from './components/Controls';
import StatusIndicator from './components/StatusIndicator';
import { speechToText } from './utils/speechUtils';
import { queryRAG, chatRAG } from './utils/apiUtils';
import './App.css';

function App() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [status, setStatus] = useState('idle');
  const [emotion, setEmotion] = useState('neutral');
  const [currentMessage, setCurrentMessage] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const conversationEndRef = useRef(null);

  // Debug: Check TTS support on component mount
  useEffect(() => {
    console.log('Checking TTS support...');
    if ('speechSynthesis' in window) {
      console.log('Speech Synthesis API is supported');
      console.log('Voices:', speechSynthesis.getVoices());
      
      // Load voices if not available yet
      if (speechSynthesis.getVoices().length === 0) {
        speechSynthesis.addEventListener('voiceschanged', () => {
          console.log('Voices loaded:', speechSynthesis.getVoices());
        });
      }
    } else {
      console.error('Speech Synthesis API is NOT supported');
    }
  }, []);

  const scrollToBottom = () => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { 
    scrollToBottom(); 
  }, [conversation]);

  const handleStartSpeaking = () => {
    console.log('App: Speech started');
    setIsSpeaking(true);
    setStatus('speaking');
  };
  
  const handleEndSpeaking = () => {
    console.log('App: Speech ended');
    setIsSpeaking(false);
    setStatus('idle');
    setCurrentMessage('');
  };

  const handleListen = async () => {
    if (isSpeaking) {
      console.log('Cannot listen while speaking');
      return;
    }

    console.log('Starting listening...');
    setIsListening(true);
    setStatus('listening');
    setEmotion('listening');

    try {
      const transcript = await speechToText();
      console.log('Transcript received:', transcript);
      
      if (transcript) {
        setConversation(prev => [...prev, { type: 'user', text: transcript }]);
        setStatus('processing');
        setEmotion('thinking');

        let response;
        if (conversation.length > 0 || sessionId) {
          console.log('Making chat API call...');
          response = await chatRAG(transcript, sessionId);
          if (response.session_id) setSessionId(response.session_id);
        } else {
          console.log('Making query API call...');
          response = await queryRAG(transcript);
        }

        console.log('API response:', response);
        
        if (response) {
          setEmotion(response.emotion || 'neutral');
          setCurrentMessage(response.text);
          
          setConversation(prev => [...prev, { 
            type: 'ai', 
            text: response.text, 
            emotion: response.emotion 
          }]);
        }
      }
    } catch (error) {
      console.error('Error in handleListen:', error);
      setStatus('error');
      setEmotion('sad');
      setCurrentMessage("I'm sorry, I encountered an error. Please try again.");
    } finally {
      setIsListening(false);
      if (status !== 'speaking') {
        setStatus('idle');
        setEmotion('neutral');
      }
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>AI Tutor Mascot</h1>
        <StatusIndicator status={status} />
        <button 
          onClick={() => {
            // Test TTS directly
            const testUtterance = new SpeechSynthesisUtterance('Test message');
            window.speechSynthesis.speak(testUtterance);
          }}
          style={{marginLeft: '10px', padding: '5px'}}
        >
          Test TTS
        </button>
      </header>

      <div className="main-container">
        <div className="conversation-panel">
          {conversation.map((msg, index) => (
            <div key={index} className={`message ${msg.type}`}>
              <p>{msg.text}</p>
              {msg.emotion && <span className="emotion-badge">{msg.emotion}</span>}
            </div>
          ))}
          <div ref={conversationEndRef} />
        </div>

        <div className="mascot-container">
          <Mascot 
            isListening={isListening} 
            isSpeaking={isSpeaking}
            emotion={emotion}
            message={isSpeaking ? currentMessage : ''}
          />
          
          <LipSyncHandler 
            text={currentMessage}
            onStartSpeaking={handleStartSpeaking}
            onEndSpeaking={handleEndSpeaking}
          />
        </div>
      </div>

      <Controls 
        isListening={isListening}
        isSpeaking={isSpeaking}
        onListen={handleListen}
        status={status}
      />
    </div>
  );
}

export default App;