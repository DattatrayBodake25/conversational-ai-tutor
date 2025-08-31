import React from 'react';
import './StatusIndicator.css';

const StatusIndicator = ({ status }) => {
  const getStatusColor = () => {
    switch(status) {
      case 'listening': return '#4caf50';
      case 'processing': return '#ff9800';
      case 'speaking': return '#2196f3';
      case 'error': return '#f44336';
      default: return '#9e9e9e';
    }
  };
  
  const getStatusText = () => {
    switch(status) {
      case 'listening': return 'Listening';
      case 'processing': return 'Processing';
      case 'speaking': return 'Speaking';
      case 'error': return 'Error';
      default: return 'Ready';
    }
  };
  
  return (
    <div className="status-indicator">
      <div 
        className="status-light"
        style={{ backgroundColor: getStatusColor() }}
      ></div>
      <span>{getStatusText()}</span>
    </div>
  );
};

export default StatusIndicator;