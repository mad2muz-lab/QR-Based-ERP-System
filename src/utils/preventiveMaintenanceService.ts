import { supabase } from './supabaseClient';
import { createPMNotification } from './notificationService';

// Enhanced types for automatic scheduling
export type PreventiveMaintenanceLog = {
  id: string;
  equipment_id: string;
  preventive_type_id: string;
  scheduled_date: string;
  completed_date?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue';
  technician_id?: string;
  checklist_completed?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  maintenance_class?: string;
  maintenance_type?: string;
  completed_date?: string;
};

export type PreventiveMaintenanceType = {
  id: string;
  name: string;
  description: string;
  checklist_items: any;
  spare_parts: any;
};

export type EquipmentUsage = {
  equipment_id: string;
  total_hours: number;
  total_km: number;
  last_usage_date: string;
  days_since_last_maintenance: number;
};

export type PMSchedule = {
  equipment_id: string;
  equipment_name: string;
  equipment_type: string;
  maintenance_class: string;
  current_usage_hours: number;
  threshold_hours: number;
  days_overdue: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  scheduled_date: string;
  estimated_duration: number;
  technician_id?: string;
};

class PreventiveMaintenanceService {
  private static instance: PreventiveMaintenanceService;

  private constructor() {}

  static getInstance(): PreventiveMaintenanceService {
    if (!PreventiveMaintenanceService.instance) {
      PreventiveMaintenanceService.instance = new PreventiveMaintenanceService();
    }
    return PreventiveMaintenanceService.instance;
  }

  // Calculate equipment usage from time logs
  async calculateEquipmentUsage(equipmentId: string): Promise<EquipmentUsage> {
    try {
      // Get equipment logs for usage calculation
      const { data: equipmentLogs, error: logsError } = await supabase
        .from('equipment_logs')
        .select('*')
        .eq('equipment_id', equipmentId)
        .order('created_at', { ascending: false });

      if (logsError) throw logsError;

      let totalHours = 0;
      let totalKm = 0;
      let lastUsageDate = '';

      // Calculate usage from logs
      if (equipmentLogs) {
        for (const log of equipmentLogs) {
          if (log.action === 'start-use') {
            // Find corresponding stop-use log
            const stopLog = equipmentLogs.find(l => 
              l.action === 'stop-use' && 
              l.created_at > log.created_at &&
              (!lastUsageDate || l.created_at > lastUsageDate)
            );

            if (stopLog) {
              const startTime = new Date(log.created_at);
              const stopTime = new Date(stopLog.created_at);
              const durationHours = (stopTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
              totalHours += durationHours;

              // Estimate km based on hours (rough calculation)
              totalKm += durationHours * 50; // Assuming 50 km/h average

              if (!lastUsageDate || stopLog.created_at > lastUsageDate) {
                lastUsageDate = stopLog.created_at;
              }
            }
          }
        }
      }

      // Get last maintenance date
      const { data: lastMaintenance } = await supabase
        .from('preventive_maintenance_logs')
        .select('completed_date')
        .eq('equipment_id', equipmentId)
        .eq('status', 'completed')
        .order('completed_date', { ascending: false })
        .limit(1)
        .single();

            const daysSinceLastMaintenance = lastMaintenance?.completed_date
        ? Math.floor((new Date().getTime() - new Date(lastMaintenance.completed_date).getTime()) / (1000 * 60 * 60 * 24))
        : 365; // Default to 1 year if no previous maintenance

      return {
        equipment_id: equipmentId,
        total_hours: Math.round(totalHours * 100) / 100,
        total_km: Math.round(totalKm),
        last_usage_date: lastUsageDate,
        days_since_last_maintenance: daysSinceLastMaintenance
      };
    } catch (error) {
      console.error('Error calculating equipment usage:', error);
      return {
        equipment_id: equipmentId,
        total_hours: 0,
        total_km: 0,
        last_usage_date: '',
        days_since_last_maintenance: 365
      };
    }
  }

  // Generate automatic PM schedules for all enrolled equipment
  async generateAutomaticSchedules(): Promise<PMSchedule[]> {
    try {
      // Get all equipment enrolled in PM
      const { data: enrolledEquipment, error: equipmentError } = await supabase
        .from('equipment')
        .select('*')
        .eq('is_pm', true);

      if (equipmentError) throw equipmentError;

      const schedules: PMSchedule[] = [];

      for (const equipment of enrolledEquipment || []) {
        // Get PM configurations for this equipment type
        const { data: pmConfigs, error: configError } = await supabase
          .from('preventive_maintenance_configs')
          .select('*')
          .eq('equipment_type', equipment.type);

        if (configError) continue;

        // Calculate current usage
        const usage = await this.calculateEquipmentUsage(equipment.id);

        // Check each maintenance class
        for (const config of pmConfigs || []) {
          const thresholdHours = config.class_a_threshold_hours || 
                                config.class_b_threshold_hours || 
                                config.class_c_threshold_hours || 0;

          const maintenanceClass = config.maintenance_class || 'Class A';
          const intervalDays = config.interval_days || 30;

          // Check if maintenance is due
          const isDueByHours = usage.total_hours >= thresholdHours;
          const isDueByDays = usage.days_since_last_maintenance >= intervalDays;

          if (isDueByHours || isDueByDays) {
            // Calculate priority
            let priority: 'low' | 'medium' | 'high' | 'critical' = 'low';
            const daysOverdue = Math.max(0, usage.days_since_last_maintenance - intervalDays);
            
            if (daysOverdue > 30) priority = 'critical';
            else if (daysOverdue > 14) priority = 'high';
            else if (daysOverdue > 7) priority = 'medium';

            // Calculate scheduled date
            const scheduledDate = new Date();
            if (daysOverdue > 0) {
              scheduledDate.setDate(scheduledDate.getDate() + 1); // Schedule for tomorrow if overdue
            } else {
              scheduledDate.setDate(scheduledDate.getDate() + 7); // Schedule for next week if due soon
            }

            // Estimate duration based on maintenance class
            let estimatedDuration = 2; // Default 2 hours
            switch (maintenanceClass) {
              case 'Class A': estimatedDuration = 2; break;
              case 'Class B': estimatedDuration = 4; break;
              case 'Class C': estimatedDuration = 8; break;
              case 'Routine': estimatedDuration = 1; break;
            }

            schedules.push({
              equipment_id: equipment.id,
              equipment_name: equipment.name,
              equipment_type: equipment.type,
              maintenance_class: maintenanceClass,
              current_usage_hours: usage.total_hours,
              threshold_hours: thresholdHours,
              days_overdue: daysOverdue,
              priority,
              scheduled_date: scheduledDate.toISOString().split('T')[0],
              estimated_duration: estimatedDuration
            });
          }
        }
      }

      return schedules.sort((a, b) => {
        // Sort by priority first, then by days overdue
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority];
        const bPriority = priorityOrder[b.priority];
        
        if (aPriority !== bPriority) return bPriority - aPriority;
        return b.days_overdue - a.days_overdue;
      });

    } catch (error) {
      console.error('Error generating automatic schedules:', error);
      return [];
    }
  }

  // Create PM logs from generated schedules
  async createPMLogsFromSchedules(schedules: PMSchedule[]): Promise<{ success: number; errors: number }> {
    let success = 0;
    let errors = 0;

    for (const schedule of schedules) {
      try {
        // Check if PM log already exists for this equipment and class
        const { data: existingLog } = await supabase
          .from('preventive_maintenance_logs')
          .select('id')
          .eq('equipment_id', schedule.equipment_id)
          .eq('maintenance_class', schedule.maintenance_class)
          .in('status', ['scheduled', 'in_progress'])
          .single();

        if (existingLog) {
          // Update existing log if it's overdue
          if (schedule.days_overdue > 0) {
            await this.updateLog(existingLog.id, {
              scheduled_date: schedule.scheduled_date,
              status: 'overdue'
            });
          }
          continue;
        }

        // Create new PM log
        const { error } = await this.createLog({
          equipment_id: schedule.equipment_id,
          preventive_type_id: `${schedule.equipment_type}_${schedule.maintenance_class}`,
          scheduled_date: schedule.scheduled_date,
          status: schedule.days_overdue > 0 ? 'overdue' : 'scheduled',
          maintenance_class: schedule.maintenance_class,
          maintenance_type: 'preventive'
        });

        if (error) {
          console.error('Error creating PM log:', error);
          errors++;
        } else {
          success++;
        }
      } catch (error) {
        console.error('Error processing schedule:', error);
        errors++;
      }
    }

    return { success, errors };
  }

  // Get overdue PM logs
  async getOverduePMLogs(): Promise<PreventiveMaintenanceLog[]> {
    try {
      const { data, error } = await supabase
        .from('preventive_maintenance_logs')
        .select('*')
        .in('status', ['scheduled', 'overdue'])
        .lt('scheduled_date', new Date().toISOString().split('T')[0])
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching overdue PM logs:', error);
      return [];
    }
  }

  // Get PM statistics
  async getPMStatistics(): Promise<{
    total_scheduled: number;
    total_overdue: number;
    total_completed: number;
    completion_rate: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('preventive_maintenance_logs')
        .select('status');

      if (error) throw error;

      const stats = {
        total_scheduled: 0,
        total_overdue: 0,
        total_completed: 0,
        completion_rate: 0
      };

      data?.forEach(log => {
        switch (log.status) {
          case 'scheduled': stats.total_scheduled++; break;
          case 'overdue': stats.total_overdue++; break;
          case 'completed': stats.total_completed++; break;
        }
      });

      const total = stats.total_scheduled + stats.total_overdue + stats.total_completed;
      stats.completion_rate = total > 0 ? Math.round((stats.total_completed / total) * 100) : 0;

      return stats;
    } catch (error) {
      console.error('Error fetching PM statistics:', error);
      return {
        total_scheduled: 0,
        total_overdue: 0,
        total_completed: 0,
        completion_rate: 0
      };
    }
  }

  // Create a new preventive maintenance log
  async createLog(log: Omit<PreventiveMaintenanceLog, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: any; error: any }> {
    const { data, error } = await supabase
      .from('preventive_maintenance_logs')
      .insert([
        {
          ...log,
          status: log.status || 'scheduled',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select();
    // Notify technician if assigned
    if (!error && data && log.technician_id) {
      await createPMNotification({
        userId: log.technician_id,
        title: 'New Preventive Maintenance Task Assigned',
        message: `You have been assigned a preventive maintenance task (type: ${log.preventive_type_id}) scheduled for ${log.scheduled_date}.`,
        entityId: data[0]?.id || '',
        actionUrl: '/pm/dashboard',
        type: 'maintenance',
        entityType: 'equipment',
      });
    }
    return { data, error };
  }

  // Get all preventive maintenance logs for an equipment
  async getLogsForEquipment(equipmentId: string): Promise<{ data: PreventiveMaintenanceLog[]; error: any }> {
    const { data, error } = await supabase
      .from('preventive_maintenance_logs')
      .select('*')
      .eq('equipment_id', equipmentId)
      .order('scheduled_date', { ascending: false });
    return { data, error };
  }

  // Update a preventive maintenance log (e.g., mark as completed)
  async updateLog(logId: string, update: Partial<PreventiveMaintenanceLog>): Promise<{ data: any; error: any }> {
    const { data, error } = await supabase
      .from('preventive_maintenance_logs')
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq('id', logId)
      .select();
    return { data, error };
  }

  // Get checklist and spare parts for a preventive maintenance type
  async getTypeDetails(typeId: string): Promise<{ data: PreventiveMaintenanceType | null; error: any }> {
    const { data, error } = await supabase
      .from('preventive_maintenance_types')
      .select('id, name, description, checklist_items, spare_parts')
      .eq('id', typeId)
      .single();
    return { data, error };
  }
}

export const preventiveMaintenanceService = PreventiveMaintenanceService.getInstance(); 