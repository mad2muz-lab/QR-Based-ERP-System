import { supabase } from './supabaseClient';
import { 
  EquipmentMaintenanceLog, 
  EquipmentMaintenanceSchedule, 
  Notification, 
  UserRole, 
  PageAccess,
  Equipment 
} from '../types';
import { AuthManager } from './authUtils';

export class EquipmentMaintenanceService {
  // Equipment Maintenance Logs
  static async createMaintenanceLog(log: Omit<EquipmentMaintenanceLog, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: EquipmentMaintenanceLog; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    
    try {
      const { data, error } = await supabase
        .from('equipment_maintenance_logs')
        .insert([log])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating maintenance log:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateMaintenanceLog(id: string, updates: Partial<EquipmentMaintenanceLog>): Promise<{ success: boolean; data?: EquipmentMaintenanceLog; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    
    try {
      const { data, error } = await supabase
        .from('equipment_maintenance_logs')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error updating maintenance log:', error);
      return { success: false, error: error.message };
    }
  }

  static async getMaintenanceLogs(equipmentId?: string): Promise<{ success: boolean; data?: EquipmentMaintenanceLog[]; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    
    try {
      let query = supabase
        .from('equipment_maintenance_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (equipmentId) {
        query = query.eq('equipment_id', equipmentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error fetching maintenance logs:', error);
      return { success: false, error: error.message };
    }
  }

  // Equipment Status Management
  static async updateEquipmentOperationalStatus(equipmentId: string, status: Equipment['operational_status']): Promise<{ success: boolean; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    
    try {
      const { error } = await supabase
        .from('equipment')
        .update({ 
          operational_status: status,
          last_updated: new Date().toISOString()
        })
        .eq('id', equipmentId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error updating equipment status:', error);
      return { success: false, error: error.message };
    }
  }

  // Maintenance Schedules
  static async createMaintenanceSchedule(schedule: Omit<EquipmentMaintenanceSchedule, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: EquipmentMaintenanceSchedule; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    
    try {
      const { data, error } = await supabase
        .from('equipment_maintenance_schedules')
        .insert([schedule])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating maintenance schedule:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateMaintenanceSchedule(id: string, updates: Partial<EquipmentMaintenanceSchedule>): Promise<{ success: boolean; data?: EquipmentMaintenanceSchedule; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    
    try {
      const { data, error } = await supabase
        .from('equipment_maintenance_schedules')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error updating maintenance schedule:', error);
      return { success: false, error: error.message };
    }
  }

  static async getMaintenanceSchedules(equipmentId?: string): Promise<{ success: boolean; data?: EquipmentMaintenanceSchedule[]; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    
    try {
      let query = supabase
        .from('equipment_maintenance_schedules')
        .select('*')
        .eq('is_active', true)
        .order('next_maintenance_date', { ascending: true });

      if (equipmentId) {
        query = query.eq('equipment_id', equipmentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error fetching maintenance schedules:', error);
      return { success: false, error: error.message };
    }
  }

  // Notifications
  static async createNotification(notification: Omit<Notification, 'id' | 'created_at'>): Promise<{ success: boolean; data?: Notification; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([notification])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating notification:', error);
      return { success: false, error: error.message };
    }
  }

  static async getNotifications(userId: string): Promise<{ success: boolean; data?: Notification[]; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      return { success: false, error: error.message };
    }
  }

  static async markNotificationAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }
  }

  // User Roles and Permissions
  static async getUserRoles(userId: string): Promise<{ success: boolean; data?: UserRole[]; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error fetching user roles:', error);
      return { success: false, error: error.message };
    }
  }

  static async assignUserRole(role: Omit<UserRole, 'id' | 'assigned_at'>): Promise<{ success: boolean; data?: UserRole; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .upsert([role], { onConflict: 'user_id,role' })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error assigning user role:', error);
      return { success: false, error: error.message };
    }
  }

  static async getPageAccess(userId: string): Promise<{ success: boolean; data?: PageAccess[]; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    
    try {
      const { data, error } = await supabase
        .from('page_access')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error fetching page access:', error);
      return { success: false, error: error.message };
    }
  }

  static async updatePageAccess(access: Omit<PageAccess, 'id' | 'assigned_at'>): Promise<{ success: boolean; data?: PageAccess; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    
    try {
      const { data, error } = await supabase
        .from('page_access')
        .upsert([access], { onConflict: 'user_id,page_name' })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error updating page access:', error);
      return { success: false, error: error.message };
    }
  }

  // Utility functions
  static async checkUserPermission(userId: string, pageName: string, permission: 'access' | 'edit' | 'delete'): Promise<boolean> {
    const { success, data } = await this.getPageAccess(userId);
    if (!success || !data) return false;

    const pageAccess = data.find(pa => pa.page_name === pageName);
    if (!pageAccess) return false;

    switch (permission) {
      case 'access': return pageAccess.can_access;
      case 'edit': return pageAccess.can_edit;
      case 'delete': return pageAccess.can_delete;
      default: return false;
    }
  }

  static async getUserRole(userId: string): Promise<string | null> {
    const { success, data } = await this.getUserRoles(userId);
    if (!success || !data || data.length === 0) return null;
    
    // Return the highest priority role
    const rolePriority = { 'admin': 4, 'manager': 3, 'technician': 2, 'viewer': 1 };
    const highestRole = data.reduce((prev, current) => 
      rolePriority[current.role] > rolePriority[prev.role] ? current : prev
    );
    
    return highestRole.role;
  }

  // Equipment workflow functions
  static async handleEquipmentStatusChange(equipmentId: string, newStatus: Equipment['operational_status'], maintenanceData?: {
    maintenance_type: 'repair' | 'service';
    repair_type?: 'on_site' | 'yard_repair';
    service_type?: 'type_a' | 'type_b' | 'type_c';
    description?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // Update equipment operational status
      const statusResult = await this.updateEquipmentOperationalStatus(equipmentId, newStatus);
      if (!statusResult.success) return statusResult;

      // If status is 'not_working' and maintenance data is provided, create maintenance log
      if (newStatus === 'not_working' && maintenanceData) {
        const currentUser = AuthManager.getCurrentUserSync();
        const maintenanceLog = {
          equipment_id: equipmentId,
          maintenance_type: maintenanceData.maintenance_type,
          repair_type: maintenanceData.repair_type,
          service_type: maintenanceData.service_type,
          status: 'scheduled' as const,
          description: maintenanceData.description,
          start_date: new Date().toISOString(),
          completed_by: currentUser?.id
        };

        const logResult = await this.createMaintenanceLog(maintenanceLog);
        if (!logResult.success) {
          console.error('Failed to create maintenance log:', logResult.error);
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error handling equipment status change:', error);
      return { success: false, error: error.message };
    }
  }

  static async completeMaintenance(maintenanceLogId: string, completionData: {
    actual_duration_hours?: number;
    cost?: number;
    technician_notes?: string;
    parts_used?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const currentUser = AuthManager.getCurrentUserSync();
      const updates = {
        ...completionData,
        status: 'completed' as const,
        completion_date: new Date().toISOString(),
        completed_by: currentUser?.id
      };

      const result = await this.updateMaintenanceLog(maintenanceLogId, updates);
      if (!result.success) return result;

      // The database trigger will automatically update equipment status to 'working'
      return { success: true };
    } catch (error: any) {
      console.error('Error completing maintenance:', error);
      return { success: false, error: error.message };
    }
  }
} 