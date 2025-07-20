import { calculateElapsedTime, calculateTotalDuration } from './timeUtils';

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  entityType: string;
  entityId: string;
  site?: string;
  quantity?: number;
  employeeName?: string;
  equipmentName?: string;
  materialName?: string;
}

export interface ActiveActivity {
  log: ActivityLog;
  elapsedSeconds: number;
  isActive: boolean;
}

export interface CompletedActivity {
  startLog: ActivityLog;
  endLog: ActivityLog;
  totalSeconds: number;
}

/**
 * Check if an activity is currently active and should show a timer
 */
export const isActiveActivity = (action: string): boolean => {
  const activeActions = [
    'clock-in',      // Employee clocked in
    'start-use',     // Equipment started being used
    'maintenance-start' // Equipment maintenance started
  ];
  
  return activeActions.includes(action);
};

/**
 * Check if an activity is a completion activity that should show total duration
 */
export const isCompletionActivity = (action: string): boolean => {
  const completionActions = [
    'clock-out',     // Employee clocked out
    'stop-use',      // Equipment stopped being used
    'maintenance-complete' // Equipment maintenance completed
  ];
  
  return completionActions.includes(action);
};

/**
 * Get the corresponding start action for a completion action
 */
export const getStartActionForCompletion = (completionAction: string): string => {
  const actionMap = {
    'clock-out': 'clock-in',
    'stop-use': 'start-use',
    'maintenance-complete': 'maintenance-start'
  };
  
  return actionMap[completionAction as keyof typeof actionMap] || '';
};

/**
 * Find the start activity for a completion activity
 */
export const findStartActivityForCompletion = (
  logs: ActivityLog[], 
  completionLog: ActivityLog
): ActivityLog | null => {
  const startAction = getStartActionForCompletion(completionLog.action);
  
  if (!startAction) return null;
  
  // Find the most recent start activity for this entity before the completion
  const entityLogs = logs.filter(log => 
    log.entityType === completionLog.entityType && 
    log.entityId === completionLog.entityId &&
    log.action === startAction &&
    new Date(log.timestamp) < new Date(completionLog.timestamp)
  );
  
  if (entityLogs.length === 0) return null;
  
  // Return the most recent start activity
  return entityLogs.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )[0];
};

/**
 * Get all currently active activities from logs
 */
export const getActiveActivities = (logs: ActivityLog[]): ActiveActivity[] => {
  const activeActivities: ActiveActivity[] = [];
  
  // Group logs by entity to find the most recent activity for each
  const entityGroups = new Map<string, ActivityLog[]>();
  
  logs.forEach(log => {
    const key = `${log.entityType}-${log.entityId}`;
    if (!entityGroups.has(key)) {
      entityGroups.set(key, []);
    }
    entityGroups.get(key)!.push(log);
  });
  
  // For each entity, check if their most recent activity is active
  entityGroups.forEach((entityLogs, key) => {
    // Sort by timestamp descending to get most recent first
    const sortedLogs = entityLogs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    const mostRecentLog = sortedLogs[0];
    
    if (isActiveActivity(mostRecentLog.action)) {
      // Check if there's a corresponding "end" action AFTER this start action
      const endActions = {
        'clock-in': 'clock-out',
        'start-use': 'stop-use',
        'maintenance-start': 'maintenance-complete'
      };
      
      const expectedEndAction = endActions[mostRecentLog.action as keyof typeof endActions];
      
      // Look for any end action that happened AFTER this start action
      const hasEndAction = sortedLogs.some(log => 
        log.action === expectedEndAction && 
        new Date(log.timestamp) > new Date(mostRecentLog.timestamp)
      );
      
      // Only show as active if there's NO end action after this start action
      if (!hasEndAction) {
        activeActivities.push({
          log: mostRecentLog,
          elapsedSeconds: calculateElapsedTime(mostRecentLog.timestamp),
          isActive: true
        });
      }
    }
  });
  
  return activeActivities;
};

/**
 * Get completed activities with their total duration
 */
export const getCompletedActivities = (logs: ActivityLog[]): CompletedActivity[] => {
  const completedActivities: CompletedActivity[] = [];
  
  logs.forEach(log => {
    if (isCompletionActivity(log.action)) {
      const startLog = findStartActivityForCompletion(logs, log);
      
      if (startLog) {
        completedActivities.push({
          startLog,
          endLog: log,
          totalSeconds: calculateTotalDuration(startLog.timestamp, log.timestamp)
        });
      }
    }
  });
  
  return completedActivities;
};

/**
 * Get active activities for a specific entity
 */
export const getActiveActivitiesForEntity = (
  logs: ActivityLog[], 
  entityType: string, 
  entityId: string
): ActiveActivity | null => {
  const entityLogs = logs.filter(log => 
    log.entityType === entityType && log.entityId === entityId
  );
  
  if (entityLogs.length === 0) return null;
  
  // Sort by timestamp descending
  const sortedLogs = entityLogs.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  const mostRecentLog = sortedLogs[0];
  
  if (isActiveActivity(mostRecentLog.action)) {
    const endActions = {
      'clock-in': 'clock-out',
      'start-use': 'stop-use',
      'maintenance-start': 'maintenance-complete'
    };
    
    const expectedEndAction = endActions[mostRecentLog.action as keyof typeof endActions];
    
    // Look for any end action that happened AFTER this start action
    const hasEndAction = sortedLogs.some(log => 
      log.action === expectedEndAction && 
      new Date(log.timestamp) > new Date(mostRecentLog.timestamp)
    );
    
    // Only show as active if there's NO end action after this start action
    if (!hasEndAction) {
      return {
        log: mostRecentLog,
        elapsedSeconds: calculateElapsedTime(mostRecentLog.timestamp),
        isActive: true
      };
    }
  }
  
  return null;
};

/**
 * Get completed activity for a specific entity
 */
export const getCompletedActivityForEntity = (
  logs: ActivityLog[], 
  entityType: string, 
  entityId: string
): CompletedActivity | null => {
  const entityLogs = logs.filter(log => 
    log.entityType === entityType && log.entityId === entityId
  );
  
  if (entityLogs.length === 0) return null;
  
  // Sort by timestamp descending
  const sortedLogs = entityLogs.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  const mostRecentLog = sortedLogs[0];
  
  if (isCompletionActivity(mostRecentLog.action)) {
    const startLog = findStartActivityForCompletion(logs, mostRecentLog);
    
    if (startLog) {
      return {
        startLog,
        endLog: mostRecentLog,
        totalSeconds: calculateTotalDuration(startLog.timestamp, mostRecentLog.timestamp)
      };
    }
  }
  
  return null;
}; 