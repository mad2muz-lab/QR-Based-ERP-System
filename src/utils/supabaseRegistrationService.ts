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
        old_id: employee.oldId, // Handle oldId field
        cost_center_code: employee.costCenterCode, // Handle cost center code
        profit_center_code: employee.profitCenterCode // Handle profit center code
      };
      delete (supabaseEmployee as any).lastUpdated;
      delete (supabaseEmployee as any).bloodGroup;
      delete (supabaseEmployee as any).createdAt;
      delete (supabaseEmployee as any).qrCode;
      delete (supabaseEmployee as any).oldId;
      delete (supabaseEmployee as any).costCenterCode;
      delete (supabaseEmployee as any).profitCenterCode;

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
        oldId: data.old_id, // Handle oldId field
        costCenterCode: data.cost_center_code, // Handle cost center code
        profitCenterCode: data.profit_center_code // Handle profit center code
      };
      delete (transformedData as any).last_updated;
      delete (transformedData as any).old_id;
      delete (transformedData as any).cost_center_code;
      delete (transformedData as any).profit_center_code;

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
        old_id: employee.oldId, // Handle oldId field
        cost_center_code: employee.costCenterCode, // Handle cost center code
        profit_center_code: employee.profitCenterCode // Handle profit center code
      };
      delete (supabaseEmployee as any).lastUpdated;
      delete (supabaseEmployee as any).bloodGroup;
      delete (supabaseEmployee as any).createdAt;
      delete (supabaseEmployee as any).qrCode;
      delete (supabaseEmployee as any).oldId;
      delete (supabaseEmployee as any).costCenterCode;
      delete (supabaseEmployee as any).profitCenterCode;

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
        oldId: data.old_id, // Handle oldId field
        costCenterCode: data.cost_center_code, // Handle cost center code
        profitCenterCode: data.profit_center_code // Handle profit center code
      };
      delete (transformedData as any).last_updated;
      delete (transformedData as any).old_id;
      delete (transformedData as any).cost_center_code;
      delete (transformedData as any).profit_center_code;

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
        old_id: equipment.oldId, // Handle oldId field
        cost_center_code: equipment.costCenterCode, // Handle cost center code
        profit_center_code: equipment.profitCenterCode // Handle profit center code
      };
      // Remove camelCase properties
      delete (supabaseEquipment as any).createdAt;
      delete (supabaseEquipment as any).lastUpdated;
      delete (supabaseEquipment as any).serialNumber;
      delete (supabaseEquipment as any).qrCode;
      delete (supabaseEquipment as any).oldId;
      delete (supabaseEquipment as any).costCenterCode;
      delete (supabaseEquipment as any).profitCenterCode;
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
        oldId: data.old_id, // Handle oldId field
        costCenterCode: data.cost_center_code, // Handle cost center code
        profitCenterCode: data.profit_center_code // Handle profit center code
      };
      delete (transformedData as any).created_at;
      delete (transformedData as any).last_updated;
      delete (transformedData as any).serial_number;
      delete (transformedData as any).old_id;
      delete (transformedData as any).cost_center_code;
      delete (transformedData as any).profit_center_code;

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
        old_id: material.oldId, // Handle oldId field
        cost_center_code: material.costCenterCode, // Handle cost center code
        profit_center_code: material.profitCenterCode // Handle profit center code
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
        oldId: data.old_id, // Handle oldId field
        costCenterCode: data.cost_center_code, // Handle cost center code
        profitCenterCode: data.profit_center_code // Handle profit center code
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
        old_id: material.oldId, // Handle oldId field
        cost_center_code: material.costCenterCode, // Handle cost center code
        profit_center_code: material.profitCenterCode // Handle profit center code
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
        oldId: data.old_id, // Handle oldId field
        costCenterCode: data.cost_center_code, // Handle cost center code
        profitCenterCode: data.profit_center_code // Handle profit center code
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
        qr_code: site.id, // Use the site ID as QR code
        cost_center_code: site.costCenterCode, // Handle cost center code
        profit_center_code: site.profitCenterCode // Handle profit center code
      };
      delete (supabaseSite as any).lastUpdated;
      delete (supabaseSite as any).qrCode;
      delete (supabaseSite as any).costCenterCode;
      delete (supabaseSite as any).profitCenterCode;

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
        qrCode: `SITE-${data.id}`, // Update QR code with actual database-generated ID
        costCenterCode: data.cost_center_code, // Handle cost center code
        profitCenterCode: data.profit_center_code // Handle profit center code
      };
      delete (transformedData as any).last_updated;
      delete (transformedData as any).cost_center_code;
      delete (transformedData as any).profit_center_code;
      
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
        old_id: materialLog.oldId // Use snake_case for DB
      };
      delete (supabaseMaterialLog as any).materialId;
      delete (supabaseMaterialLog as any).materialName;
      delete (supabaseMaterialLog as any).materialType;
      delete (supabaseMaterialLog as any).createdAt;
      delete (supabaseMaterialLog as any).oldId; // Remove camelCase property

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
        old_id: employeeLog.oldId // Use snake_case for DB
      };
      delete (supabaseEmployeeLog as any).employeeId;
      delete (supabaseEmployeeLog as any).employeeName;
      delete (supabaseEmployeeLog as any).createdAt;
      delete (supabaseEmployeeLog as any).oldId; // Remove camelCase property

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
        old_id: equipmentLog.oldId // Use snake_case for DB
      };
      delete (supabaseEquipmentLog as any).equipmentId;
      delete (supabaseEquipmentLog as any).equipmentName;
      delete (supabaseEquipmentLog as any).equipmentType;
      delete (supabaseEquipmentLog as any).createdAt;
      delete (supabaseEquipmentLog as any).oldId; // Remove camelCase property

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

  // Maintenance Log Operations
  static async createMaintenanceLog(maintenanceLog: any): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!supabase || !AuthManager.useSupabase()) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }

    try {
      console.log('Creating maintenance log in Supabase:', maintenanceLog);
      
      // Transform camelCase to snake_case for Supabase
      const supabaseMaintenanceLog = {
        ...maintenanceLog,
        equipment_id: maintenanceLog.equipment_id,
        maintenance_type: maintenanceLog.maintenance_type,
        repair_type: maintenanceLog.repair_type,
        service_type: maintenanceLog.service_type,
        status: maintenanceLog.status,
        description: maintenanceLog.description,
        technician_notes: maintenanceLog.technician_notes,
        parts_used: maintenanceLog.parts_used,
        start_date: maintenanceLog.start_date,
        completion_date: maintenanceLog.completion_date,
        completed_by: maintenanceLog.completed_by,
        estimated_duration_hours: maintenanceLog.estimated_duration_hours,
        actual_duration_hours: maintenanceLog.actual_duration_hours,
        cost: maintenanceLog.cost,
        next_maintenance_date: maintenanceLog.next_maintenance_date,
        created_at: maintenanceLog.created_at,
        updated_at: maintenanceLog.updated_at,
        // New fields
        equipment_name: maintenanceLog.equipment_name,
        old_equipment_id: maintenanceLog.old_equipment_id,
        equipment_type: maintenanceLog.equipment_type,
        model: maintenanceLog.model,
        serial_number: maintenanceLog.serial_number,
        site_assignment: maintenanceLog.site_assignment
      };

      const { data, error } = await supabase
        .from('equipment_maintenance_logs')
        .insert([supabaseMaintenanceLog])
        .select()
        .single();

      if (error) {
        console.error('Error creating maintenance log in Supabase:', error);
        return { success: false, error: error.message };
      }

      console.log('Successfully created maintenance log in Supabase:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Error creating maintenance log:', error);
      return { success: false, error: 'Failed to create maintenance log' };
    }
  }

  static async updateMaintenanceLog(maintenanceId: string, updateData: any): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!supabase || !AuthManager.useSupabase()) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }

    try {
      console.log('Updating maintenance log in Supabase:', maintenanceId, updateData);
      
      const { data, error } = await supabase
        .from('equipment_maintenance_logs')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', maintenanceId)
        .select()
        .single();

      if (error) {
        console.error('Error updating maintenance log in Supabase:', error);
        return { success: false, error: error.message };
      }

      console.log('Successfully updated maintenance log in Supabase:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Error updating maintenance log:', error);
      return { success: false, error: 'Failed to update maintenance log' };
    }
  }

  // Maintenance Schedule Operations
  static async createMaintenanceSchedule(maintenanceSchedule: any): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!supabase || !AuthManager.useSupabase()) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }

    try {
      console.log('Creating maintenance schedule in Supabase:', maintenanceSchedule);
      
      // Transform camelCase to snake_case for Supabase
      const supabaseMaintenanceSchedule = {
        ...maintenanceSchedule,
        equipment_id: maintenanceSchedule.equipment_id,
        schedule_type: maintenanceSchedule.schedule_type,
        maintenance_type: maintenanceSchedule.maintenance_type,
        frequency_days: maintenanceSchedule.frequency_days,
        last_maintenance_date: maintenanceSchedule.last_maintenance_date,
        next_maintenance_date: maintenanceSchedule.next_maintenance_date,
        assigned_technician: maintenanceSchedule.assigned_technician,
        priority: maintenanceSchedule.priority,
        description: maintenanceSchedule.description,
        is_active: maintenanceSchedule.is_active,
        created_at: maintenanceSchedule.created_at,
        updated_at: maintenanceSchedule.updated_at
      };

      const { data, error } = await supabase
        .from('equipment_maintenance_schedules')
        .insert([supabaseMaintenanceSchedule])
        .select()
        .single();

      if (error) {
        console.error('Error creating maintenance schedule in Supabase:', error);
        return { success: false, error: error.message };
      }

      console.log('Successfully created maintenance schedule in Supabase:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Error creating maintenance schedule:', error);
      return { success: false, error: 'Failed to create maintenance schedule' };
    }
  }

  static async updateMaintenanceSchedule(scheduleId: string, updateData: any): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!supabase || !AuthManager.useSupabase()) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }

    try {
      console.log('Updating maintenance schedule in Supabase:', scheduleId, updateData);
      
      const { data, error } = await supabase
        .from('equipment_maintenance_schedules')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', scheduleId)
        .select()
        .single();

      if (error) {
        console.error('Error updating maintenance schedule in Supabase:', error);
        return { success: false, error: error.message };
      }

      console.log('Successfully updated maintenance schedule in Supabase:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Error updating maintenance schedule:', error);
      return { success: false, error: 'Failed to update maintenance schedule' };
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

  // Create a new location with duplicate checking
  static async createLocationWithDuplicateCheck(location: { city: string, province: string, latitude: number, longitude: number, source?: string }) {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    try {
      // Check for duplicate
      const { data: existing, error: selectError } = await supabase
        .from('locations')
        .select('*')
        .eq('city', location.city)
        .eq('province', location.province)
        .eq('latitude', location.latitude)
        .eq('longitude', location.longitude)
        .maybeSingle();
      if (selectError) {
        // If error is not 'no rows', return error
        if (selectError.code !== 'PGRST116') {
          return { success: false, error: selectError.message };
        }
      }
      if (existing) {
        // Duplicate found, return existing
        return { success: true, data: existing, duplicate: true };
      }
      // Insert new location
      const { data, error } = await supabase
        .from('locations')
        .insert([{
          city: location.city,
          province: location.province,
          latitude: location.latitude,
          longitude: location.longitude,
          source: location.source || 'custom'
        }])
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data, duplicate: false };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to create location' };
    }
  }
}