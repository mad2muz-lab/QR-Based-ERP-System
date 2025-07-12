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