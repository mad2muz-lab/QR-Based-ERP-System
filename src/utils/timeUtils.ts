export const calculateWorkingHours = (startTime: string, endTime: string): number => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
};

export const isOvertime = (hours: number): boolean => {
  return hours > 8;
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  
  if (hours === 0) {
    return `${mins}m`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}m`;
  }
};

// New timer utility functions
export const calculateElapsedTime = (startTime: string): number => {
  const start = new Date(startTime);
  const now = new Date();
  return (now.getTime() - start.getTime()) / 1000; // Return seconds
};

export const calculateTotalDuration = (startTime: string, endTime: string): number => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return (end.getTime() - start.getTime()) / 1000; // Return seconds
};

export const formatElapsedTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

export const formatElapsedTimeShort = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${Math.floor(seconds)}s`;
  }
};

export const calculateOvertimeHours = (totalHours: number): number => {
  return Math.max(totalHours - 8, 0);
};

export const calculateRegularHours = (totalHours: number): number => {
  return Math.min(totalHours, 8);
};

export const getShiftStatus = (clockInTime: string): {
  hoursWorked: number;
  isOvertime: boolean;
  overtimeHours: number;
  regularHours: number;
} => {
  const start = new Date(clockInTime);
  const now = new Date();
  const hoursWorked = (now.getTime() - start.getTime()) / (1000 * 60 * 60);
  
  return {
    hoursWorked,
    isOvertime: isOvertime(hoursWorked),
    overtimeHours: calculateOvertimeHours(hoursWorked),
    regularHours: calculateRegularHours(hoursWorked)
  };
};

export const formatTimeRange = (startTime: string, endTime?: string): string => {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  
  const startStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endStr = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return `${startStr} - ${endStr}`;
};

/**
 * Format duration in hours to a readable string
 * @param hours - Duration in hours (decimal)
 * @returns Formatted string (e.g., "1.30h", "25.5h", "2.5d")
 */
export function formatEquipmentDuration(hours: number): string {
  if (hours < 24) {
    // Format as hours with minutes (e.g., 1.30h = 1 hour 30 minutes)
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    if (minutes === 0) {
      return `${wholeHours}h`;
    } else {
      return `${wholeHours}.${minutes.toString().padStart(2, '0')}h`;
    }
  } else {
    // Format as days for durations over 24 hours
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    if (remainingHours === 0) {
      return `${days}d`;
    } else {
      return `${days}.${Math.round(remainingHours)}d`;
    }
  }
}

/**
 * Calculate duration between two timestamps in hours
 * @param startTime - Start timestamp
 * @param endTime - End timestamp
 * @returns Duration in hours (decimal)
 */
export function calculateDurationHours(startTime: Date | string, endTime: Date | string): number {
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 0;
  }
  
  const durationMs = end.getTime() - start.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);
  return Math.round(durationHours * 100) / 100; // round to 2 decimals
}

/**
 * Get a human-readable description of the duration
 * @param hours - Duration in hours
 * @returns Human-readable string (e.g., "1 hour 30 minutes", "2 days 5 hours")
 */
export function getDurationDescription(hours: number): string {
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else if (hours < 24) {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    if (minutes === 0) {
      return `${wholeHours} hour${wholeHours !== 1 ? 's' : ''}`;
    } else {
      return `${wholeHours} hour${wholeHours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  } else {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    if (remainingHours === 0) {
      return `${days} day${days !== 1 ? 's' : ''}`;
    } else {
      return `${days} day${days !== 1 ? 's' : ''} ${Math.round(remainingHours)} hour${Math.round(remainingHours) !== 1 ? 's' : ''}`;
    }
  }
}