import React from 'react';
import './StatusBadge.css';

const StatusBadge = ({ status }) => {
  const getStatusColor = () => {
    switch (status?.toLowerCase()) {
      case 'assigned':
        return 'status-assigned';
      case 'inprogress':
        return 'status-inprogress';
      case 'completed':
        return 'status-completed';
      default:
        return 'status-default';
    }
  };

  const getStatusIcon = () => {
    switch (status?.toLowerCase()) {
      case 'assigned':
        return '🟡';
      case 'inprogress':
        return '🔵';
      case 'completed':
        return '🟢';
      default:
        return '⚪';
    }
  };

  return (
    <span className={`status-badge ${getStatusColor()}`}>
      {getStatusIcon()} {status}
    </span>
  );
};

export default StatusBadge;
