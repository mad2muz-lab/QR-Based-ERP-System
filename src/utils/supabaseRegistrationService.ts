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
        last_updated: employee.lastUpdated
      };
      delete (supabaseEmployee as any).lastUpdated;
      
      // Remove ID to let PostgreSQL generate UUID
      if (supabaseEmployee.id && typeof supabaseEmployee.id === 'string' && supabaseEmployee.id.startsWith('EMP-')) {
        delete (supabaseEmployee as any).id;
      }

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
        lastUpdated: data.last_updated
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
        last_updated: employee.lastUpdated
      };
      delete (supabaseEmployee as any).lastUpdated;

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
        last_updated: equipment.lastUpdated
      };
      delete (supabaseEquipment as any).lastUpdated;
      
      // Remove ID to let PostgreSQL generate UUID
      if (supabaseEquipment.id && typeof supabaseEquipment.id === 'string' && supabaseEquipment.id.startsWith('EQP-')) {
        delete (supabaseEquipment as any).id;
      }

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
        lastUpdated: data.last_updated
      };
      delete (transformedData as any).last_updated;

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
        last_updated: equipment.lastUpdated
      };
      delete (supabaseEquipment as any).lastUpdated;

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
        lastUpdated: data.last_updated
      };
      delete (transformedData as any).last_updated;

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
        last_updated: material.lastUpdated
      };
      delete (supabaseMaterial as any).lastUpdated;
      
      // Remove ID to let PostgreSQL generate UUID
      if (supabaseMaterial.id && typeof supabaseMaterial.id === 'string' && supabaseMaterial.id.startsWith('MAT-')) {
        delete (supabaseMaterial as any).id;
      }

      const { data, error } = await supabase
        .from('materials')
        .insert([supabaseMaterial])
        .select()
        .single();

      if (error) {
        console.error('Error creating material in Supabase:', error);
        return { success: false, error: error.message };
      }

      // Transform snake_case back to camelCase
      const transformedData: Material = {
        ...data,
        lastUpdated: data.last_updated
      };
      delete (transformedData as any).last_updated;

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
        last_updated: material.lastUpdated
      };
      delete (supabaseMaterial as any).lastUpdated;

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
        lastUpdated: data.last_updated
      };
      delete (transformedData as any).last_updated;

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
        coordinates: `(${site.coordinates[0]},${site.coordinates[1]})`
      };
      delete (supabaseSite as any).lastUpdated;
      
      // Remove ID to let PostgreSQL generate UUID
      if (supabaseSite.id && typeof supabaseSite.id === 'string' && supabaseSite.id.startsWith('SITE-')) {
        delete (supabaseSite as any).id;
      }

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
        lastUpdated: data.last_updated
      };
      delete (transformedData as any).last_updated;

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
        // Transform coordinates array to PostgreSQL POINT format
        coordinates: `(${site.coordinates[0]},${site.coordinates[1]})`
      };
      delete (supabaseSite as any).lastUpdated;

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
        lastUpdated: data.last_updated
      };
      delete (transformedData as any).last_updated;

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
}