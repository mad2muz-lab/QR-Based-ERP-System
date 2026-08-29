import type { EquipmentMaintenanceLog, EquipmentMaintenanceSchedule } from '../types';
import { OfflineDataManager } from './offlineDataManager';
import { AuthManager } from './authUtils';

export class MaintenanceService {
  private static instance: MaintenanceService;

  private constructor() {}

  static getInstance(): MaintenanceService {
    if (!MaintenanceService.instance) {
      MaintenanceService.instance = new MaintenanceService();
    }
    return MaintenanceService.instance;
  }

  // Create a new maintenance log
  async createMaintenanceLog(maintenanceData: Partial<EquipmentMaintenanceLog> & { equipment?: any }): Promise<string> {
    const now = new Date();
    let equipment = maintenanceData.equipment;
    // If only equipment_id is provided, try to load equipment from storage
    if (!equipment && maintenanceData.equipment_id) {
      try {
        const { DataStorage } = await import('./dataStorage');
        equipment = DataStorage.loadEquipment().find((eq: any) => eq.id === maintenanceData.equipment_id);
      } catch {}
    }
    const maintenanceLog: EquipmentMaintenanceLog = {
      id: `maint-log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      equipment_id: maintenanceData.equipment_id!,
      maintenance_type: maintenanceData.maintenance_type!,
      repair_type: maintenanceData.repair_type,
      service_type: maintenanceData.service_type,
      status: maintenanceData.status || 'scheduled',
      description: maintenanceData.description || '',
      technician_notes: maintenanceData.technician_notes || '',
      parts_used: maintenanceData.parts_used || '',
      start_date: maintenanceData.start_date || now.toISOString(),
              completed_date: maintenanceData.completion_date, // Fixed: was completion_date, should be completed_date
      completed_by: maintenanceData.completed_by,
      estimated_duration_hours: maintenanceData.estimated_duration_hours || 1,
      actual_duration_hours: maintenanceData.actual_duration_hours,
      cost: maintenanceData.cost || 0,
      next_maintenance_date: maintenanceData.next_maintenance_date,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      // New fields
      equipment_name: equipment?.name || '',
      old_equipment_id: equipment?.oldId || '',
      equipment_type: equipment?.type || '',
      model: equipment?.model || '',
      serial_number: equipment?.serialNumber || '',
      site_assignment: equipment?.site || ''
    };

    const operationId = await OfflineDataManager.createMaintenanceLog(maintenanceLog);
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('maintenanceLogCreated', {
      detail: { maintenanceLog }
    }));
    
    console.log(`Maintenance log created: ${maintenanceLog.description} for equipment ${maintenanceLog.equipment_id}`);
    return operationId;
  }

  // Create a maintenance schedule
  async createMaintenanceSchedule(scheduleData: Partial<EquipmentMaintenanceSchedule>): Promise<string> {
    const now = new Date();
    
    const maintenanceSchedule: EquipmentMaintenanceSchedule = {
      id: `maint-sched-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      equipment_id: scheduleData.equipment_id!,
      schedule_type: scheduleData.schedule_type!,
      maintenance_type: scheduleData.maintenance_type!,
      frequency_days: scheduleData.frequency_days || 30,
      last_maintenance_date: scheduleData.last_maintenance_date,
      next_maintenance_date: scheduleData.next_maintenance_date!,
      assigned_technician: scheduleData.assigned_technician || '',
      priority: scheduleData.priority || 'medium',
      description: scheduleData.description || '',
      is_active: scheduleData.is_active !== false,
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };

    const operationId = await OfflineDataManager.createMaintenanceSchedule(maintenanceSchedule);
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('maintenanceScheduleCreated', {
      detail: { maintenanceSchedule }
    }));
    
    console.log(`Maintenance schedule created: ${maintenanceSchedule.description} for equipment ${maintenanceSchedule.equipment_id}`);
    return operationId;
  }

  // Update maintenance log status
  async updateMaintenanceStatus(
    maintenanceId: string, 
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
    completionData?: {
      actual_duration_hours?: number;
      cost?: number;
      completed_by?: string;
      technician_notes?: string;
      parts_used?: string;
    }
  ): Promise<void> {
    const now = new Date();
    
    const updateData: Partial<EquipmentMaintenanceLog> = {
      status,
      updated_at: now.toISOString()
    };

    if (status === 'completed' && completionData) {
              updateData.completed_date = now.toISOString(); // Fixed: was completion_date, should be completed_date
      updateData.actual_duration_hours = completionData.actual_duration_hours;
      updateData.cost = completionData.cost;
      updateData.completed_by = completionData.completed_by;
      updateData.technician_notes = completionData.technician_notes;
      updateData.parts_used = completionData.parts_used;
    }

    await OfflineDataManager.updateMaintenanceLog(maintenanceId, updateData);
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('maintenanceStatusUpdated', {
      detail: { maintenanceId, status, updateData }
    }));
    
    console.log(`Maintenance status updated: ${maintenanceId} -> ${status}`);
  }

  // Get maintenance logs for equipment
  async getMaintenanceLogs(equipmentId: string): Promise<EquipmentMaintenanceLog[]> {
    const allLogs = await OfflineDataManager.getAllMaintenanceLogs();
    return allLogs.filter(log => log.equipment_id === equipmentId);
  }

  // Get maintenance schedules for equipment
  async getMaintenanceSchedules(equipmentId: string): Promise<EquipmentMaintenanceSchedule[]> {
    const allSchedules = await OfflineDataManager.getAllMaintenanceSchedules();
    return allSchedules.filter(schedule => schedule.equipment_id === equipmentId);
  }

  // Get active maintenance for equipment
  async getActiveMaintenance(equipmentId: string): Promise<EquipmentMaintenanceLog | null> {
    const logs = await this.getMaintenanceLogs(equipmentId);
    return logs.find(log => log.status === 'in_progress') || null;
  }

  // Get upcoming scheduled maintenance
  async getUpcomingMaintenance(equipmentId: string): Promise<EquipmentMaintenanceSchedule[]> {
    const schedules = await this.getMaintenanceSchedules(equipmentId);
    const now = new Date();
    return schedules.filter(schedule => 
      schedule.is_active && 
      new Date(schedule.next_maintenance_date) > now
    );
  }

  // Calculate maintenance statistics
  async getMaintenanceStats(equipmentId: string): Promise<{
    totalMaintenance: number;
    completedMaintenance: number;
    totalCost: number;
    averageDuration: number;
    lastMaintenance?: string;
    nextScheduled?: string;
  }> {
    const logs = await this.getMaintenanceLogs(equipmentId);
    const schedules = await this.getMaintenanceSchedules(equipmentId);
    
    const completedLogs = logs.filter(log => log.status === 'completed');
    const totalCost = completedLogs.reduce((sum, log) => sum + (log.cost || 0), 0);
    const totalDuration = completedLogs.reduce((sum, log) => sum + (log.actual_duration_hours || 0), 0);
    
    const lastMaintenance = completedLogs.length > 0 
              ? completedLogs.sort((a, b) => new Date(b.completed_date!).getTime() - new Date(a.completed_date!).getTime())[0].completed_date // Fixed: was completion_date, should be completed_date
      : undefined;
    
    const upcomingSchedules = schedules.filter(s => s.is_active);
    const nextScheduled = upcomingSchedules.length > 0
      ? upcomingSchedules.sort((a, b) => new Date(a.next_maintenance_date).getTime() - new Date(b.next_maintenance_date).getTime())[0].next_maintenance_date
      : undefined;

    return {
      totalMaintenance: logs.length,
      completedMaintenance: completedLogs.length,
      totalCost,
      averageDuration: completedLogs.length > 0 ? totalDuration / completedLogs.length : 0,
      lastMaintenance,
      nextScheduled
    };
  }

  // Start maintenance workflow
  async startMaintenance(maintenanceData: any): Promise<string> {
    // Create maintenance log
    const maintenanceLogId = await this.createMaintenanceLog({
      ...maintenanceData,
      status: 'in_progress'
    });

    // Update equipment status to maintenance
    try {
      const { DataStorage } = await import('./dataStorage');
      const equipment = DataStorage.loadEquipment().find(eq => eq.id === maintenanceData.equipment_id);
      if (equipment) {
        const updatedEquipment = {
          ...equipment,
          status: 'maintenance' as const,
          operational_status: (maintenanceData.maintenance_type === 'repair' ? 'under_repair' : 'under_service') as 'under_repair' | 'under_service',
          lastUpdated: new Date().toISOString()
        };
        await OfflineDataManager.updateEquipment(updatedEquipment);
      }
    } catch (error) {
      console.error('Failed to update equipment status:', error);
    }

    return maintenanceLogId;
  }

  // Complete maintenance workflow
  async completeMaintenance(
    maintenanceId: string, 
    completionData: {
      actual_duration_hours?: number;
      cost?: number;
      completed_by?: string;
      technician_notes?: string;
      parts_used?: string;
    }
  ): Promise<void> {
    // Update maintenance log
    await this.updateMaintenanceStatus(maintenanceId, 'completed', completionData);

    // Get the maintenance log to find equipment ID
    const logs = await OfflineDataManager.getAllMaintenanceLogs();
    const maintenanceLog = logs.find(log => log.id === maintenanceId);
    
    if (maintenanceLog) {
      // Update equipment status back to available
      try {
        const { DataStorage } = await import('./dataStorage');
        const equipment = DataStorage.loadEquipment().find(eq => eq.id === maintenanceLog.equipment_id);
        if (equipment) {
          const updatedEquipment = {
            ...equipment,
            status: 'available' as const,
            operational_status: 'working' as const,
            lastUpdated: new Date().toISOString()
          };
          await OfflineDataManager.updateEquipment(updatedEquipment);
        }
      } catch (error) {
        console.error('Failed to update equipment status:', error);
      }
    }
  }

  // Schedule maintenance workflow
  async scheduleMaintenance(scheduleData: any): Promise<string> {
    return await this.createMaintenanceSchedule(scheduleData);
  }
}

// Export singleton instance
export const maintenanceService = MaintenanceService.getInstance(); 