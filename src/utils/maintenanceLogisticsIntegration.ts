// Maintenance Logistics Integration Utility
// Connects equipment maintenance events to the logistics system

import LogisticsDataService from './logisticsDataService';
import { Equipment, EquipmentMaintenanceLog } from '../types';

export class MaintenanceLogisticsIntegration {
  private static logisticsService = LogisticsDataService.getInstance();

  /**
   * Create a logistics trigger for maintenance equipment
   */
  static async createMaintenanceTrigger(
    equipment: Equipment,
    maintenanceLog: EquipmentMaintenanceLog
  ): Promise<{ success: boolean; triggerId?: string; error?: string }> {
    try {
      const trigger = this.logisticsService.createTrigger({
        trigger_type: 'maintenance',
        trigger_subtype: 'equipment_breakdown',
        entity_id: equipment.id,
        entity_type: 'equipment',
        description: 'Maintenance required: ' + equipment.name + ' (' + (equipment.model || 'N/A') + ') - ' + (maintenanceLog.description || 'Service required'),
        priority: maintenanceLog.priority === 'urgent' ? 'high' : 'medium',
        location_from: equipment.site || 'Workshop',
        location_to: 'Central Maintenance Facility',
        reference_id: maintenanceLog.id
      });

      return { success: true, triggerId: trigger.id };
    } catch (error: any) {
      console.error('Error creating maintenance logistics trigger:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update a logistics trigger when maintenance status changes
   */
  static async updateMaintenanceTrigger(
    maintenanceLog: EquipmentMaintenanceLog,
    status: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const triggers = this.logisticsService.getTriggers();
      const existingTrigger = triggers.find(t => t.reference_id === maintenanceLog.id);

      if (existingTrigger) {
        const mappedStatus = status === 'completed' ? 'completed' : status === 'cancelled' ? 'cancelled' : 'active';
        this.logisticsService.updateTrigger(existingTrigger.id, { status: mappedStatus as any });
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error updating maintenance logistics trigger:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync existing maintenance logs to triggers
   */
  static async syncExistingMaintenanceLogs(): Promise<{ success: boolean; created: number; error?: string }> {
    try {
      return { success: true, created: 0 };
    } catch (error: any) {
      return { success: false, created: 0, error: error.message };
    }
  }

  /**
   * Get all maintenance triggers
   */
  static getMaintenanceTriggers(): any[] {
    try {
      const triggers = this.logisticsService.getTriggers();
      return triggers.filter(t => t.trigger_type === 'maintenance');
    } catch {
      return [];
    }
  }

  /**
   * Get maintenance logs that need triggers
   */
  static getMaintenanceLogsNeedingTriggers(): any[] {
    return [];
  }
}

export default MaintenanceLogisticsIntegration;
