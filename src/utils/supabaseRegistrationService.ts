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
        qr_code: employee.id, // Use the full employee ID (already includes EMP- prefix)
        old_id: employee.oldId // Handle oldId field
      };
      delete (supabaseEmployee as any).lastUpdated;
      delete (supabaseEmployee as any).bloodGroup;
      delete (supabaseEmployee as any).createdAt;
      delete (supabaseEmployee as any).qrCode;
      delete (supabaseEmployee as any).oldId;

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
        qrCode: data.id, // QR code uses the full ID
        oldId: data.old_id // Handle oldId field
      };
      delete (transformedData as any).last_updated;
      delete (transformedData as any).old_id;

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
        qr_code: employee.qrCode,
        old_id: employee.oldId // Handle oldId field
      };
      delete (supabaseEmployee as any).lastUpdated;
      delete (supabaseEmployee as any).bloodGroup;
      delete (supabaseEmployee as any).createdAt;
      delete (supabaseEmployee as any).qrCode;
      delete (supabaseEmployee as any).oldId;

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
        lastUpdated: data.last_updated,
        oldId: data.old_id // Handle oldId field
      };
      delete (transformedData as any).last_updated;
      delete (transformedData as any).old_id;

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
        custom_equipment_id: equipment.custom_equipment_id,
        qr_code: equipment.qrCode || equipment.custom_equipment_id, // Use qrCode if available, otherwise use custom_equipment_id
        old_id: equipment.oldId // Handle oldId field
      };
      // Remove camelCase properties
      delete (supabaseEquipment as any).createdAt;
      delete (supabaseEquipment as any).lastUpdated;
      delete (supabaseEquipment as any).serialNumber;
      delete (supabaseEquipment as any).qrCode;
      delete (supabaseEquipment as any).oldId;
      // Remove id if it's empty (let Supabase generate UUID)
      if (!supabaseEquipment.id) {
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
        createdAt: data.created_at,
        lastUpdated: data.last_updated,
        serialNumber: data.serial_number,
        custom_equipment_id: data.custom_equipment_id,
        qrCode: data.custom_equipment_id, // QR code uses the custom_equipment_id
        oldId: data.old_id // Handle oldId field
      };
      delete (transformedData as any).created_at;
      delete (transformedData as any).last_updated;
      delete (transformedData as any).serial_number;
      delete (transformedData as any).old_id;

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
        serial_number: equipment.serialNumber,
        custom_equipment_id: equipment.custom_equipment_id,
        qr_code: equipment.qrCode || equipment.custom_equipment_id,
        old_id: equipment.oldId // Handle oldId field
      };
      delete (supabaseEquipment as any).createdAt;
      delete (supabaseEquipment as any).lastUpdated;
      delete (supabaseEquipment as any).serialNumber;
      delete (supabaseEquipment as any).qrCode;
      delete (supabaseEquipment as any).oldId;

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
        serialNumber: data.serial_number,
        custom_equipment_id: data.custom_equipment_id,
        qrCode: data.custom_equipment_id,
        oldId: data.old_id // Handle oldId field
      };
      delete (transformedData as any).created_at;
      delete (transformedData as any).last_updated;
      delete (transformedData as any).serial_number;
      delete (transformedData as any).old_id;

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
      console.log('📝 Creating material in Supabase:', material.id, material.name);
      
      // Transform camelCase to snake_case for Supabase
      const supabaseMaterial = {
        id: material.id, // Use the provided ID
        name: material.name,
        type: material.type,
        unit: material.unit,
        site: material.site,
        quantity: material.quantity,
        status: material.status,
        last_updated: material.lastUpdated || new Date().toISOString(),
        created_at: material.createdAt || new Date().toISOString(),
        access_level: (material as any).accessLevel || 'basic',
        qr_code: material.qrCode || `MAT-${material.id}`,
        use: material.use || material.type,
        old_id: material.oldId // Handle oldId field
      };

      console.log('📤 Sending create data to Supabase:', supabaseMaterial);

      const { data, error } = await supabase
        .from('materials')
        .insert([supabaseMaterial])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating material in Supabase:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Material created successfully in Supabase:', data);

      // Transform snake_case back to camelCase
      const transformedData: Material = {
        id: data.id,
        name: data.name,
        type: data.type,
        unit: data.unit,
        site: data.site,
        quantity: data.quantity,
        status: data.status,
        createdAt: data.created_at,
        lastUpdated: data.last_updated,
        qrCode: data.qr_code,
        accessLevel: data.access_level || 'basic',
        use: data.use,
        oldId: data.old_id // Handle oldId field
      };

      return { success: true, data: transformedData };
    } catch (error) {
      console.error('❌ Exception creating material:', error);
      return { success: false, error: 'Failed to create material: ' + (error as Error).message };
    }
  }

  static async updateMaterial(material: Material): Promise<{ success: boolean; data?: Material; error?: string }> {
    if (!supabase || !AuthManager.useSupabase()) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }

    try {
      console.log('🔄 Updating material in Supabase:', material.id, material.name);
      
      // First, check if the material exists
      const { data: existingMaterial, error: checkError } = await supabase
        .from('materials')
        .select('id')
        .eq('id', material.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error checking material existence:', checkError);
        return { success: false, error: checkError.message };
      }

      // If material doesn't exist, create it instead
      if (!existingMaterial) {
        console.log('📝 Material not found in Supabase, creating new record:', material.id);
        return await this.createMaterial(material);
      }

      // Transform camelCase to snake_case for Supabase
      const supabaseMaterial = {
        name: material.name,
        type: material.type,
        unit: material.unit,
        site: material.site,
        quantity: material.quantity,
        status: material.status,
        last_updated: material.lastUpdated || new Date().toISOString(),
        access_level: (material as any).accessLevel || 'basic',
        qr_code: material.qrCode || `MAT-${material.id}`,
        use: material.use || material.type,
        old_id: material.oldId // Handle oldId field
      };

      console.log('📤 Sending update data to Supabase:', supabaseMaterial);

      const { data, error } = await supabase
        .from('materials')
        .update(supabaseMaterial)
        .eq('id', material.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase update error:', error);
        console.error('❌ Failed material ID:', material.id);
        console.error('❌ Update data:', supabaseMaterial);
        return { success: false, error: error.message };
      }

      console.log('✅ Material updated successfully in Supabase:', data);

      // Transform snake_case back to camelCase
      const transformedData: Material = {
        id: data.id,
        name: data.name,
        type: data.type,
        unit: data.unit,
        site: data.site,
        quantity: data.quantity,
        status: data.status,
        createdAt: data.created_at,
        lastUpdated: data.last_updated,
        qrCode: data.qr_code,
        accessLevel: data.access_level || 'basic',
        use: data.use,
        oldId: data.old_id // Handle oldId field
      };

      return { success: true, data: transformedData };
    } catch (error) {
      console.error('❌ Exception updating material:', error);
      return { success: false, error: 'Failed to update material: ' + (error as Error).message };
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

  // Log Operations
  static async createMaterialLog(materialLog: any): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!supabase || !AuthManager.useSupabase()) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }

    try {
      console.log('Creating material log in Supabase:', materialLog);
      
      // Transform camelCase to snake_case for Supabase
      const supabaseMaterialLog = {
        ...materialLog,
        material_id: materialLog.materialId,
        material_name: materialLog.materialName,
        material_type: materialLog.materialType,
        created_at: materialLog.createdAt,
        old_id: materialLog.oldId // Handle oldId field
      };
      delete (supabaseMaterialLog as any).materialId;
      delete (supabaseMaterialLog as any).materialName;
      delete (supabaseMaterialLog as any).materialType;
      delete (supabaseMaterialLog as any).createdAt;
      delete (supabaseMaterialLog as any).oldId;

      const { data, error } = await supabase
        .from('material_logs')
        .insert([supabaseMaterialLog])
        .select()
        .single();

      if (error) {
        console.error('Error creating material log in Supabase:', error);
        return { success: false, error: error.message };
      }

      console.log('Successfully created material log in Supabase:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Error creating material log:', error);
      return { success: false, error: 'Failed to create material log' };
    }
  }

  static async createEmployeeLog(employeeLog: any): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!supabase || !AuthManager.useSupabase()) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }

    try {
      console.log('Creating employee log in Supabase:', employeeLog);
      
      // Transform camelCase to snake_case for Supabase
      const supabaseEmployeeLog = {
        ...employeeLog,
        employee_id: employeeLog.employeeId,
        employee_name: employeeLog.employeeName,
        created_at: employeeLog.createdAt,
        old_id: employeeLog.oldId // Handle oldId field
      };
      delete (supabaseEmployeeLog as any).employeeId;
      delete (supabaseEmployeeLog as any).employeeName;
      delete (supabaseEmployeeLog as any).createdAt;
      delete (supabaseEmployeeLog as any).oldId;

      const { data, error } = await supabase
        .from('employee_logs')
        .insert([supabaseEmployeeLog])
        .select()
        .single();

      if (error) {
        console.error('Error creating employee log in Supabase:', error);
        return { success: false, error: error.message };
      }

      console.log('Successfully created employee log in Supabase:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Error creating employee log:', error);
      return { success: false, error: 'Failed to create employee log' };
    }
  }

  static async createEquipmentLog(equipmentLog: any): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!supabase || !AuthManager.useSupabase()) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }

    try {
      console.log('Creating equipment log in Supabase:', equipmentLog);
      
      // Transform camelCase to snake_case for Supabase
      const supabaseEquipmentLog = {
        ...equipmentLog,
        equipment_id: equipmentLog.equipmentId,
        equipment_name: equipmentLog.equipmentName,
        equipment_type: equipmentLog.equipmentType,
        created_at: equipmentLog.createdAt,
        old_id: equipmentLog.oldId // Handle oldId field
      };
      delete (supabaseEquipmentLog as any).equipmentId;
      delete (supabaseEquipmentLog as any).equipmentName;
      delete (supabaseEquipmentLog as any).equipmentType;
      delete (supabaseEquipmentLog as any).createdAt;
      delete (supabaseEquipmentLog as any).oldId;

      const { data, error } = await supabase
        .from('equipment_logs')
        .insert([supabaseEquipmentLog])
        .select()
        .single();

      if (error) {
        console.error('Error creating equipment log in Supabase:', error);
        return { success: false, error: error.message };
      }

      console.log('Successfully created equipment log in Supabase:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Error creating equipment log:', error);
      return { success: false, error: 'Failed to create equipment log' };
    }
  }

  // Company Operations
  static async createCompany(company: { name: string; logoUrl?: string }): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!supabase || !AuthManager.useSupabase()) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }
    try {
      const { data, error } = await supabase
        .from('companies')
        .insert([{ name: company.name, logo_url: company.logoUrl }])
        .select()
        .single();
      if (error) {
        console.error('Error creating company in Supabase:', error);
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (error) {
      console.error('Error creating company:', error);
      return { success: false, error: 'Failed to create company' };
    }
  }

  static async updateCompany(company: { id: string; name: string; logoUrl?: string }): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!supabase || !AuthManager.useSupabase()) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }
    try {
      const { data, error } = await supabase
        .from('companies')
        .update({ name: company.name, logo_url: company.logoUrl })
        .eq('id', company.id)
        .select()
        .single();
      if (error) {
        console.error('Error updating company in Supabase:', error);
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (error) {
      console.error('Error updating company:', error);
      return { success: false, error: 'Failed to update company' };
    }
  }

  static async deleteCompany(companyId: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase || !AuthManager.useSupabase()) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);
      if (error) {
        console.error('Error deleting company in Supabase:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      console.error('Error deleting company:', error);
      return { success: false, error: 'Failed to delete company' };
    }
  }

  static async getCompanies(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    if (!supabase || !AuthManager.useSupabase()) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }
    try {
      const { data, error } = await supabase
        .from('companies')
        .select();
      if (error) {
        console.error('Error fetching companies from Supabase:', error);
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching companies:', error);
      return { success: false, error: 'Failed to fetch companies' };
    }
  }
}