import { DataStorage } from './dataStorage';
import { OfflineDataManager } from './offlineDataManager';
import { maintenanceService } from './maintenanceService';
import { EquipmentMaintenanceSchedule } from '../types';

export interface PreventiveMaintenanceConfig {
  id?: string;
  equipment_type: string;
  class_a_hours: number;
  class_b_hours: number;
  class_c_hours: number;
  class_a_threshold_hours: number;
  class_b_threshold_hours: number;
  class_c_threshold_hours: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Internal interface for preventive maintenance schedules
export interface MaintenanceSchedule {
  id: string;
  equipment_id: string;
  equipment_name: string;
  equipment_type: string;
  maintenance_class: 'A' | 'B' | 'C';
  scheduled_date: string;
  estimated_hours: number;
  current_usage_hours: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue';
  materials_required: string[];
  assigned_technician?: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
}

export interface EquipmentUsageData {
  equipment_id: string;
  equipment_name: string;
  equipment_type: string;
  total_usage_hours: number;
  last_maintenance_date?: string;
  last_maintenance_class?: string;
  next_maintenance_class: 'A' | 'B' | 'C';
  hours_since_last_maintenance: number;
  hours_until_next_maintenance: number;
  days_until_next_maintenance: number;
  is_overdue: boolean;
  overdue_hours: number;
}

export class PreventiveMaintenanceService {
  private static instance: PreventiveMaintenanceService;
  private autoCheckInterval: NodeJS.Timeout | null = null;
  private isAutoChecking = false;

  static getInstance(): PreventiveMaintenanceService {
    if (!PreventiveMaintenanceService.instance) {
      PreventiveMaintenanceService.instance = new PreventiveMaintenanceService();
    }
    return PreventiveMaintenanceService.instance;
  }

  // Start automatic preventive maintenance checking
  startAutoCheck(intervalMinutes: number = 30): void {
    if (this.autoCheckInterval) {
      this.stopAutoCheck();
    }

    console.log(`Starting automatic preventive maintenance check every ${intervalMinutes} minutes`);
    
    this.autoCheckInterval = setInterval(async () => {
      if (!this.isAutoChecking) {
        await this.performAutoCheck();
      }
    }, intervalMinutes * 60 * 1000);

    // Perform initial check
    this.performAutoCheck();
  }

  // Stop automatic checking
  stopAutoCheck(): void {
    if (this.autoCheckInterval) {
      clearInterval(this.autoCheckInterval);
      this.autoCheckInterval = null;
      console.log('Stopped automatic preventive maintenance check');
    }
  }

  // Perform automatic check for preventive maintenance needs
  private async performAutoCheck(): Promise<void> {
    if (this.isAutoChecking) return;

    try {
      this.isAutoChecking = true;
      console.log('Performing automatic preventive maintenance check...');

      // Generate maintenance schedules
      const newSchedules = await this.generateMaintenanceSchedules();
      
      if (newSchedules.length > 0) {
        console.log(`Generated ${newSchedules.length} new maintenance schedules`);
        
        // Dispatch event to notify UI components
        window.dispatchEvent(new CustomEvent('preventiveMaintenanceSchedulesGenerated', {
          detail: { schedules: newSchedules }
        }));

        // Show notification to user
        this.showMaintenanceNotification(newSchedules);
      } else {
        console.log('No new maintenance schedules needed');
      }
    } catch (error) {
      console.error('Error during automatic preventive maintenance check:', error);
    } finally {
      this.isAutoChecking = false;
    }
  }

  // Show notification for new maintenance schedules
  private showMaintenanceNotification(schedules: MaintenanceSchedule[]): void {
    const equipmentNames = schedules.map(s => s.equipment_name).join(', ');
    const message = `Preventive maintenance scheduled for: ${equipmentNames}`;
    
    // Create browser notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Preventive Maintenance Alert', {
        body: message,
        icon: '/favicon.ico'
      });
    }

    // Dispatch custom event for UI notification
    window.dispatchEvent(new CustomEvent('maintenanceNotification', {
      detail: { 
        title: 'Preventive Maintenance Alert',
        message,
        schedules
      }
    }));
  }

  // Manual trigger for immediate check
  async triggerManualCheck(): Promise<MaintenanceSchedule[]> {
    console.log('Manual preventive maintenance check triggered');
    return await this.generateMaintenanceSchedules();
  }

  // Calculate equipment usage hours from time logs
  async calculateEquipmentUsageHours(equipmentId: string): Promise<number> {
    try {
      const equipmentLogs = await OfflineDataManager.getAllEquipmentLogs();
      const equipment = DataStorage.loadEquipment().find(eq => eq.id === equipmentId);
      
      if (!equipment) return 0;

      let totalHours = 0;
      let currentSessionStart: Date | null = null;

      // Sort logs by timestamp
      const sortedLogs = equipmentLogs
        .filter(log => log.equipmentId === equipmentId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      for (const log of sortedLogs) {
        switch (log.action) {
          case 'start-use':
            currentSessionStart = new Date(log.timestamp);
            break;
          case 'stop-use':
          case 'maintenance-start':
            if (currentSessionStart) {
              const sessionEnd = new Date(log.timestamp);
              const sessionHours = (sessionEnd.getTime() - currentSessionStart.getTime()) / (1000 * 60 * 60);
              totalHours += sessionHours;
              currentSessionStart = null;
            }
            break;
        }
      }

      // If equipment is currently in use, add current session
      if (currentSessionStart) {
        const now = new Date();
        const currentSessionHours = (now.getTime() - currentSessionStart.getTime()) / (1000 * 60 * 60);
        totalHours += currentSessionHours;
      }

      return Math.round(totalHours * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.error('Error calculating equipment usage hours:', error);
      return 0;
    }
  }

  // Get equipment usage data for all equipment
  async getAllEquipmentUsageData(): Promise<EquipmentUsageData[]> {
    try {
      const equipment = DataStorage.loadEquipment();
      const configs = await OfflineDataManager.getAllPreventiveMaintenanceConfigs();
      const maintenanceLogs = await OfflineDataManager.getAllMaintenanceLogs();

      const usageData: EquipmentUsageData[] = [];

      for (const eq of equipment) {
        const config = configs.find(c => c.equipment_type === eq.type && c.is_active);
        if (!config) continue;

        const totalUsageHours = await this.calculateEquipmentUsageHours(eq.id);
        
        // Find last maintenance
        const lastMaintenance = maintenanceLogs
          .filter(log => log.equipment_id === eq.id && log.status === 'completed')
          .sort((a, b) => new Date(b.completion_date!).getTime() - new Date(a.completion_date!).getTime())[0];

        const lastMaintenanceDate = lastMaintenance?.completion_date;
        const lastMaintenanceClass = lastMaintenance?.maintenance_type === 'service' ? 'A' : 'B';

        // Calculate hours since last maintenance
        let hoursSinceLastMaintenance = totalUsageHours;
        if (lastMaintenanceDate) {
          const lastMaintenanceTime = new Date(lastMaintenanceDate);
          const now = new Date();
          const timeDiff = now.getTime() - lastMaintenanceTime.getTime();
          hoursSinceLastMaintenance = totalUsageHours - (lastMaintenance?.actual_duration_hours || 0);
        }

        // Determine next maintenance class
        let nextMaintenanceClass: 'A' | 'B' | 'C' = 'A';
        let hoursUntilNextMaintenance = config.class_a_hours - hoursSinceLastMaintenance;

        if (hoursSinceLastMaintenance >= config.class_c_threshold_hours) {
          nextMaintenanceClass = 'C';
          hoursUntilNextMaintenance = config.class_c_hours - hoursSinceLastMaintenance;
        } else if (hoursSinceLastMaintenance >= config.class_b_threshold_hours) {
          nextMaintenanceClass = 'B';
          hoursUntilNextMaintenance = config.class_b_hours - hoursSinceLastMaintenance;
        }

        // Calculate days until next maintenance (assuming 8 hours per day)
        const daysUntilNextMaintenance = Math.ceil(hoursUntilNextMaintenance / 8);

        // Check if overdue
        const isOverdue = hoursSinceLastMaintenance > config[`class_${nextMaintenanceClass.toLowerCase()}_hours`];
        const overdueHours = isOverdue ? hoursSinceLastMaintenance - config[`class_${nextMaintenanceClass.toLowerCase()}_hours`] : 0;

        usageData.push({
          equipment_id: eq.id,
          equipment_name: eq.name,
          equipment_type: eq.type,
          total_usage_hours: totalUsageHours,
          last_maintenance_date: lastMaintenanceDate,
          last_maintenance_class: lastMaintenanceClass,
          next_maintenance_class: nextMaintenanceClass,
          hours_since_last_maintenance: hoursSinceLastMaintenance,
          hours_until_next_maintenance: hoursUntilNextMaintenance,
          days_until_next_maintenance: daysUntilNextMaintenance,
          is_overdue: isOverdue,
          overdue_hours: overdueHours
        });
      }

      return usageData;
    } catch (error) {
      console.error('Error getting equipment usage data:', error);
      return [];
    }
  }

  // Generate maintenance schedules for equipment that need maintenance
  async generateMaintenanceSchedules(): Promise<MaintenanceSchedule[]> {
    try {
      const usageData = await this.getAllEquipmentUsageData();
      const configs = await OfflineDataManager.getAllPreventiveMaintenanceConfigs();
      const existingSchedules = await OfflineDataManager.getAllMaintenanceSchedules();

      const newSchedules: MaintenanceSchedule[] = [];

      for (const usage of usageData) {
        const config = configs.find(c => c.equipment_type === usage.equipment_type && c.is_active);
        if (!config) continue;

        // Check if equipment needs maintenance (reached threshold or overdue)
        const thresholdHours = config[`class_${usage.next_maintenance_class.toLowerCase()}_threshold_hours`];
        const needsMaintenance = usage.hours_since_last_maintenance >= thresholdHours || usage.is_overdue;

        if (needsMaintenance) {
          // Check if schedule already exists
          const existingSchedule = existingSchedules.find(s => 
            s.equipment_id === usage.equipment_id && 
            s.is_active
          );

          if (!existingSchedule) {
            // Calculate scheduled date (next business day)
            const scheduledDate = this.getNextBusinessDay();
            
            // Determine priority based on overdue status
            let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
            if (usage.is_overdue) {
              priority = usage.overdue_hours > 100 ? 'critical' : 'high';
            } else if (usage.hours_until_next_maintenance < 10) {
              priority = 'high';
            }

            const schedule: MaintenanceSchedule = {
              id: `pm-schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              equipment_id: usage.equipment_id,
              equipment_name: usage.equipment_name,
              equipment_type: usage.equipment_type,
              maintenance_class: usage.next_maintenance_class,
              scheduled_date: scheduledDate.toISOString(),
              estimated_hours: this.getEstimatedHoursForClass(usage.next_maintenance_class),
              current_usage_hours: usage.total_usage_hours,
              status: 'scheduled',
              materials_required: this.getDefaultMaterialsForClass(usage.next_maintenance_class),
              priority,
              description: `${usage.next_maintenance_class} Class Maintenance - ${usage.equipment_name}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            newSchedules.push(schedule);
          }
        }
      }

      // Save new schedules
      for (const schedule of newSchedules) {
        const dbSchedule = this.convertInternalToDbSchedule(schedule);
        await OfflineDataManager.createMaintenanceSchedule(dbSchedule);
      }

      return newSchedules;
    } catch (error) {
      console.error('Error generating maintenance schedules:', error);
      return [];
    }
  }

  // Get upcoming maintenance schedules
  async getUpcomingMaintenanceSchedules(daysAhead: number = 30): Promise<MaintenanceSchedule[]> {
    try {
      const dbSchedules = await OfflineDataManager.getAllMaintenanceSchedules();
      const now = new Date();
      const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

      // Convert database schedules to internal format
      const schedules: MaintenanceSchedule[] = dbSchedules
        .filter(schedule => {
          const scheduleDate = new Date(schedule.next_maintenance_date);
          return scheduleDate >= now && scheduleDate <= futureDate && schedule.is_active;
        })
        .map(schedule => this.convertDbScheduleToInternal(schedule))
        .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());

      return schedules;
    } catch (error) {
      console.error('Error getting upcoming maintenance schedules:', error);
      return [];
    }
  }

  // Get overdue maintenance schedules
  async getOverdueMaintenanceSchedules(): Promise<MaintenanceSchedule[]> {
    try {
      const dbSchedules = await OfflineDataManager.getAllMaintenanceSchedules();
      const now = new Date();

      // Convert database schedules to internal format
      const schedules: MaintenanceSchedule[] = dbSchedules
        .filter(schedule => {
          const scheduleDate = new Date(schedule.next_maintenance_date);
          return scheduleDate < now && schedule.is_active;
        })
        .map(schedule => this.convertDbScheduleToInternal(schedule))
        .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());

      return schedules;
    } catch (error) {
      console.error('Error getting overdue maintenance schedules:', error);
      return [];
    }
  }

  // Convert database schedule to internal format
  private convertDbScheduleToInternal(dbSchedule: EquipmentMaintenanceSchedule): MaintenanceSchedule {
    const equipment = DataStorage.loadEquipment().find(eq => eq.id === dbSchedule.equipment_id);
    
    return {
      id: dbSchedule.id,
      equipment_id: dbSchedule.equipment_id,
      equipment_name: equipment?.name || 'Unknown Equipment',
      equipment_type: equipment?.type || 'Unknown',
      maintenance_class: this.getMaintenanceClassFromType(dbSchedule.maintenance_type),
      scheduled_date: dbSchedule.next_maintenance_date,
      estimated_hours: this.getEstimatedHoursForClass(this.getMaintenanceClassFromType(dbSchedule.maintenance_type)),
      current_usage_hours: 0, // Will be calculated separately
      status: 'scheduled', // Default status for preventive maintenance
      materials_required: this.getDefaultMaterialsForClass(this.getMaintenanceClassFromType(dbSchedule.maintenance_type)),
      assigned_technician: dbSchedule.assigned_technician,
      description: dbSchedule.description,
      priority: dbSchedule.priority,
      created_at: dbSchedule.created_at,
      updated_at: dbSchedule.updated_at
    };
  }

  // Convert internal schedule to database format
  private convertInternalToDbSchedule(internalSchedule: MaintenanceSchedule): EquipmentMaintenanceSchedule {
    return {
      id: internalSchedule.id,
      equipment_id: internalSchedule.equipment_id,
      schedule_type: 'preventive',
      maintenance_type: 'service',
      frequency_days: 30, // Default frequency
      last_maintenance_date: undefined,
      next_maintenance_date: internalSchedule.scheduled_date,
      assigned_technician: internalSchedule.assigned_technician,
      priority: internalSchedule.priority,
      description: internalSchedule.description,
      is_active: true,
      created_at: internalSchedule.created_at,
      updated_at: internalSchedule.updated_at
    };
  }

  // Get maintenance class from maintenance type
  private getMaintenanceClassFromType(maintenanceType: 'repair' | 'service'): 'A' | 'B' | 'C' {
    // Default to Class A for service, Class B for repair
    return maintenanceType === 'service' ? 'A' : 'B';
  }

  // Start preventive maintenance
  async startPreventiveMaintenance(scheduleId: string, technicianId?: string): Promise<boolean> {
    try {
      const schedules = await OfflineDataManager.getAllMaintenanceSchedules();
      const schedule = schedules.find(s => s.id === scheduleId);
      
      if (!schedule) {
        throw new Error('Maintenance schedule not found');
      }

      // Update schedule assigned technician
      await OfflineDataManager.updateMaintenanceSchedule(scheduleId, {
        assigned_technician: technicianId,
        updated_at: new Date().toISOString()
      });

      // Create maintenance log
      const equipment = DataStorage.loadEquipment().find(eq => eq.id === schedule.equipment_id);
      if (equipment) {
        await maintenanceService.createMaintenanceLog({
          equipment_id: schedule.equipment_id,
          maintenance_type: 'service',
          status: 'in_progress',
          description: schedule.description,
          start_date: new Date().toISOString(),
          estimated_duration_hours: this.getEstimatedHoursForClass(this.getMaintenanceClassFromType(schedule.maintenance_type)),
          equipment
        });
      }

      return true;
    } catch (error) {
      console.error('Error starting preventive maintenance:', error);
      return false;
    }
  }

  // Complete preventive maintenance
  async completePreventiveMaintenance(scheduleId: string, completionData: {
    actual_duration_hours: number;
    cost: number;
    technician_notes: string;
    parts_used: string;
    completed_by: string;
  }): Promise<boolean> {
    try {
      const schedules = await OfflineDataManager.getAllMaintenanceSchedules();
      const schedule = schedules.find(s => s.id === scheduleId);
      
      if (!schedule) {
        throw new Error('Maintenance schedule not found');
      }

      // Update schedule last maintenance date
      await OfflineDataManager.updateMaintenanceSchedule(scheduleId, {
        last_maintenance_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Update equipment usage hours (reset since last maintenance)
      const equipment = DataStorage.loadEquipment().find(eq => eq.id === schedule.equipment_id);
      if (equipment) {
        const updatedEquipment = {
          ...equipment,
          last_maintenance_date: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
        await OfflineDataManager.updateEquipment(updatedEquipment);
      }

      return true;
    } catch (error) {
      console.error('Error completing preventive maintenance:', error);
      return false;
    }
  }

  // Helper methods
  private getNextBusinessDay(): Date {
    const now = new Date();
    const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // Skip weekends (0 = Sunday, 6 = Saturday)
    while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
      nextDay.setDate(nextDay.getDate() + 1);
    }
    
    return nextDay;
  }

  private getEstimatedHoursForClass(maintenanceClass: 'A' | 'B' | 'C'): number {
    switch (maintenanceClass) {
      case 'A': return 2;
      case 'B': return 4;
      case 'C': return 8;
      default: return 2;
    }
  }

  private getDefaultMaterialsForClass(maintenanceClass: 'A' | 'B' | 'C'): string[] {
    switch (maintenanceClass) {
      case 'A':
        return ['Oil Filter', 'Air Filter', 'Engine Oil'];
      case 'B':
        return ['Oil Filter', 'Air Filter', 'Engine Oil', 'Fuel Filter', 'Hydraulic Oil'];
      case 'C':
        return ['Oil Filter', 'Air Filter', 'Engine Oil', 'Fuel Filter', 'Hydraulic Oil', 'Transmission Oil', 'Coolant'];
      default:
        return ['Oil Filter', 'Engine Oil'];
    }
  }

  // Get maintenance statistics
  async getMaintenanceStatistics(): Promise<{
    totalEquipment: number;
    equipmentNeedingMaintenance: number;
    overdueMaintenance: number;
    upcomingMaintenance: number;
    averageUsageHours: number;
  }> {
    try {
      const usageData = await this.getAllEquipmentUsageData();
      const overdueSchedules = await this.getOverdueMaintenanceSchedules();
      const upcomingSchedules = await this.getUpcomingMaintenanceSchedules(7);

      const equipmentNeedingMaintenance = usageData.filter(u => u.is_overdue || u.hours_until_next_maintenance < 10).length;
      const averageUsageHours = usageData.length > 0 
        ? usageData.reduce((sum, u) => sum + u.total_usage_hours, 0) / usageData.length 
        : 0;

      return {
        totalEquipment: usageData.length,
        equipmentNeedingMaintenance,
        overdueMaintenance: overdueSchedules.length,
        upcomingMaintenance: upcomingSchedules.length,
        averageUsageHours: Math.round(averageUsageHours * 100) / 100
      };
    } catch (error) {
      console.error('Error getting maintenance statistics:', error);
      return {
        totalEquipment: 0,
        equipmentNeedingMaintenance: 0,
        overdueMaintenance: 0,
        upcomingMaintenance: 0,
        averageUsageHours: 0
      };
    }
  }
}

// Export singleton instance
export const preventiveMaintenanceService = PreventiveMaintenanceService.getInstance(); 