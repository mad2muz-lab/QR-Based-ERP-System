import { supabase } from './supabaseClient';
import { Employee, Equipment, Material, Site } from '../types';
import { AuthManager } from './authUtils';

export class SupabaseRegistrationService {
  // Employee Operations
  static async createEmployee(employee: Employee): Promise<{ success: boolean; data?: Employee; error?: string }> {
    if (!supabase || !AuthManager.useSupabase()) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }

    try {
      // Transform camelCase to snake_case for Supabase
      const supabaseEmployee = {
        ...employee,
        last_updated: employee.lastUpdated,
        blood_group: employee.bloodGroup,
        created_at: employee.createdAt,
        qr_code: employee.id // Use the full employee ID (already includes EMP- prefix)
      };
      delete (supabaseEmployee as any).lastUpdated;
      delete (supabaseEmployee as any).bloodGroup;
      delete (supabaseEmployee as any).createdAt;
      delete (supabaseEmployee as any).qrCode;

      const { data, error } = await supabase
        .from('employees')
        .insert([supabaseEmployee])
        .select()
        .single();

      if (error) {
        console.error('Error creating employee in Supabase:', error);
        return { success: false, error: error.message };
      }

      // Transform snake_case back to camelCase
      const transformedData: Employee = {
        ...data,
        lastUpdated: data.last_updated,
        qrCode: data.id // QR code uses the full ID
      };
      delete (transformedData as any).last_updated;

      return { success: true, data: transformedData };
    } catch (error) {
      console.error('Error creating employee:', error);
      return { success: false, error: 'Failed to create employee' };
    }
  }

  static async updateEmployee(employee: Employee): Promise<{ success: boolean; data?: Employee; error?: string }> {
    if (!supabase || !AuthManager.useSupabase()) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }

    try {
      // Transform camelCase to snake_case for Supabase
      const supabaseEmployee = {
        ...employee,
        last_updated: employee.lastUpdated,
        blood_group: employee.bloodGroup,
        created_at: employee.createdAt,
        qr_code: employee.qrCode
      };
      delete (supabaseEmployee as any).lastUpdated;
      delete (supabaseEmployee as any).bloodGroup;
      delete (supabaseEmployee as any).createdAt;
      delete (supabaseEmployee as any).qrCode;

      const { data, error } = await supabase
        .from('employees')
        .update(supabaseEmployee)
        .eq('id', employee.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating employee in Supabase:', error);
        return { success: false, error: error.message };
      }

      // Transform snake_case back to camelCase
      const transformedData: Employee = {
        ...data,
        lastUpdated: data.last_updated
      };
      delete (transformedData as any).last_updated;

      return { success: true, data: transformedData };
    } catch (error) {
      console.error('Error updating employee:', error);
      return { success: false, error: 'Failed to update employee' };
    }
  }

  static async deleteEmployee(employeeId: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase || !AuthManager.useSupabase()) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }

    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employeeId);

      if (error) {
        console.error('Error deleting employee in Supabase:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting employee:', error);
      return { success: false, error: 'Failed to delete employee' };
    }
  }

  // Equipment Operations
  static async createEquipment(equipment: Equipment): Promise<{ success: boolean; data?: Equipment; error?: string }> {
    if (!supabase || !AuthManager.useSupabase()) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }

    try {
      // Transform camelCase to snake_case for Supabase
      const supabaseEquipment = {
        ...equipment,
        created_at: equipment.createdAt,
        last_updated: equipment.lastUpdated,
        serial_number: equipment.serialNumber,
        qr_code: equipment.qrCode || equipment.id // Use qrCode if available, otherwise use ID
      };
      delete (supabaseEquipment as any).createdAt;
      delete (supabaseEquipment as any).lastUpdated;
      delete (supabaseEquipment as any).serialNumber;
      delete (supabaseEquipment as any).qrCode;

      const { data, error } = await supabase
        .from('equipment')
        .insert([supabaseEquipment])
        .select()
        .single();

      if (error) {
        console.error('Error creating equipment in Supabase:', error);
        return { success: false, error: error.message };
      }

      // Transform snake_case back to camelCase
      const transformedData: Equipment = {
        ...data,
        createdAt: data.created_at,
        lastUpdated: data.last_updated,
        serialNumber: data.serial_number,
        qrCode: data.id // QR code uses the full ID
      };
      delete (transformedData as any).created_at;
      delete (transformedData as any).last_updated;
      delete (transformedData as any).serial_number;

      return { success: true, data: transformedData };
    } catch (error) {
      console.error('Error creating equipment:', error);
      return { success: false, error: 'Failed to create equipment' };
    }
  }

  static async updateEquipment(equipment: Equipment): Promise<{ success: boolean; data?: Equipment; error?: string }> {
    if (!supabase || !AuthManager.useSupabase()) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }

    try {
      // Transform camelCase to snake_case for Supabase
      const supabaseEquipment = {
        ...equipment,
        created_at: equipment.createdAt,
        last_updated: equipment.lastUpdated,
        serial_number: equipment.serialNumber
      };
      delete (supabaseEquipment as any).createdAt;
      delete (supabaseEquipment as any).lastUpdated;
      delete (supabaseEquipment as any).serialNumber;

      const { data, error } = await supabase
        .from('equipment')
        .update(supabaseEquipment)
        .eq('id', equipment.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating equipment in Supabase:', error);
        return { success: false, error: error.message };
      }

      // Transform snake_case back to camelCase
      const transformedData: Equipment = {
        ...data,
        createdAt: data.created_at,
        lastUpdated: data.last_updated,
        serialNumber: data.serial_number
      };
      delete (transformedData as any).created_at;
      delete (transformedData as any).last_updated;
      delete (transformedData as any).serial_number;

      return { success: true, data: transformedData };
    } catch (error) {
      console.error('Error updating equipment:', error);
      return { success: false, error: 'Failed to update equipment' };
    }
  }

  static async deleteEquipment(equipmentId: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase || !AuthManager.useSupabase()) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }

    try {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', equipmentId);

      if (error) {
        console.error('Error deleting equipment in Supabase:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting equipment:', error);
      return { success: false, error: 'Failed to delete equipment' };
    }
  }

  // Material Operations
  static async createMaterial(material: Material): Promise<{ success: boolean; data?: Material; error?: string }> {
    if (!supabase || !AuthManager.useSupabase()) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }

    try {
      // Transform camelCase to snake_case for Supabase
      const supabaseMaterial = {
        ...material,
        last_updated: material.lastUpdated,
        created_at: material.createdAt,
        access_level: (material as any).accessLevel || 'basic',
        qr_code: material.qrCode || material.id, // Use qrCode if available, otherwise use ID
        use: material.use || material.type // Handle 'use' field
      };
      delete (supabaseMaterial as any).lastUpdated;
      delete (supabaseMaterial as any).createdAt;
      delete (supabaseMaterial as any).qrCode;
      delete (supabaseMaterial as any).accessLevel;

      const { data, error } = await supabase
        .from('materials')
        .insert([supabaseMaterial])
        .select()
        .single();

      if (error) {
        console.error('Error creating material in Supabase:', error);
        return { success: false, error: error.message };
      }

      // Transform snake_case back to camelCase and use the QR code as-is
      const transformedData: Material = {
        ...data,
        lastUpdated: data.last_updated,
        qrCode: data.qr_code, // Use the QR code as stored in database
        accessLevel: data.access_level || 'basic'
      } as any;
      delete (transformedData as any).last_updated;
      delete (transformedData as any).access_level;
      delete (transformedData as any).qr_code;
      
      // Update the QR code in the database with the actual ID
      await supabase
        .from('materials')
        .update({ qr_code: `MAT-${data.id}` })
        .eq('id', data.id);

      return { success: true, data: transformedData };
    } catch (error) {
      console.error('Error creating material:', error);
      return { success: false, error: 'Failed to create material' };
    }
  }

  static async updateMaterial(material: Material): Promise<{ success: boolean; data?: Material; error?: string }> {
    if (!supabase || !AuthManager.useSupabase()) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }

    try {
      // Transform camelCase to snake_case for Supabase
      const supabaseMaterial = {
        ...material,
        last_updated: material.lastUpdated,
        access_level: (material as any).accessLevel || 'basic',
        qr_code: material.qrCode,
        use: material.use || material.type // Handle 'use' field
      };
      delete (supabaseMaterial as any).lastUpdated;
      delete (supabaseMaterial as any).accessLevel;
      delete (supabaseMaterial as any).qrCode;
      delete (supabaseMaterial as any).createdAt;
      delete (supabaseMaterial as any).id;

      const { data, error } = await supabase
        .from('materials')
        .update(supabaseMaterial)
        .eq('id', material.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating material in Supabase:', error);
        return { success: false, error: error.message };
      }

      // Transform snake_case back to camelCase
      const transformedData: Material = {
        ...data,
        lastUpdated: data.last_updated,
        accessLevel: data.access_level || 'basic',
        qrCode: data.qr_code
      } as any;
      delete (transformedData as any).last_updated;
      delete (transformedData as any).access_level;
      delete (transformedData as any).qr_code;
      

      return { success: true, data: transformedData };
    } catch (error) {
      console.error('Error updating material:', error);
      return { success: false, error: 'Failed to update material' };
    }
  }

  static async deleteMaterial(materialId: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase || !AuthManager.useSupabase()) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }

    try {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', materialId);

      if (error) {
        console.error('Error deleting material in Supabase:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting material:', error);
      return { success: false, error: 'Failed to delete material' };
    }
  }

  // Site Operations
  static async createSite(site: Site): Promise<{ success: boolean; data?: Site; error?: string }> {
    if (!supabase || !AuthManager.useSupabase()) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }

    try {
      // Transform camelCase to snake_case for Supabase
      const supabaseSite = {
        ...site,
        last_updated: site.lastUpdated,
        // Transform coordinates array to PostgreSQL POINT format
        coordinates: `(${site.coordinates[0]},${site.coordinates[1]})`,
        qr_code: site.id // Use the site ID as QR code
      };
      delete (supabaseSite as any).lastUpdated;
      delete (supabaseSite as any).qrCode;

      const { data, error } = await supabase
        .from('sites')
        .insert([supabaseSite])
        .select()
        .single();

      if (error) {
        console.error('Error creating site in Supabase:', error);
        return { success: false, error: error.message };
      }

      // Transform snake_case back to camelCase and parse coordinates
      let coordinates: [number, number] = [0, 0];
      if (data.coordinates && typeof data.coordinates === 'string') {
        // PostgreSQL POINT format: "(longitude,latitude)"
        const match = data.coordinates.match(/\(([^,]+),([^)]+)\)/);
        if (match) {
          coordinates = [parseFloat(match[1]), parseFloat(match[2])];
        }
      }
      
      const transformedData: Site = {
        ...data,
        coordinates,
        lastUpdated: data.last_updated,
        qrCode: `SITE-${data.id}` // Update QR code with actual database-generated ID
      };
      delete (transformedData as any).last_updated;
      
      // Update the QR code in the database with the actual ID
      await supabase
        .from('sites')
        .update({ qr_code: `SITE-${data.id}` })
        .eq('id', data.id);

      return { success: true, data: transformedData };
    } catch (error) {
      console.error('Error creating site:', error);
      return { success: false, error: 'Failed to create site' };
    }
  }

  static async updateSite(site: Site): Promise<{ success: boolean; data?: Site; error?: string }> {
    if (!supabase || !AuthManager.useSupabase()) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }

    try {
      // Transform camelCase to snake_case for Supabase
      const supabaseSite = {
        ...site,
        last_updated: site.lastUpdated,
        qr_code: site.qrCode,
        // Transform coordinates array to PostgreSQL POINT format
        coordinates: `(${site.coordinates[0]},${site.coordinates[1]})`
      };
      delete (supabaseSite as any).lastUpdated;
      delete (supabaseSite as any).qrCode;

      const { data, error } = await supabase
        .from('sites')
        .update(supabaseSite)
        .eq('id', site.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating site in Supabase:', error);
        return { success: false, error: error.message };
      }

      // Transform snake_case back to camelCase and parse coordinates
      let coordinates: [number, number] = [0, 0];
      if (data.coordinates && typeof data.coordinates === 'string') {
        // PostgreSQL POINT format: "(longitude,latitude)"
        const match = data.coordinates.match(/\(([^,]+),([^)]+)\)/);
        if (match) {
          coordinates = [parseFloat(match[1]), parseFloat(match[2])];
        }
      }
      
      const transformedData: Site = {
        ...data,
        coordinates,
        lastUpdated: data.last_updated,
        qrCode: data.qr_code
      };
      delete (transformedData as any).last_updated;
      delete (transformedData as any).qr_code;

      return { success: true, data: transformedData };
    } catch (error) {
      console.error('Error updating site:', error);
      return { success: false, error: 'Failed to update site' };
    }
  }

  static async deleteSite(siteId: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase || !AuthManager.useSupabase()) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }

    try {
      const { error } = await supabase
        .from('sites')
        .delete()
        .eq('id', siteId);

      if (error) {
        console.error('Error deleting site in Supabase:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting site:', error);
      return { success: false, error: 'Failed to delete site' };
    }
  }

  // Bulk Operations
  static async bulkCreateEmployees(employees: Employee[]): Promise<{ success: boolean; data?: Employee[]; error?: string; errors?: string[] }> {
    if (!supabase || !AuthManager.useSupabase()) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }

    try {
      const supabaseEmployees = employees.map(employee => ({
        ...employee,
        last_updated: employee.lastUpdated,
        blood_group: employee.bloodGroup,
        created_at: employee.createdAt,
        qr_code: `EMP-${employee.id}` // Use the actual UUID for QR code
      }));

      // Clean up camelCase properties
      supabaseEmployees.forEach(emp => {
        delete (emp as any).lastUpdated;
        delete (emp as any).bloodGroup;
        delete (emp as any).createdAt;
        delete (emp as any).qrCode;
      });

      const { data, error } = await supabase
        .from('employees')
        .insert(supabaseEmployees)
        .select();

      if (error) {
        console.error('Error bulk creating employees in Supabase:', error);
        return { success: false, error: error.message };
      }

      // Transform snake_case back to camelCase
      const transformedData: Employee[] = (data || []).map(employee => ({
        ...employee,
        lastUpdated: employee.last_updated,
        qrCode: `EMP-${employee.id}`
      }));

      return { success: true, data: transformedData };
    } catch (error) {
      console.error('Error bulk creating employees:', error);
      return { success: false, error: 'Failed to bulk create employees' };
    }
  }

  static async bulkCreateEquipment(equipment: Equipment[]): Promise<{ success: boolean; data?: Equipment[]; error?: string; errors?: string[] }> {
    if (!supabase || !AuthManager.useSupabase()) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }

    try {
      const supabaseEquipment = equipment.map(eq => ({
        ...eq,
        last_updated: eq.lastUpdated,
        qr_code: `EQP-${eq.id}` // Use the actual UUID for QR code
      }));

      // Clean up camelCase properties
      supabaseEquipment.forEach(eq => {
        delete (eq as any).lastUpdated;
        delete (eq as any).qrCode;
      });

      const { data, error } = await supabase
        .from('equipment')
        .insert(supabaseEquipment)
        .select();

      if (error) {
        console.error('Error bulk creating equipment in Supabase:', error);
        return { success: false, error: error.message };
      }

      // Transform snake_case back to camelCase
      const transformedData: Equipment[] = (data || []).map(eq => ({
        ...eq,
        lastUpdated: eq.last_updated,
        qrCode: `EQP-${eq.id}`
      }));

      return { success: true, data: transformedData };
    } catch (error) {
      console.error('Error bulk creating equipment:', error);
      return { success: false, error: 'Failed to bulk create equipment' };
    }
  }
}