import { supabase } from './supabaseClient';
import { Employee, Equipment, Material, Site, TimeLog, User, Department } from '../types';

export class SupabaseDataService {
  // Fetch all employees from Supabase
  static async getEmployees(): Promise<Employee[]> {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching employees:', error);
        return [];
      }
      
      // Transform snake_case to camelCase for Employee interface
      const transformedData: Employee[] = (data || []).map(employee => ({
        ...employee,
        lastUpdated: employee.last_updated,
        bloodGroup: employee.blood_group,
        createdAt: employee.created_at,
        qrCode: employee.qr_code,
        oldId: employee.old_id, // Map old_id to oldId
        hourlyRate: employee.hourly_rate // Map hourly_rate to hourlyRate
      }));
      
      console.log('🔍 SupabaseDataService - Raw employee data from DB:', data);
      console.log('🔍 SupabaseDataService - Transformed employee data:', transformedData);
      console.log('🔍 SupabaseDataService - Sample employee hourlyRate:', transformedData[0]?.hourlyRate, typeof transformedData[0]?.hourlyRate);
      
      return transformedData;
    } catch (error) {
      console.error('Error fetching employees:', error);
      return [];
    }
  }
  
  // Fetch all equipment from Supabase
  static async getEquipment(): Promise<Equipment[]> {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching equipment:', error);
        return [];
      }
      
      // Transform snake_case to camelCase for Equipment interface
      const transformedData: Equipment[] = (data || []).map(equipment => ({
        ...equipment,
        lastUpdated: equipment.last_updated,
        oldId: equipment.old_id, // Map old_id to oldId
        hourly_rate: equipment.hourly_rate // Ensure hourly_rate is preserved
      }));
      
      return transformedData;
    } catch (error) {
      console.error('Error fetching equipment:', error);
      return [];
    }
  }
  
  // Fetch all materials from Supabase
  static async getMaterials(): Promise<Material[]> {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching materials:', error);
        return [];
      }
      
      // Transform snake_case to camelCase for Material interface
      const transformedData: Material[] = (data || []).map(material => ({
        ...material,
        lastUpdated: material.last_updated,
        createdAt: material.created_at || material.createdAt,
        qrCode: material.qr_code,
        accessLevel: material.access_level,
        oldId: material.old_id, // Map old_id to oldId
        cost: material.cost !== undefined ? Number(material.cost) : undefined // Ensure cost is a number
      }));
      
      return transformedData;
    } catch (error) {
      console.error('Error fetching materials:', error);
      return [];
    }
  }
  
  // Fetch all sites from Supabase
  static async getSites(): Promise<Site[]> {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .order('last_updated', { ascending: false });
      
      if (error) {
        console.error('Error fetching sites:', error);
        return [];
      }
      
      // Transform snake_case to camelCase for Site interface
      const transformedData: Site[] = (data || []).map(site => {
        // Parse PostgreSQL POINT format back to coordinates array
        let coordinates: [number, number] = [0, 0];
        if (site.coordinates && typeof site.coordinates === 'string') {
          // PostgreSQL POINT format: "(longitude,latitude)"
          const match = site.coordinates.match(/\(([^,]+),([^)]+)\)/);
          if (match) {
            coordinates = [parseFloat(match[1]), parseFloat(match[2])];
          }
        }
        
        const transformedSite = {
          ...site,
          coordinates,
          lastUpdated: site.last_updated
        };
        delete (transformedSite as any).last_updated;
        return transformedSite;
      });
      
      return transformedData;
    } catch (error) {
      console.error('Error fetching sites:', error);
      return [];
    }
  }
  
  // Fetch all time logs from Supabase
  static async getTimeLogs(): Promise<TimeLog[]> {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('time_logs')
        .select('*')
        .order('timestamp', { ascending: false });
      
      if (error) {
        console.error('Error fetching time logs:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching time logs:', error);
      return [];
    }
  }

  // Fetch employee logs from Supabase
  static async getEmployeeLogs(): Promise<any[]> {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('employee_logs')
        .select('*')
        .order('timestamp', { ascending: false });
      
      if (error) {
        console.error('Error fetching employee logs:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching employee logs:', error);
      return [];
    }
  }

  // Fetch equipment logs from Supabase
  static async getEquipmentLogs(): Promise<any[]> {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('equipment_logs')
        .select('*')
        .order('timestamp', { ascending: false });
      
      if (error) {
        console.error('Error fetching equipment logs:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching equipment logs:', error);
      return [];
    }
  }

  // Fetch material logs from Supabase
  static async getMaterialLogs(): Promise<any[]> {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('material_logs')
        .select('*')
        .order('timestamp', { ascending: false });
      
      if (error) {
        console.error('Error fetching material logs:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching material logs:', error);
      return [];
    }
  }

  // Fetch all logs from separate tables
  static async getAllLogs(): Promise<{
    employeeLogs: any[];
    equipmentLogs: any[];
    materialLogs: any[];
  }> {
    if (!supabase) {
      return {
        employeeLogs: [],
        equipmentLogs: [],
        materialLogs: []
      };
    }
    
    try {
      const [employeeLogs, equipmentLogs, materialLogs] = await Promise.all([
        this.getEmployeeLogs(),
        this.getEquipmentLogs(),
        this.getMaterialLogs()
      ]);
      
      return {
        employeeLogs,
        equipmentLogs,
        materialLogs
      };
    } catch (error) {
      console.error('Error fetching all logs:', error);
      return {
        employeeLogs: [],
        equipmentLogs: [],
        materialLogs: []
      };
    }
  }
  
  // Fetch all users from Supabase
  static async getUsers(): Promise<User[]> {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching users:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  // Fetch all departments from Supabase
  static async getDepartments(): Promise<Department[]> {
    if (!supabase) return [];
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('getDepartments timeout')), 10000); // 10 second timeout
      });
      
      const fetchPromise = supabase
        .from('departments')
        .select('*')
        .order('created_at', { ascending: false });
        
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (error) {
        console.error('Error fetching departments:', error);
        return [];
      }
      // Transform snake_case to camelCase for Department interface
      const transformedData: Department[] = (data || []).map((dept: any) => ({
        id: dept.id,
        name: dept.name,
        description: dept.description,
        createdAt: dept.created_at,
        lastUpdated: dept.last_updated || dept.created_at,
        type: dept.type || undefined,
      }));
      return transformedData;
    } catch (error) {
      console.error('Error fetching departments:', error);
      return [];
    }
  }

  // Create a new department in Supabase
  static async createDepartment(department: Omit<Department, 'id' | 'createdAt' | 'lastUpdated'>): Promise<{ success: boolean; data?: Department; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    
    try {
      const supabaseDepartment = {
        id: `dept-${Date.now()}`,
        name: department.name,
        description: department.description,
        type: department.type,
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('departments')
        .insert([supabaseDepartment])
        .select()
        .single();

      if (error) {
        console.error('Error creating department in Supabase:', error);
        return { success: false, error: error.message };
      }

      // Transform back to Department interface
      const transformedData: Department = {
        id: data.id,
        name: data.name,
        description: data.description,
        createdAt: data.created_at,
        lastUpdated: data.last_updated || data.created_at,
        type: data.type
      };

      return { success: true, data: transformedData };
    } catch (error: any) {
      console.error('Error creating department:', error);
      return { success: false, error: error.message };
    }
  }

  // Update an existing department in Supabase
  static async updateDepartment(department: Department): Promise<{ success: boolean; data?: Department; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    
    try {
      const supabaseDepartment = {
        name: department.name,
        description: department.description,
        type: department.type,
        last_updated: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('departments')
        .update(supabaseDepartment)
        .eq('id', department.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating department in Supabase:', error);
        return { success: false, error: error.message };
      }

      // Transform back to Department interface
      const transformedData: Department = {
        id: data.id,
        name: data.name,
        description: data.description,
        createdAt: data.created_at,
        lastUpdated: data.last_updated || data.created_at,
        type: data.type
      };

      return { success: true, data: transformedData };
    } catch (error: any) {
      console.error('Error updating department:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete a department from Supabase
  static async deleteDepartment(departmentId: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    
    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', departmentId);

      if (error) {
        console.error('Error deleting department from Supabase:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting department:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Test connection and get table counts
  static async getTableCounts(): Promise<{
    users: number;
    employees: number;
    equipment: number;
    materials: number;
    sites: number;
    timeLogs: number;
    employeeLogs: number;
    equipmentLogs: number;
    materialLogs: number;
  }> {
    if (!supabase) {
      return { 
        users: 0, 
        employees: 0, 
        equipment: 0, 
        materials: 0, 
        sites: 0, 
        timeLogs: 0,
        employeeLogs: 0,
        equipmentLogs: 0,
        materialLogs: 0
      };
    }
    
    try {
      const [usersResult, employeesResult, equipmentResult, materialsResult, sitesResult, timeLogsResult, empLogsResult, eqLogsResult, matLogsResult] = await Promise.all([
        supabase.from('users').select('count', { count: 'exact', head: true }),
        supabase.from('employees').select('count', { count: 'exact', head: true }),
        supabase.from('equipment').select('count', { count: 'exact', head: true }),
        supabase.from('materials').select('count', { count: 'exact', head: true }),
        supabase.from('sites').select('count', { count: 'exact', head: true }),
        supabase.from('time_logs').select('count', { count: 'exact', head: true }),
        supabase.from('employee_logs').select('count', { count: 'exact', head: true }),
        supabase.from('equipment_logs').select('count', { count: 'exact', head: true }),
        supabase.from('material_logs').select('count', { count: 'exact', head: true })
      ]);
      
      return {
        users: usersResult.count || 0,
        employees: employeesResult.count || 0,
        equipment: equipmentResult.count || 0,
        materials: materialsResult.count || 0,
        sites: sitesResult.count || 0,
        timeLogs: timeLogsResult.count || 0,
        employeeLogs: empLogsResult.count || 0,
        equipmentLogs: eqLogsResult.count || 0,
        materialLogs: matLogsResult.count || 0
      };
    } catch (error) {
      console.error('Error getting table counts:', error);
      return { 
        users: 0, 
        employees: 0, 
        equipment: 0, 
        materials: 0, 
        sites: 0, 
        timeLogs: 0,
        employeeLogs: 0,
        equipmentLogs: 0,
        materialLogs: 0
      };
    }
  }

  // Class Maintenance Types Operations
  static async getAllClassMaintenanceTypes(): Promise<any[]> {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('class_maintenance_types')
        .select('*')
        .order('maintenance_type');
      
      if (error) {
        console.error('Error fetching class maintenance types:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching class maintenance types:', error);
      return [];
    }
  }

  static async createClassMaintenanceType(classType: any): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }
    
    try {
      const { data, error } = await supabase
        .from('class_maintenance_types')
        .insert([classType])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating class maintenance type:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Error creating class maintenance type:', error);
      return { success: false, error: 'Failed to create class maintenance type' };
    }
  }

  static async updateClassMaintenanceType(id: string, classType: any): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }
    
    try {
      const { data, error } = await supabase
        .from('class_maintenance_types')
        .update(classType)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating class maintenance type:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Error updating class maintenance type:', error);
      return { success: false, error: 'Failed to update class maintenance type' };
    }
  }

  static async deleteClassMaintenanceType(id: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }
    
    try {
      const { error } = await supabase
        .from('class_maintenance_types')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting class maintenance type:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting class maintenance type:', error);
      return { success: false, error: 'Failed to delete class maintenance type' };
    }
  }

  // Maintenance Material Request Operations
  static async getAllMaintenanceMaterialRequests(): Promise<any[]> {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('maintenance_material_requests')
        .select('*')
        .order('requested_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching maintenance material requests:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching maintenance material requests:', error);
      return [];
    }
  }

  static async createMaintenanceMaterialRequest(requestData: any): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }
    
    try {
      const { data, error } = await supabase
        .from('maintenance_material_requests')
        .insert([requestData])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating maintenance material request:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Error creating maintenance material request:', error);
      return { success: false, error: 'Failed to create maintenance material request' };
    }
  }

  static async updateMaintenanceMaterialRequest(requestId: string, updateData: any): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }
    
    try {
      const { data, error } = await supabase
        .from('maintenance_material_requests')
        .update(updateData)
        .eq('id', requestId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating maintenance material request:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Error updating maintenance material request:', error);
      return { success: false, error: 'Failed to update maintenance material request' };
    }
  }

  // Maintenance Material Request Item Operations
  static async getAllMaintenanceMaterialRequestItems(): Promise<any[]> {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('maintenance_material_request_items')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching maintenance material request items:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching maintenance material request items:', error);
      return [];
    }
  }

  static async createMaintenanceMaterialRequestItem(itemData: any): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }
    
    try {
      const { data, error } = await supabase
        .from('maintenance_material_request_items')
        .insert([itemData])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating maintenance material request item:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Error creating maintenance material request item:', error);
      return { success: false, error: 'Failed to create maintenance material request item' };
    }
  }

  static async updateMaintenanceMaterialRequestItem(itemId: string, updateData: any): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }
    
    try {
      const { data, error } = await supabase
        .from('maintenance_material_request_items')
        .update(updateData)
        .eq('id', itemId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating maintenance material request item:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Error updating maintenance material request item:', error);
      return { success: false, error: 'Failed to update maintenance material request item' };
    }
  }

  // Time Logs Operations
  static async getAllTimeLogs(): Promise<any[]> {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('time_logs')
        .select('*')
        .order('timestamp', { ascending: false });
      
      if (error) {
        console.error('Error fetching time logs:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching time logs:', error);
      return [];
    }
  }

  // Materials Operations
  static async getAllMaterials(): Promise<any[]> {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching materials:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching materials:', error);
      return [];
    }
  }

  /**
   * Clear all notifications for a specific user or role
   * @param userId - The user ID to clear notifications for
   * @param role - The role to clear notifications for
   * @returns Promise<boolean> - Success status
   */
  static async clearAllNotifications(userId?: string, role?: string): Promise<boolean> {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return false;
      }

      let query = supabase.from('notifications').delete();
      
      if (userId && role) {
        // Clear notifications for specific user OR role
        query = query.or(`user_id.eq.${userId},role.eq.${role}`);
      } else if (userId) {
        // Clear notifications for specific user only
        query = query.eq('user_id', userId);
      } else if (role) {
        // Clear notifications for specific role only
        query = query.eq('role', role);
      } else {
        // Clear all notifications (admin only)
        console.warn('Clearing all notifications - this should only be done by admin users');
      }

      const { error } = await query;
      
      if (error) {
        console.error('Error clearing notifications:', error);
        return false;
      }

      console.log('All notifications cleared successfully');
      return true;
    } catch (error) {
      console.error('Error clearing notifications:', error);
      return false;
    }
  }
}