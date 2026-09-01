// Log Manager - Handles creation of entity-specific logs
// Replaces the single time_logs table with separate log tables for each entity type

import { OfflineSyncManager } from './offlineSync';
import { OfflineDataManager } from './offlineDataManager';
import { Employee, Equipment, Material, EmployeeLog, EquipmentLog, MaterialLog } from '../types';
import { AuthManager } from './authUtils';
import { formatEquipmentDuration } from './timeUtils';

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
      oldId: employee.oldId, // Include old ID for audit trail
      // Parse and fill hours fields from notes
      regular_hours: (() => {
        if (!notes) return undefined;
        const match = notes.match(/Regular\s*:?\s*([0-9]+(?:\.[0-9]+)?)h?/i);
        return match ? parseFloat(match[1]) : undefined;
      })(),
      overtime_hours: (() => {
        if (!notes) return undefined;
        const match = notes.match(/OT\s*:?\s*([0-9]+(?:\.[0-9]+)?)h?/i);
        return match ? parseFloat(match[1]) : undefined;
      })(),
      total_work_hours: (() => {
        if (!notes) return undefined;
        const match = notes.match(/Total\s*:?\s*([0-9]+(?:\.[0-9]+)?)h?/i);
        return match ? parseFloat(match[1]) : undefined;
      })()
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
    let usageDuration: number | undefined = undefined;
    let standbyDuration: number | undefined = undefined;
    let maintenanceDuration: number | undefined = undefined;

    // Calculate duration for end actions by finding their corresponding start action
    if (action === 'stop-use' || action === 'standby-end' || action === 'maintenance-end') {
      let equipmentLogs: EquipmentLog[] = [];
      const useSupabase = await AuthManager.shouldUseSupabase();
      let lastStartLog: EquipmentLog | undefined = undefined;
      
      // Determine the corresponding start action
      const startAction = action === 'stop-use' ? 'start-use' : 
                         action === 'standby-end' ? 'standby-start' : 'maintenance-start';
      
      for (let attempt = 0; attempt < 3; attempt++) {
        if (useSupabase) {
          const { SupabaseDataService } = await import('./supabaseDataService');
          equipmentLogs = await SupabaseDataService.getEquipmentLogs();
        } else {
          const { DataStorage } = await import('./dataStorage');
          equipmentLogs = DataStorage.loadEquipmentLogs();
        }
        
        // Find the most recent start log for this equipment and action type
        lastStartLog = equipmentLogs
          .filter(log => (log.equipment_id || log.equipmentId) === equipment.id && log.action === startAction)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        
        if (lastStartLog) break;
        // Wait 300ms before retrying
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      if (lastStartLog) {
        const startTime = new Date(lastStartLog.timestamp);
        if (!isNaN(startTime.getTime())) {
          // Calculate duration in hours (float)
          const calculatedDuration = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
          const roundedDuration = Math.round(calculatedDuration * 100) / 100; // round to 2 decimals
          
          // Assign to appropriate duration field based on action
          if (action === 'stop-use') {
            usageDuration = roundedDuration;
          } else if (action === 'standby-end') {
            standbyDuration = roundedDuration;
          } else if (action === 'maintenance-end') {
            maintenanceDuration = roundedDuration;
          }
          
          console.log(`DEBUG: Calculated duration for ${action}: ${roundedDuration} hours (${this.formatDuration(roundedDuration)})`);
        }
      } else {
        console.warn(`DEBUG: No recent '${startAction}' log found for equipment ${equipment.id} after retries`);
      }
    }

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
      oldId: equipment.oldId,
      usageDuration: typeof usageDuration === 'number' ? usageDuration : undefined,
      standbyDuration: typeof standbyDuration === 'number' ? standbyDuration : undefined,
      maintenanceDuration: typeof maintenanceDuration === 'number' ? maintenanceDuration : undefined
    };

    // Insert into Supabase or local storage
    let operationId = '';
    const useSupabase = await AuthManager.shouldUseSupabase();
    if (useSupabase) {
      const { supabase } = await import('./supabaseClient');
      const insertObj = {
        equipment_id: equipmentLog.equipmentId,
        equipment_name: equipmentLog.equipmentName,
        equipment_type: equipmentLog.equipmentType,
        action: equipmentLog.action,
        date: equipmentLog.date,
        time: equipmentLog.time,
        timestamp: equipmentLog.timestamp,
        site: equipmentLog.site,
        status: equipmentLog.status,
        notes: equipmentLog.notes,
        location: equipmentLog.location,
        old_id: equipmentLog.oldId,
        usage_duration: typeof usageDuration === 'number' ? usageDuration : null,
        standby_duration: typeof standbyDuration === 'number' ? standbyDuration : null,
        maintenance_duration: typeof maintenanceDuration === 'number' ? maintenanceDuration : null
      };
      console.log('DEBUG: Inserting equipment log into Supabase:', insertObj);
      const { data, error } = await supabase.from('equipment_logs').insert(insertObj).select('id, usage_duration').single();
      if (error) {
        console.error('DEBUG: Supabase insert error:', error);
        throw new Error(`Failed to insert equipment log: ${error.message}`);
      } else {
        console.log('DEBUG: Supabase insert result:', data);
        operationId = data?.id || equipmentLog.id;
      }
      
      // --- Cumulative duration update logic for all end actions ---
      if (action === 'stop-use' || action === 'standby-end' || action === 'maintenance-end') {
        try {
          // Fetch current equipment durations
          const { data: eqData, error: eqError } = await supabase
            .from('equipment')
            .select('usage_duration, standby_duration, maintenance_duration')
            .eq('id', equipment.id)
            .single();
          
          if (eqError) {
            console.error('DEBUG: Failed to fetch equipment durations:', eqError);
          } else {
            const updateData: any = {};
            
            // Update appropriate duration based on action
            if (action === 'stop-use' && typeof usageDuration === 'number' && usageDuration > 0) {
              const prevDuration = eqData?.usage_duration || 0;
              const newDuration = prevDuration + usageDuration;
              updateData.usage_duration = newDuration;
              console.log(`DEBUG: Updated equipment ${equipment.id} usage_duration: ${prevDuration} + ${usageDuration} = ${newDuration} (${this.formatDuration(newDuration)})`);
            } else if (action === 'standby-end' && typeof standbyDuration === 'number' && standbyDuration > 0) {
              const prevDuration = eqData?.standby_duration || 0;
              const newDuration = prevDuration + standbyDuration;
              updateData.standby_duration = newDuration;
              console.log(`DEBUG: Updated equipment ${equipment.id} standby_duration: ${prevDuration} + ${standbyDuration} = ${newDuration} (${this.formatDuration(newDuration)})`);
            } else if (action === 'maintenance-end' && typeof maintenanceDuration === 'number' && maintenanceDuration > 0) {
              const prevDuration = eqData?.maintenance_duration || 0;
              const newDuration = prevDuration + maintenanceDuration;
              updateData.maintenance_duration = newDuration;
              console.log(`DEBUG: Updated equipment ${equipment.id} maintenance_duration: ${prevDuration} + ${maintenanceDuration} = ${newDuration} (${this.formatDuration(newDuration)})`);
            }
            
            // Update equipment if we have duration data to update
            if (Object.keys(updateData).length > 0) {
              const { error: updError } = await supabase
                .from('equipment')
                .update(updateData)
                .eq('id', equipment.id);
              if (updError) {
                console.error('DEBUG: Failed to update equipment durations:', updError);
              }
            }
          }
        } catch (err) {
          console.error('DEBUG: Error updating cumulative durations:', err);
        }
      }
      
      // --- Equipment status update logic ---
      if (action === 'stop-use') {
        try {
          const { error: statusError } = await supabase
            .from('equipment')
            .update({ status: 'available', operational_status: 'working', last_updated: new Date().toISOString() })
            .eq('id', equipment.id);
          if (statusError) {
            console.error('DEBUG: Failed to update equipment status to available:', statusError);
          } else {
            console.log(`DEBUG: Updated equipment ${equipment.id} status to available after stop-use.`);
          }
        } catch (err) {
          console.error('DEBUG: Error updating equipment status to available:', err);
        }
      } else if (action === 'standby-end') {
        try {
          const { error: statusError } = await supabase
            .from('equipment')
            .update({ status: 'available', operational_status: 'working', last_updated: new Date().toISOString() })
            .eq('id', equipment.id);
          if (statusError) {
            console.error('DEBUG: Failed to update equipment status to available:', statusError);
          } else {
            console.log(`DEBUG: Updated equipment ${equipment.id} status to available after standby-end.`);
          }
        } catch (err) {
          console.error('DEBUG: Error updating equipment status to available:', err);
        }
      } else if (action === 'maintenance-end') {
        try {
          const { error: statusError } = await supabase
            .from('equipment')
            .update({ status: 'available', operational_status: 'working', last_updated: new Date().toISOString() })
            .eq('id', equipment.id);
          if (statusError) {
            console.error('DEBUG: Failed to update equipment status to available:', statusError);
          } else {
            console.log(`DEBUG: Updated equipment ${equipment.id} status to available after maintenance-end.`);
          }
        } catch (err) {
          console.error('DEBUG: Error updating equipment status to available:', err);
        }
      }
    } else {
      const { DataStorage } = await import('./dataStorage');
      const equipmentLogs = DataStorage.loadEquipmentLogs();
      equipmentLogs.push(equipmentLog);
      DataStorage.saveEquipmentLogs(equipmentLogs);
      operationId = equipmentLog.id;
      // Optionally update local equipment durations here if needed
    }

    window.dispatchEvent(new CustomEvent('equipmentLogCreated', {
      detail: { equipmentLog, action }
    }));
    
    // Create duration message for logging
    let durationMessage = '';
    if (usageDuration) durationMessage += ` (Usage: ${this.formatDuration(usageDuration)})`;
    if (standbyDuration) durationMessage += ` (Standby: ${this.formatDuration(standbyDuration)})`;
    if (maintenanceDuration) durationMessage += ` (Maintenance: ${this.formatDuration(maintenanceDuration)})`;
    
    console.log(`Equipment log created: ${equipment.name} - ${action} at ${site}${durationMessage}`);
    return operationId;
  }

  /**
   * Format duration in hours to a readable string
   * @param hours - Duration in hours (decimal)
   * @returns Formatted string (e.g., "1.30h", "25.5h", "2.5d")
   */
  private formatDuration(hours: number): string {
    return formatEquipmentDuration(hours);
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
    console.log('🔧 LogManager: Starting createMaterialLog for:', material.name, 'Action:', action, 'Quantity:', quantity);
    
    // Ensure quantity is a number
    const numericQuantity = Number(quantity);
    if (isNaN(numericQuantity) || numericQuantity <= 0) {
      throw new Error('Invalid quantity: must be a positive number');
    }
    const now = new Date();

    // --- Robust stock validation and current quantity fetch ---
    let latestMaterial: Material | undefined;
    let currentQuantity = 0;
    
    // Always fetch latest material data for accurate quantity calculation
    if (await AuthManager.shouldUseSupabase()) {
      // Supabase mode: always fetch latest from server
      try {
        const { SupabaseDataService } = await import('./supabaseDataService');
        const supabaseMaterials = await SupabaseDataService.getMaterials();
        latestMaterial = supabaseMaterials.find(m => m.id === material.id);
        currentQuantity = latestMaterial ? latestMaterial.quantity : 0;
        console.log('📊 LogManager: Fetched from Supabase - Current quantity:', currentQuantity);
      } catch (error) {
        console.warn('⚠️ LogManager: Failed to fetch from Supabase, using local data:', error);
        // Fallback to local data
        const { DataStorage } = await import('./dataStorage');
        const localMaterials = DataStorage.loadMaterials();
        latestMaterial = localMaterials.find(m => m.id === material.id);
        currentQuantity = latestMaterial ? latestMaterial.quantity : 0;
      }
    } else {
      // Local mode
      const { DataStorage } = await import('./dataStorage');
      const localMaterials = DataStorage.loadMaterials();
      latestMaterial = localMaterials.find(m => m.id === material.id);
      currentQuantity = latestMaterial ? latestMaterial.quantity : 0;
    }
    
    // Validate OUT operation
    if (action === 'material-out') {
      if (numericQuantity > currentQuantity) {
        // Notify user: no stock
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('materialOutBlocked', {
            detail: { material, requested: numericQuantity, available: currentQuantity }
          }));
        }
        throw new Error(`Cannot remove ${numericQuantity} ${material.unit}. Only ${currentQuantity} ${material.unit} available in stock.`);
      }
    }
    // --- End validation ---

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
    console.log('📝 LogManager: Creating material log entry...');
    const operationId = await OfflineDataManager.createMaterialLog(materialLog);
    console.log('✅ LogManager: Material log created with operation ID:', operationId);
    
    // Update material quantity in both local storage and queue for Supabase sync
    console.log('🔄 LogManager: Starting material quantity update...');
    try {
      // Calculate new quantity based on current quantity and action
      let newQuantity = currentQuantity;
      if (action === 'material-in') {
        newQuantity += numericQuantity;
      } else {
        newQuantity = Math.max(0, currentQuantity - numericQuantity);
      }
      
      let newStatus: 'available' | 'low-stock' | 'out-of-stock' = 'available';
      if (newQuantity === 0) {
        newStatus = 'out-of-stock';
      } else if (newQuantity < 50) {
        newStatus = 'low-stock';
      }
      
      const updatedMaterial = {
        ...material,
        quantity: newQuantity,
        status: newStatus,
        lastUpdated: now.toISOString()
      };
      
      await OfflineDataManager.updateMaterial(updatedMaterial);
      console.log(`✅ LogManager: Material quantity updated: ${material.name} - ${action} (${numericQuantity}) - Old: ${currentQuantity}, New: ${newQuantity}`);
    } catch (error) {
      console.error('❌ LogManager: Failed to update material quantity:', error);
      // Don't throw error here as the log was already created successfully
    }

    // Force immediate sync and refresh local store
    try {
      const { offlineSyncManager } = await import('./offlineSync');
      if (offlineSyncManager) {
        console.log('🔄 LogManager: Forcing immediate sync...');
        await offlineSyncManager.processSyncQueue();
        console.log('✅ LogManager: Sync completed');
        
        // After sync, refresh local materials from Supabase if online
        if (await AuthManager.shouldUseSupabase()) {
          console.log('🔄 LogManager: Refreshing local materials from Supabase...');
          const { SupabaseDataService } = await import('./supabaseDataService');
          const supabaseMaterials = await SupabaseDataService.getMaterials();
          const { DataStorage } = await import('./dataStorage');
          DataStorage.saveMaterials(supabaseMaterials);
          console.log('✅ LogManager: Local materials refreshed');
        }
      }
    } catch (syncError) {
      console.error('⚠️ LogManager: Material sync failed:', syncError);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('materialSyncFailed', {
          detail: { material, action, quantity, error: syncError }
        }));
      }
    }
    
    console.log('🏁 LogManager: createMaterialLog completed successfully');
    return operationId;
  }

  /**
   * Backfill durations for all equipment logs by pairing with previous start logs.
   */
  static async backfillEquipmentUsageDurations(): Promise<{ updated: number; skipped: number }> {
    let equipmentLogs: EquipmentLog[] = [];
    const useSupabase = await AuthManager.shouldUseSupabase();
    if (useSupabase) {
      const { SupabaseDataService } = await import('./supabaseDataService');
      equipmentLogs = await SupabaseDataService.getEquipmentLogs();
    } else {
      const { DataStorage } = await import('./dataStorage');
      equipmentLogs = DataStorage.loadEquipmentLogs();
    }
    
    // Group logs by equipmentId
    const logsByEquipment: Record<string, EquipmentLog[]> = {};
    for (const log of equipmentLogs) {
      const equipmentId = log.equipment_id || log.equipmentId;
      if (!logsByEquipment[equipmentId]) logsByEquipment[equipmentId] = [];
      logsByEquipment[equipmentId].push(log);
    }
    
    let updated = 0;
    let skipped = 0;
    
    for (const equipmentId in logsByEquipment) {
      const logs = logsByEquipment[equipmentId].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      // Track open start logs for each action type
      let openStartUseLog: EquipmentLog | undefined = undefined;
      let openStandbyStartLog: EquipmentLog | undefined = undefined;
      let openMaintenanceStartLog: EquipmentLog | undefined = undefined;
      
      for (const log of logs) {
        // Handle start actions
        if (log.action === 'start-use') {
          openStartUseLog = log;
        } else if (log.action === 'standby-start') {
          openStandbyStartLog = log;
        } else if (log.action === 'maintenance-start') {
          openMaintenanceStartLog = log;
        }
        
        // Handle end actions and calculate durations
        else if (log.action === 'stop-use' && openStartUseLog) {
          const currentDuration = log.usage_duration || log.usageDuration;
          if (!currentDuration || currentDuration === 0) {
            const startTime = new Date(openStartUseLog.timestamp);
            const stopTime = new Date(log.timestamp);
            const duration = Math.round((stopTime.getTime() - startTime.getTime()) / 60000); // in minutes
            const newDuration = duration > 0 ? duration : 0;
            log.usageDuration = newDuration;
            log.usage_duration = newDuration;
            updated++;
            
            // Save update
            if (useSupabase) {
              const { supabase } = await import('./supabaseClient');
              if (supabase) {
                await supabase.from('equipment_logs').update({ usage_duration: log.usageDuration }).eq('id', log.id);
              }
            } else {
              // Update in local storage
              const { DataStorage } = await import('./dataStorage');
              const allLogs = DataStorage.loadEquipmentLogs();
              const idx = allLogs.findIndex(l => l.id === log.id);
              if (idx !== -1) {
                allLogs[idx] = { ...allLogs[idx], usageDuration: log.usageDuration };
                DataStorage.saveEquipmentLogs(allLogs);
              }
            }
          } else {
            skipped++;
          }
          openStartUseLog = undefined;
        }
        
        else if (log.action === 'standby-end' && openStandbyStartLog) {
          const currentDuration = log.standby_duration || log.standbyDuration;
          if (!currentDuration || currentDuration === 0) {
            const startTime = new Date(openStandbyStartLog.timestamp);
            const stopTime = new Date(log.timestamp);
            const duration = Math.round((stopTime.getTime() - startTime.getTime()) / 60000); // in minutes
            const newDuration = duration > 0 ? duration : 0;
            log.standbyDuration = newDuration;
            log.standby_duration = newDuration;
            updated++;
            
            // Save update
            if (useSupabase) {
              const { supabase } = await import('./supabaseClient');
              if (supabase) {
                await supabase.from('equipment_logs').update({ standby_duration: log.standbyDuration }).eq('id', log.id);
              }
            } else {
              // Update in local storage
              const { DataStorage } = await import('./dataStorage');
              const allLogs = DataStorage.loadEquipmentLogs();
              const idx = allLogs.findIndex(l => l.id === log.id);
              if (idx !== -1) {
                allLogs[idx] = { ...allLogs[idx], standbyDuration: log.standbyDuration };
                DataStorage.saveEquipmentLogs(allLogs);
              }
            }
          } else {
            skipped++;
          }
          openStandbyStartLog = undefined;
        }
        
        else if (log.action === 'maintenance-end' && openMaintenanceStartLog) {
          const currentDuration = log.maintenance_duration || log.maintenanceDuration;
          if (!currentDuration || currentDuration === 0) {
            const startTime = new Date(openMaintenanceStartLog.timestamp);
            const stopTime = new Date(log.timestamp);
            const duration = Math.round((stopTime.getTime() - startTime.getTime()) / 60000); // in minutes
            const newDuration = duration > 0 ? duration : 0;
            log.maintenanceDuration = newDuration;
            log.maintenance_duration = newDuration;
            updated++;
            
            // Save update
            if (useSupabase) {
              const { supabase } = await import('./supabaseClient');
              if (supabase) {
                await supabase.from('equipment_logs').update({ maintenance_duration: log.maintenanceDuration }).eq('id', log.id);
              }
            } else {
              // Update in local storage
              const { DataStorage } = await import('./dataStorage');
              const allLogs = DataStorage.loadEquipmentLogs();
              const idx = allLogs.findIndex(l => l.id === log.id);
              if (idx !== -1) {
                allLogs[idx] = { ...allLogs[idx], maintenanceDuration: log.maintenanceDuration };
                DataStorage.saveEquipmentLogs(allLogs);
              }
            }
          } else {
            skipped++;
          }
          openMaintenanceStartLog = undefined;
        }
      }
    }
    return { updated, skipped };
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