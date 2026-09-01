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
        oldId: employee.old_id // Map old_id to oldId
      }));
      
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
        oldId: equipment.old_id // Map old_id to oldId
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
        oldId: material.old_id // Map old_id to oldId
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
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('created_at', { ascending: false });
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

  static async createEquipment(equipment: any): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    try {
      // Ensure required fields are present
      const safeEquipment = {
        ...equipment,
        model: equipment.model || 'UNKNOWN_MODEL',
        site: equipment.site || 'UNKNOWN_SITE',
        qr_code: equipment.qr_code || equipment.qrCode || equipment.custom_equipment_id || equipment.id || 'UNKNOWN_QR',
      };
      const { data, error } = await supabase
        .from('equipment')
        .insert([safeEquipment])
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating equipment:', error);
      return { success: false, error: error.message };
    }
  }

  static async createMaintenanceSchedule(schedule: any): Promise<{ success: boolean; data?: any; error?: string }> {
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
}

export async function getPreventiveMaintenanceConfigsForEquipment(equipmentId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('preventive_maintenance_configs')
    .select('*')
    .eq('equipment_id', equipmentId);
  if (error) {
    console.error('Error fetching preventive maintenance configs:', error);
    return [];
  }
  return data;
}

export async function getPreventiveMaintenanceLogs(equipmentId?: string) {
  if (!supabase) return [];
  let query = supabase.from('preventive_maintenance_logs').select('*');
  if (equipmentId) {
    query = query.eq('equipment_id', equipmentId);
  }
  const { data, error } = await query;
  if (error) {
    console.error('Error fetching preventive maintenance logs:', error);
    return [];
  }
  return data;
}