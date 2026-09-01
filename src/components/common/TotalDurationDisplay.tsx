import React from 'react';
import { Clock } from 'lucide-react';
import { calculateTotalDuration, formatElapsedTimeShort } from '../../utils/timeUtils';

interface TotalDurationDisplayProps {
  startTime: string;
  endTime: string;
  showIcon?: boolean;
  className?: string;
}

const TotalDurationDisplay: React.FC<TotalDurationDisplayProps> = ({
  startTime,
  endTime,
  showIcon = false,
  className = ''
}) => {
  const totalSeconds = calculateTotalDuration(startTime, endTime);
  const formattedDuration = formatElapsedTimeShort(totalSeconds);

  const getDurationColor = () => {
    const hours = totalSeconds / 3600;
    if (hours > 8) return 'text-red-600'; // Overtime
    if (hours > 4) return 'text-orange-600'; // Long session
    return 'text-blue-600'; // Normal completed session
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {showIcon && <Clock className={`w-3 h-3 ${getDurationColor()}`} />}
      <span className={`text-xs font-medium ${getDurationColor()}`}>
        Total: {formattedDuration}
      </span>
    </div>
  );
};

export default TotalDurationDisplay; 