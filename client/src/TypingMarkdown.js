import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

const TypingMarkdown = ({ 
  content, 
  typingSpeed = 50,
  onTypingComplete,
  isSpeaking,
  onSpeak,
  onPauseSpeech
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTypingPaused, setIsTypingPaused] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const containerRef = useRef(null);
  const timeoutRef = useRef(null);

  // Typing effect
  useEffect(() => {
    if (currentIndex < content.length && !isTypingPaused) {
      timeoutRef.current = setTimeout(() => {
        setDisplayedContent(prev => prev + content[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, typingSpeed);

      return () => clearTimeout(timeoutRef.current);
    }
  }, [currentIndex, content, typingSpeed, isTypingPaused]);

  // Handle typing completion
  useEffect(() => {
    if (currentIndex >= content.length && !hasCompleted) {
      setHasCompleted(true);
      onTypingComplete?.();
    }
  }, [currentIndex, content.length, onTypingComplete, hasCompleted]);

  // Auto-scroll
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [displayedContent]);

  const toggleTyping = () => {
    setIsTypingPaused(prev => !prev);
  };

  const handleSpeakToggle = () => {
    if (isSpeaking) {
      onPauseSpeech?.();
    } else {
      const textToSpeak = content; // Always speak full content when typing is complete
      if (textToSpeak.trim().length > 0) {
        onSpeak?.(textToSpeak);
      }
    }
  };

  return (
    <div className="markdown-container">
      <div className="markdown-content" ref={containerRef}>
        <ReactMarkdown>{displayedContent}</ReactMarkdown>
        {currentIndex < content.length && !isTypingPaused && (
          <span className="typing-cursor">|</span>
        )}
      </div>
      
      <div className="typing-controls">
        <button 
          onClick={toggleTyping}
          disabled={currentIndex >= content.length}
          className={`control-button ${isTypingPaused ? 'resume' : 'pause'}`}
        >
          {isTypingPaused ? '▶ Resume Typing' : '⏸ Pause Typing'}
        </button>
        
        <button
          onClick={handleSpeakToggle}
          disabled={content.length === 0} // Use full content length for check
          className={`control-button ${isSpeaking ? 'pause' : 'speak'}`}
        >
          {isSpeaking ? '⏸ Pause Speech' : '🔊 Speak Prediction'}
        </button>
      </div>
    </div>
  );
};

export default TypingMarkdown;