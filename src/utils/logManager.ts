// Log Manager - Handles creation of entity-specific logs
// Replaces the single time_logs table with separate log tables for each entity type

import { OfflineSyncManager } from './offlineSync';
import { OfflineDataManager } from './offlineDataManager';
import { Employee, Equipment, Material, EmployeeLog, EquipmentLog, MaterialLog } from '../types';
import { AuthManager } from './authUtils';

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
      location,
      oldId: employee.oldId // Include old ID for audit trail
    };

    // Use OfflineDataManager to handle local storage and sync queuing
    const operationId = await OfflineDataManager.createEmployeeLog(employeeLog);
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('employeeLogCreated', {
      detail: { employeeLog, action }
    }));
    
    console.log(`Employee log created: ${employee.name} - ${action} at ${site}`);
    return operationId;
  }

  // Create equipment log entry
  async createEquipmentLog(
    equipment: Equipment,
    action: 'start-use' | 'stop-use' | 'standby-start' | 'standby-end' | 'maintenance-start' | 'maintenance-end',
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
      location,
      oldId: equipment.oldId // Include old ID for audit trail
    };

    const operationId = await OfflineDataManager.createEquipmentLog(equipmentLog);
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('equipmentLogCreated', {
      detail: { equipmentLog, action }
    }));
    
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
    // Ensure quantity is a number
    const numericQuantity = Number(quantity);
    if (isNaN(numericQuantity) || numericQuantity <= 0) {
      throw new Error('Invalid quantity: must be a positive number');
    }
    const now = new Date();

    // --- Robust stock validation for material-out ---
    if (action === 'material-out') {
      let latestMaterial: Material | undefined;
      if (AuthManager.useSupabase()) {
        // Supabase mode
        try {
          const { SupabaseDataService } = await import('./supabaseDataService');
          const supabaseMaterials = await SupabaseDataService.getMaterials();
          latestMaterial = supabaseMaterials.find(m => m.id === material.id);
        } catch (e) {
          throw new Error('Failed to fetch latest material data from server.');
        }
      } else {
        // Local mode
        const { DataStorage } = await import('./dataStorage');
        const localMaterials = DataStorage.loadMaterials();
        latestMaterial = localMaterials.find(m => m.id === material.id);
      }
      const availableQty = latestMaterial ? latestMaterial.quantity : 0;
      if (numericQuantity > availableQty) {
        throw new Error(`Cannot remove ${numericQuantity} ${material.unit}. Only ${availableQty} ${material.unit} available in stock.`);
      }
    }
    // --- End robust validation ---

    const materialLog: MaterialLog = {
        id: `mat-log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        materialId: material.id,
        materialName: material.name,
        materialType: material.type,
        action,
        quantity: numericQuantity,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      timestamp: now.toISOString(),
      site,
      status,
      notes,
      location,
      oldId: material.oldId // Include old ID for audit trail
    };

    // Create the material log first
    const operationId = await OfflineDataManager.createMaterialLog(materialLog);
    
    // Update material quantity in both local storage and queue for Supabase sync
    try {
      // Load current materials from storage
      const { DataStorage } = await import('./dataStorage');
      let materials = DataStorage.loadMaterials();
      let materialIndex = materials.findIndex(m => m.id === material.id);
      let updatedMaterial;
      if (materialIndex !== -1) {
        // Update material quantity based on action
        const currentMaterial = materials[materialIndex];
        let newQuantity = parseInt(String(currentMaterial.quantity || 0), 10);
        if (action === 'material-in') {
          newQuantity += numericQuantity;
        } else {
          newQuantity = Math.max(0, newQuantity - numericQuantity);
        }
        let newStatus: 'available' | 'low-stock' | 'out-of-stock' = 'available';
        if (newQuantity === 0) {
          newStatus = 'out-of-stock';
        } else if (newQuantity < 50) {
          newStatus = 'low-stock';
        }
        updatedMaterial = {
          ...currentMaterial,
          quantity: newQuantity,
          status: newStatus,
          lastUpdated: now.toISOString()
        };
        await OfflineDataManager.updateMaterial(updatedMaterial);
        console.log(`Material quantity updated: ${material.name} - ${action} (${numericQuantity}) - New quantity: ${newQuantity}`);
      } else {
        // Not found locally, fetch from Supabase to get current quantity
        try {
          const { supabase } = await import('./supabaseClient');
          if (!supabase || !supabase.auth) {
            // Fallback if supabase is not configured
            updatedMaterial = {
              id: material.id,
              name: material.name,
              type: material.type,
              unit: material.unit,
              site: material.site,
              quantity: action === 'material-in' ? numericQuantity : 0,
              status: (action === 'material-in' ? (numericQuantity < 50 ? 'low-stock' : 'available') : 'out-of-stock') as 'available' | 'low-stock' | 'out-of-stock',
              lastUpdated: now.toISOString(),
              qrCode: material.qrCode || material.id,
              createdAt: material.createdAt || now.toISOString()
            };
            await OfflineDataManager.updateMaterial(updatedMaterial);
            console.warn(`Supabase not configured. Queued minimal update for material: ${material.id}`);
          } else {
            const { data: supabaseMaterial, error } = await supabase
              .from('materials')
              .select('*')
              .eq('id', material.id)
              .single();
            let baseQuantity = 0;
            if (supabaseMaterial && !error) {
              baseQuantity = parseInt(String(supabaseMaterial.quantity || 0), 10);
            } else {
              console.warn(`Material not found in Supabase for update: ${material.id}. Will use minimal update.`);
            }
            let newQuantity = baseQuantity;
            if (action === 'material-in') {
              newQuantity += numericQuantity;
            } else {
              newQuantity = Math.max(0, newQuantity - numericQuantity);
            }
            let newStatus: 'available' | 'low-stock' | 'out-of-stock' = 'available';
            if (newQuantity === 0) {
              newStatus = 'out-of-stock';
            } else if (newQuantity < 50) {
              newStatus = 'low-stock';
            }
            updatedMaterial = {
              id: material.id,
              name: material.name,
              type: material.type,
              unit: material.unit,
              site: material.site,
              quantity: newQuantity,
              status: newStatus,
              lastUpdated: now.toISOString(),
              qrCode: material.qrCode || material.id,
              createdAt: material.createdAt || now.toISOString()
            };
            await OfflineDataManager.updateMaterial(updatedMaterial);
            console.warn(`Material not found locally. Fetched from Supabase and queued update for material: ${material.id}`);
          }
        } catch (fetchError) {
          // If fetch fails, fallback to minimal update
          updatedMaterial = {
            id: material.id,
            name: material.name,
            type: material.type,
            unit: material.unit,
            site: material.site,
            quantity: action === 'material-in' ? numericQuantity : 0,
            status: (action === 'material-in' ? (numericQuantity < 50 ? 'low-stock' : 'available') : 'out-of-stock') as 'available' | 'low-stock' | 'out-of-stock',
            lastUpdated: now.toISOString(),
            qrCode: material.qrCode || material.id,
            createdAt: material.createdAt || now.toISOString()
          };
          await OfflineDataManager.updateMaterial(updatedMaterial);
          console.error(`Failed to fetch material from Supabase. Queued minimal update for material: ${material.id}`, fetchError);
        }
      }
    } catch (error) {
      console.error('Failed to update material quantity:', error);
      // Don't throw error here as the log was already created successfully
    }
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('materialLogCreated', {
      detail: { materialLog, action }
    }));
    
    console.log(`Material log created: ${material.name} - ${action} (${numericQuantity}) at ${site}`);
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