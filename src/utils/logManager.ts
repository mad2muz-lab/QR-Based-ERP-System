// Log Manager - Handles creation of entity-specific logs
// Replaces the single time_logs table with separate log tables for each entity type

import { OfflineSyncManager } from './offlineSync';
import { OfflineDataManager } from './offlineDataManager';
import { Employee, Equipment, Material, EmployeeLog, EquipmentLog, MaterialLog } from '../types';

export interface LogEntry {
  entityId: string;
  action: string;
  site: string;
  notes?: string;
  location?: [number, number];
  quantity?: number;
}

export class LogManager {
  private static instance: LogManager;
  private syncManager: OfflineSyncManager;

  private constructor() {
    this.syncManager = OfflineSyncManager.getInstance();
  }

  static getInstance(): LogManager {
    if (!LogManager.instance) {
      LogManager.instance = new LogManager();
    }
    return LogManager.instance;
  }

  // Create employee log entry
  async createEmployeeLog(
    employee: Employee,
    action: 'clock-in' | 'clock-out',
    site: string,
    notes?: string,
    location?: [number, number]
  ): Promise<string> {
    const now = new Date();
    const employeeLog: EmployeeLog = {
      id: `emp-log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      employeeId: employee.id,
      employeeName: employee.name,
      department: employee.department,
      site,
      action,
      date: now.toISOString().split('T')[0], // YYYY-MM-DD format
      time: now.toTimeString().split(' ')[0], // HH:MM:SS format
      timestamp: now.toISOString(),
      notes,
      location
    };

    // Use OfflineDataManager to handle local storage and sync queuing
    const operationId = await OfflineDataManager.createEmployeeLog(employeeLog);
    
    console.log(`Employee log created: ${employee.name} - ${action} at ${site}`);
    return operationId;
  }

  // Create equipment log entry
  async createEquipmentLog(
    equipment: Equipment,
    action: 'start-use' | 'stop-use',
    site: string,
    status: string,
    notes?: string,
    location?: [number, number]
  ): Promise<string> {
    const now = new Date();
    const equipmentLog: EquipmentLog = {
      id: `eq-log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      equipmentType: equipment.type,
      action,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      timestamp: now.toISOString(),
      site,
      status,
      notes,
      location
    };

    const operationId = await OfflineDataManager.createEquipmentLog(equipmentLog);
    
    console.log(`Equipment log created: ${equipment.name} - ${action} at ${site}`);
    return operationId;
  }

  // Create material log entry
  async createMaterialLog(
    material: Material,
    action: 'material-in' | 'material-out',
    quantity: number,
    site: string,
    status: string,
    notes?: string,
    location?: [number, number]
  ): Promise<string> {
    const now = new Date();
    const materialLog: MaterialLog = {
      id: `mat-log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      materialId: material.id,
      materialName: material.name,
      materialType: material.type,
      action,
      quantity,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      timestamp: now.toISOString(),
      site,
      status,
      notes,
      location
    };

    const operationId = await OfflineDataManager.createMaterialLog(materialLog);
    
    console.log(`Material log created: ${material.name} - ${action} (${quantity}) at ${site}`);
    return operationId;
  }

  // Legacy method for backward compatibility - routes to appropriate log table
  async createTimeLog(
    entityId: string,
    entityType: 'employee' | 'equipment' | 'material',
    action: string,
    site: string,
    notes?: string,
    location?: [number, number],
    quantity?: number
  ): Promise<string> {
    console.warn('createTimeLog is deprecated. Use specific log methods instead.');
    
    // This method would need to fetch the entity data first to create proper logs
    // For now, we'll create a basic log entry
    const now = new Date();
    const baseLogData = {
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      timestamp: now.toISOString(),
      site,
      notes,
      location
    };

    let operationId: string;
    
    switch (entityType) {
      case 'employee':
          if (action === 'clock-in' || action === 'clock-out') {
            operationId = await OfflineDataManager.createEmployeeLog({
              id: `emp-log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              ...baseLogData,
              employeeId: entityId,
              employeeName: 'Unknown', // Would need to fetch from storage
              department: 'Unknown',
              action: action as 'clock-in' | 'clock-out'
            });
          } else {
            throw new Error(`Invalid action for employee: ${action}`);
          }
          break;

        case 'equipment':
          if (action === 'start-use' || action === 'stop-use') {
            operationId = await OfflineDataManager.createEquipmentLog({
              id: `eq-log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              ...baseLogData,
              equipmentId: entityId,
              equipmentName: 'Unknown',
              equipmentType: 'Unknown',
              action: action as 'start-use' | 'stop-use',
              status: 'Unknown'
            });
          } else {
            throw new Error(`Invalid action for equipment: ${action}`);
          }
          break;

        case 'material':
          if (action === 'material-in' || action === 'material-out') {
            operationId = await OfflineDataManager.createMaterialLog({
              id: `mat-log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              ...baseLogData,
              materialId: entityId,
              materialName: 'Unknown',
              materialType: 'Unknown',
              action: action as 'material-in' | 'material-out',
              quantity: quantity || 0,
              status: 'Unknown'
            });
          } else {
            throw new Error(`Invalid action for material: ${action}`);
          }
          break;
        
      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }

    return operationId;
  }
}

// Export singleton instance
export const logManager = LogManager.getInstance();