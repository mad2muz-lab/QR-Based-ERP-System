import { supabase } from './supabaseClient';
import { Employee, Equipment, Material, Site, TimeLog, User } from '../types';

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
        lastUpdated: employee.last_updated
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
        lastUpdated: equipment.last_updated
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
        lastUpdated: material.last_updated
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
        .order('created_at', { ascending: false });
      
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
  
  // Test connection and get table counts
  static async getTableCounts(): Promise<{
    users: number;
    employees: number;
    equipment: number;
    materials: number;
    sites: number;
    timeLogs: number;
  }> {
    if (!supabase) {
      return { users: 0, employees: 0, equipment: 0, materials: 0, sites: 0, timeLogs: 0 };
    }
    
    try {
      const [usersResult, employeesResult, equipmentResult, materialsResult, sitesResult, timeLogsResult] = await Promise.all([
        supabase.from('users').select('count', { count: 'exact', head: true }),
        supabase.from('employees').select('count', { count: 'exact', head: true }),
        supabase.from('equipment').select('count', { count: 'exact', head: true }),
        supabase.from('materials').select('count', { count: 'exact', head: true }),
        supabase.from('sites').select('count', { count: 'exact', head: true }),
        supabase.from('time_logs').select('count', { count: 'exact', head: true })
      ]);
      
      return {
        users: usersResult.count || 0,
        employees: employeesResult.count || 0,
        equipment: equipmentResult.count || 0,
        materials: materialsResult.count || 0,
        sites: sitesResult.count || 0,
        timeLogs: timeLogsResult.count || 0
      };
    } catch (error) {
      console.error('Error getting table counts:', error);
      return { users: 0, employees: 0, equipment: 0, materials: 0, sites: 0, timeLogs: 0 };
    }
  }
}