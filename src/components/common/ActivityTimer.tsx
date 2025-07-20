import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { calculateElapsedTime, formatElapsedTime, formatElapsedTimeShort } from '../../utils/timeUtils';

interface ActivityTimerProps {
  startTime: string;
  variant?: 'full' | 'short' | 'compact';
  showIcon?: boolean;
  className?: string;
  updateInterval?: number; // in milliseconds, default 1000ms
}

const ActivityTimer: React.FC<ActivityTimerProps> = ({
  startTime,
  variant = 'full',
  showIcon = false,
  className = '',
  updateInterval = 1000
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(calculateElapsedTime(startTime));

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(calculateElapsedTime(startTime));
    }, updateInterval);

    return () => clearInterval(interval);
  }, [startTime, updateInterval]);

  const formatTime = () => {
    switch (variant) {
      case 'short':
        return formatElapsedTimeShort(elapsedSeconds);
      case 'compact':
        return formatElapsedTimeShort(elapsedSeconds);
      default:
        return formatElapsedTime(elapsedSeconds);
    }
  };

  const getTimerColor = () => {
    const hours = elapsedSeconds / 3600;
    if (hours > 8) return 'text-red-600'; // Overtime
    if (hours > 4) return 'text-orange-600'; // Long session
    return 'text-green-600'; // Normal
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {showIcon && <Clock className={`w-3 h-3 ${getTimerColor()}`} />}
      <span className={`text-xs font-medium ${getTimerColor()}`}>
        {formatTime()}
      </span>
    </div>
  );
};

export default ActivityTimer; 