import React, { useEffect } from 'react';

const ExpFloater = ({ text, levelUp = false, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onRemove) onRemove();
    }, 1200);
    
    return () => clearTimeout(timer);
  }, [onRemove]);

  return (
    <div 
      className={`exp-float${levelUp ? ' levelup' : ''}`}
      style={{ 
        opacity: 1,
        transition: 'opacity 0.2s',
        animation: 'fadeOut 1.2s ease-in-out'
      }}
    >
      {text}
    </div>
  );
};

export default ExpFloater;