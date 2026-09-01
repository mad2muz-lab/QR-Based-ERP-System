import { supabase } from './supabaseClient';
import { Employee, Equipment, Material, Site } from '../types';
import { AuthManager } from './authUtils';
import { generateUUID } from './index';

export class SupabaseRegistrationService {
  // Employee Operations
  static async createEmployee(employee: Employee): Promise<{ success: boolean; data?: Employee; error?: string }> {
    if (!supabase || !(await AuthManager.shouldUseSupabase())) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }

    try {
      console.log('🔍 Creating employee with data:', employee);
      console.log('🔍 Employee hourlyRate:', employee.hourlyRate, typeof employee.hourlyRate);
      
      // Transform camelCase to snake_case for Supabase
      const supabaseEmployee = {
        ...employee,
        last_updated: employee.lastUpdated,
        blood_group: employee.bloodGroup,
        created_at: employee.createdAt,
        qr_code: employee.qrCode, // Use the full employee ID (already includes EMP- prefix)
        old_id: employee.oldId, // Handle oldId field
        cost_center_code: employee.costCenterCode, // Handle cost center code
        profit_center_code: employee.profitCenterCode, // Handle profit center code
        hourly_rate: employee.hourlyRate // Add hourly_rate mapping
      };
      
      console.log('🔍 Supabase employee data:', supabaseEmployee);
      console.log('🔍 Supabase hourly_rate:', supabaseEmployee.hourly_rate, typeof supabaseEmployee.hourly_rate);
      delete (supabaseEmployee as Record<string, unknown>).lastUpdated;
      delete (supabaseEmployee as Record<string, unknown>).bloodGroup;
      delete (supabaseEmployee as Record<string, unknown>).createdAt;
      delete (supabaseEmployee as Record<string, unknown>).qrCode;
      delete (supabaseEmployee as Record<string, unknown>).oldId;
      delete (supabaseEmployee as Record<string, unknown>).costCenterCode;
      delete (supabaseEmployee as Record<string, unknown>).profitCenterCode;
      delete (supabaseEmployee as Record<string, unknown>).hourlyRate;

      const { data, error } = await supabase
        .from('employees')
        .insert([supabaseEmployee])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating employee in Supabase:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ Employee created successfully in Supabase:', data);
      console.log('✅ Created employee hourly_rate:', data.hourly_rate, typeof data.hourly_rate);

      // Transform snake_case back to camelCase
      const transformedData: Employee = {
        ...data,
        lastUpdated: data.last_updated,
        qrCode: data.id, // QR code uses the full ID
        oldId: data.old_id, // Handle oldId field
        costCenterCode: data.cost_center_code, // Handle cost center code
        profitCenterCode: data.profit_center_code, // Handle profit center code
        hourlyRate: data.hourly_rate // Map hourly_rate back to camelCase
      };
      
      console.log('🔄 Transformed employee data:', transformedData);
      console.log('🔄 Transformed hourlyRate:', transformedData.hourlyRate, typeof transformedData.hourlyRate);
      delete (transformedData as unknown as Record<string, unknown>).last_updated;
      delete (transformedData as unknown as Record<string, unknown>).old_id;
      delete (transformedData as unknown as Record<string, unknown>).cost_center_code;
      delete (transformedData as unknown as Record<string, unknown>).profit_center_code;
      delete (transformedData as unknown as Record<string, unknown>).hourly_rate;

      return { success: true, data: transformedData };
    } catch (error) {
      console.error('Error creating employee:', error);
      return { success: false, error: 'Failed to create employee' };
    }
  }

  static async updateEmployee(employee: Employee): Promise<{ success: boolean; data?: Employee; error?: string }> {
    if (!supabase || !(await AuthManager.shouldUseSupabase())) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }

    try {
      console.log('🔍 Updating employee with data:', employee);
      console.log('🔍 Employee hourlyRate:', employee.hourlyRate, typeof employee.hourlyRate);
      
      // Transform camelCase to snake_case for Supabase
      const supabaseEmployee = {
        ...employee,
        last_updated: employee.lastUpdated,
        blood_group: employee.bloodGroup,
        created_at: employee.createdAt,
        qr_code: employee.qrCode,
        old_id: employee.oldId, // Handle oldId field
        cost_center_code: employee.costCenterCode, // Handle cost center code
        profit_center_code: employee.profitCenterCode, // Handle profit center code
        hourly_rate: employee.hourlyRate // Add hourly_rate mapping
      };
      
      console.log('🔍 Supabase update employee data:', supabaseEmployee);
      console.log('🔍 Supabase update hourly_rate:', supabaseEmployee.hourly_rate, typeof supabaseEmployee.hourly_rate);
      delete (supabaseEmployee as any).lastUpdated;
      delete (supabaseEmployee as any).bloodGroup;
      delete (supabaseEmployee as any).createdAt;
      delete (supabaseEmployee as any).qrCode;
      delete (supabaseEmployee as any).oldId;
      delete (supabaseEmployee as any).costCenterCode;
      delete (supabaseEmployee as any).profitCenterCode;
      delete (supabaseEmployee as any).hourlyRate;

      const { data, error } = await supabase
        .from('employees')
        .update(supabaseEmployee)
        .eq('id', employee.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating employee in Supabase:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ Employee updated successfully in Supabase:', data);
      console.log('✅ Updated employee hourly_rate:', data.hourly_rate, typeof data.hourly_rate);

      // Transform snake_case back to camelCase
      const transformedData: Employee = {
        ...data,
        lastUpdated: data.last_updated,
        oldId: data.old_id, // Handle oldId field
        costCenterCode: data.cost_center_code, // Handle cost center code
        profitCenterCode: data.profit_center_code, // Handle profit center code
        hourlyRate: data.hourly_rate // Map hourly_rate back to camelCase
      };
      delete (transformedData as unknown as Record<string, unknown>).last_updated;
      delete (transformedData as unknown as Record<string, unknown>).old_id;
      delete (transformedData as unknown as Record<string, unknown>).cost_center_code;
      delete (transformedData as unknown as Record<string, unknown>).profit_center_code;
      delete (transformedData as unknown as Record<string, unknown>).hourly_rate;

      return { success: true, data: transformedData };
    } catch (error) {
      console.error('Error updating employee:', error);
      return { success: false, error: 'Failed to update employee' };
    }
  }

  static async deleteEmployee(employeeId: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase || !(await AuthManager.shouldUseSupabase())) {
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
  static async createEquipment(equipment: Equipment | Omit<Equipment, 'id'>): Promise<{ success: boolean; data?: Equipment; error?: string }> {
    if (!supabase || !(await AuthManager.shouldUseSupabase())) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }

    try {
      console.log('🔍 SupabaseRegistrationService - Original equipment data:', equipment);
      
      // Validate required fields
      if (!equipment.name || !equipment.type || !equipment.model || !equipment.site || !equipment.custom_equipment_id) {
        console.error('❌ Missing required fields:', {
          name: equipment.name,
          type: equipment.type,
          model: equipment.model,
          site: equipment.site,
          custom_equipment_id: equipment.custom_equipment_id
        });
        return { success: false, error: 'Missing required fields: name, type, model, site, or custom_equipment_id' };
      }
      
      console.log('🔍 SupabaseRegistrationService - Original equipment data:', equipment);
      
      // Create a completely new object without any reference to the original equipment
      // This ensures no id field can be accidentally included
      // NOTE: The equipment table requires an explicit id, so we generate one
      const supabaseEquipment = {
        id: crypto.randomUUID(), // Generate UUID since the table doesn't have a default
        name: equipment.name,
        type: equipment.type,
        model: equipment.model,
        site: equipment.site,
        qr_code: equipment.qrCode || equipment.custom_equipment_id, // Use qrCode if available, otherwise use custom_equipment_id
        status: equipment.status,
        operational_status: equipment.operational_status,
        custom_equipment_id: equipment.custom_equipment_id
      };
      
      // Only add optional fields if they have values
      if (equipment.serialNumber) {
        supabaseEquipment.serial_number = equipment.serialNumber;
      }
      if (equipment.oldId) {
        supabaseEquipment.old_id = equipment.oldId;
      }
      if (equipment.costCenterCode) {
        supabaseEquipment.cost_center_code = equipment.costCenterCode;
      }
      if (equipment.profitCenterCode) {
        supabaseEquipment.profit_center_code = equipment.profitCenterCode;
      }
      if (equipment.hourly_rate !== undefined && equipment.hourly_rate !== null) {
        supabaseEquipment.hourly_rate = equipment.hourly_rate;
      }

      // Note: id field is now explicitly included since the table doesn't have a default

      console.log('🔍 SupabaseRegistrationService - Equipment data being sent to Supabase:', supabaseEquipment);
      console.log('🔍 SupabaseRegistrationService - Equipment data keys:', Object.keys(supabaseEquipment));
      console.log('🔍 SupabaseRegistrationService - Equipment data has id field:', 'id' in supabaseEquipment);
      
      console.log('🔍 SupabaseRegistrationService - About to send to Supabase:', JSON.stringify(supabaseEquipment, null, 2));
      
      // Try a different approach - use raw insert without any potential id field
      const { data, error } = await supabase
        .from('equipment')
        .insert([supabaseEquipment])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating equipment in Supabase:', error);
        console.error('❌ Equipment data that failed:', supabaseEquipment);
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
        profitCenterCode: data.profit_center_code, // Handle profit center code
        hourly_rate: data.hourly_rate // Ensure hourly_rate is preserved
      };
      delete (transformedData as unknown as Record<string, unknown>).created_at;
      delete (transformedData as unknown as Record<string, unknown>).last_updated;
      delete (transformedData as unknown as Record<string, unknown>).serial_number;
      delete (transformedData as unknown as Record<string, unknown>).old_id;
      delete (transformedData as unknown as Record<string, unknown>).cost_center_code;
      delete (transformedData as unknown as Record<string, unknown>).profit_center_code;

      return { success: true, data: transformedData };
    } catch (error) {
      console.error('Error creating equipment:', error);
      return { success: false, error: 'Failed to create equipment' };
    }
  }

  static async updateEquipment(equipment: Equipment): Promise<{ success: boolean; data?: Equipment; error?: string }> {
    if (!supabase || !(await AuthManager.shouldUseSupabase())) {
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
        old_id: equipment.oldId, // Handle oldId field
        cost_center_code: equipment.costCenterCode, // Handle cost center code
        profit_center_code: equipment.profitCenterCode, // Handle profit center code
        hourly_rate: equipment.hourly_rate // Handle hourly_rate mapping
      };
      delete (supabaseEquipment as unknown as Record<string, unknown>).createdAt;
      delete (supabaseEquipment as unknown as Record<string, unknown>).lastUpdated;
      delete (supabaseEquipment as unknown as Record<string, unknown>).serialNumber;
      delete (supabaseEquipment as unknown as Record<string, unknown>).qrCode;
      delete (supabaseEquipment as unknown as Record<string, unknown>).oldId;
      delete (supabaseEquipment as unknown as Record<string, unknown>).costCenterCode;
      delete (supabaseEquipment as unknown as Record<string, unknown>).profitCenterCode;

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
        oldId: data.old_id, // Handle oldId field
        costCenterCode: data.cost_center_code, // Handle cost center code
        profitCenterCode: data.profit_center_code, // Handle profit center code
        hourly_rate: data.hourly_rate // Ensure hourly_rate is preserved
      };
      delete (transformedData as unknown as Record<string, unknown>).created_at;
      delete (transformedData as unknown as Record<string, unknown>).last_updated;
      delete (transformedData as unknown as Record<string, unknown>).serial_number;
      delete (transformedData as unknown as Record<string, unknown>).old_id;
      delete (transformedData as unknown as Record<string, unknown>).cost_center_code;
      delete (transformedData as unknown as Record<string, unknown>).profit_center_code;

      return { success: true, data: transformedData };
    } catch (error) {
      console.error('Error updating equipment:', error);
      return { success: false, error: 'Failed to update equipment' };
    }
  }

  static async deleteEquipment(equipmentId: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase || !(await AuthManager.shouldUseSupabase())) {
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
    if (!supabase || !(await AuthManager.shouldUseSupabase())) {
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
        qr_code: material.qrCode || `MAT-${generateUUID()}`,
        use: material.use || material.type,
        old_id: material.oldId, // Handle oldId field
        cost_center_code: material.costCenterCode, // Handle cost center code
        profit_center_code: material.profitCenterCode, // Handle profit center code
        cost: material.cost // Handle cost field
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
        profitCenterCode: data.profit_center_code, // Handle profit center code
        cost: data.cost // Ensure cost is preserved
      };

      return { success: true, data: transformedData };
    } catch (error) {
      console.error('❌ Exception creating material:', error);
      return { success: false, error: 'Failed to create material: ' + (error as Error).message };
    }
  }

  static async updateMaterial(material: Material): Promise<{ success: boolean; data?: Material; error?: string }> {
    if (!supabase || !(await AuthManager.shouldUseSupabase())) {
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
        profit_center_code: material.profitCenterCode, // Handle profit center code
        cost: material.cost // Handle cost field
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
        profitCenterCode: data.profit_center_code, // Handle profit center code
        cost: data.cost // Ensure cost is preserved
      };

      return { success: true, data: transformedData };
    } catch (error) {
      console.error('❌ Exception updating material:', error);
      return { success: false, error: 'Failed to update material: ' + (error as Error).message };
    }
  }

  static async deleteMaterial(materialId: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase || !(await AuthManager.shouldUseSupabase())) {
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
    if (!supabase || !(await AuthManager.shouldUseSupabase())) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }

    try {
      // Transform camelCase to snake_case for Supabase
      const supabaseSite = {
        ...site,
        last_updated: site.lastUpdated,
        // Transform coordinates array to PostgreSQL POINT format
        coordinates: `(${site.coordinates[0]},${site.coordinates[1]})`,
        qr_code: site.qrCode || `SITE-${generateUUID()}`, // Generate QR code if not provided
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
    if (!supabase || !(await AuthManager.shouldUseSupabase())) {
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
    if (!supabase || !(await AuthManager.shouldUseSupabase())) {
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
    if (!supabase || !(await AuthManager.shouldUseSupabase())) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }

    try {
      const supabaseEmployees = employees.map(employee => ({
        name: employee.name,
        type: employee.type,
        department: employee.department,
        position: employee.position,
        blood_group: employee.bloodGroup,
        site: employee.site,
        qr_code: employee.qrCode || `EMP-${generateUUID()}`, // Generate QR code if not provided
        status: employee.status,
        photo: employee.photo,
        email: employee.email,
        phone: employee.phone,
        old_id: employee.oldId, // Map oldId to old_id
        companyId: employee.companyId || null, // Handle empty string for UUID field
        cost_center_code: employee.costCenterCode, // Handle cost center code
        profit_center_code: employee.profitCenterCode, // Handle profit center code
        hourly_rate: employee.hourlyRate, // Add hourly_rate mapping
        last_updated: employee.lastUpdated,
        created_at: employee.createdAt
      }));

      // No cleanup needed since we're explicitly mapping fields

      const { data, error } = await supabase
        .from('employees')
        .insert(supabaseEmployees)
        .select();

      if (error) {
        console.error('Error bulk creating employees in Supabase:', error);
        return { success: false, error: error.message };
      }

      // Transform snake_case back to camelCase and add auto-generated fields
      const transformedData: Employee[] = (data || []).map(employee => ({
        id: employee.id, // Auto-generated by Supabase
        name: employee.name,
        type: employee.type,
        department: employee.department,
        position: employee.position,
        bloodGroup: employee.blood_group,
        site: employee.site,
        qrCode: `EMP-${employee.id}`, // Generate QR code from auto-generated ID
        status: employee.status,
        photo: employee.photo,
        email: employee.email,
        phone: employee.phone,
        oldId: employee.old_id, // Map old_id back to oldId
        companyId: employee.companyId || null, // Handle empty string for UUID field
        costCenterCode: employee.cost_center_code, // Handle cost center code
        profitCenterCode: employee.profit_center_code, // Handle profit center code
        hourlyRate: employee.hourly_rate, // Map hourly_rate back to camelCase
        createdAt: employee.created_at,
        lastUpdated: employee.last_updated
      }));

      return { success: true, data: transformedData };
    } catch (error) {
      console.error('Error bulk creating employees:', error);
      return { success: false, error: 'Failed to bulk create employees' };
    }
  }

  static async bulkCreateEquipment(equipment: Equipment[]): Promise<{ success: boolean; data?: Equipment[]; error?: string; errors?: string[] }> {
    if (!supabase || !(await AuthManager.shouldUseSupabase())) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }

    try {
      const supabaseEquipment = equipment.map(eq => ({
        id: crypto.randomUUID(), // Generate UUID since the table doesn't have a default
        custom_equipment_id: eq.custom_equipment_id,
        name: eq.name,
        type: eq.type,
        model: eq.model,
        site: eq.site,
        qr_code: eq.qrCode || `EQP-${crypto.randomUUID()}`, // Generate QR code if not provided
        status: eq.status,
        operational_status: eq.operational_status,
        serial_number: eq.serialNumber,
        old_id: eq.oldId, // Map oldId to old_id
        cost_center_code: eq.costCenterCode, // Handle cost center code
        profit_center_code: eq.profitCenterCode, // Handle profit center code
        hourly_rate: eq.hourly_rate, // Handle hourly_rate mapping
        usage_duration: eq.usageDuration,
        standby_duration: eq.standbyDuration,
        maintenance_duration: eq.maintenanceDuration,
        last_updated: eq.lastUpdated,
        created_at: eq.createdAt
      }));

      // No cleanup needed since we're explicitly mapping fields

      const { data, error } = await supabase
        .from('equipment')
        .insert(supabaseEquipment)
        .select();

      if (error) {
        console.error('Error bulk creating equipment in Supabase:', error);
        return { success: false, error: error.message };
      }

      // Transform snake_case back to camelCase and add generated fields
      const transformedData: Equipment[] = (data || []).map(eq => ({
        id: eq.id, // Generated by application since table doesn't have default
        custom_equipment_id: eq.custom_equipment_id,
        name: eq.name,
        type: eq.type,
        model: eq.model,
        site: eq.site,
        qrCode: `EQP-${eq.id}`, // Generate QR code from auto-generated ID
        status: eq.status,
        operational_status: eq.operational_status,
        serialNumber: eq.serial_number,
        oldId: eq.old_id, // Map old_id back to oldId
        costCenterCode: eq.cost_center_code, // Handle cost center code
        profitCenterCode: eq.profit_center_code, // Handle profit center code
        hourly_rate: eq.hourly_rate, // Ensure hourly_rate is preserved
        usageDuration: eq.usage_duration,
        standbyDuration: eq.standby_duration,
        maintenanceDuration: eq.maintenance_duration,
        createdAt: eq.created_at,
        lastUpdated: eq.last_updated
      }));

      return { success: true, data: transformedData };
    } catch (error) {
      console.error('Error bulk creating equipment:', error);
      return { success: false, error: 'Failed to bulk create equipment' };
    }
  }

  // Log Operations
  static async createMaterialLog(materialLog: any): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!supabase || !(await AuthManager.shouldUseSupabase())) {
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
    if (!supabase || !(await AuthManager.shouldUseSupabase())) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }

    try {
      console.log('Creating employee log in Supabase:', employeeLog);
      // Extract hours from notes if present and numeric, else set to null
      let regularHours = null;
      let overtimeHours = null;
      let totalWorkHours = null;
      if (employeeLog.notes) {
        // Parse numbers with optional decimal and 'h' suffix (e.g., 'Regular: 1.2h')
        const regMatch = employeeLog.notes.match(/Regular\s*:?[\s]*([0-9]+(?:\.[0-9]+)?)h?/i);
        const otMatch = employeeLog.notes.match(/OT\s*:?[\s]*([0-9]+(?:\.[0-9]+)?)h?/i);
        const totalMatch = employeeLog.notes.match(/Total\s*:?[\s]*([0-9]+(?:\.[0-9]+)?)h?/i);
        if (regMatch) regularHours = parseFloat(regMatch[1]);
        if (otMatch) overtimeHours = parseFloat(otMatch[1]);
        if (totalMatch) totalWorkHours = parseFloat(totalMatch[1]);
      }
      // Transform camelCase to snake_case for Supabase
      const supabaseEmployeeLog = {
        ...employeeLog,
        employee_id: employeeLog.employeeId,
        employee_name: employeeLog.employeeName,
        created_at: employeeLog.createdAt,
        old_id: employeeLog.oldId, // Use snake_case for DB
        regular_hours: regularHours,
        overtime_hours: overtimeHours,
        total_work_hours: totalWorkHours
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
    if (!supabase || !(await AuthManager.shouldUseSupabase())) {
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
        old_id: equipmentLog.oldId, // Use snake_case for DB
        usage_duration: equipmentLog.usageDuration // Map usageDuration to usage_duration
      };
      delete (supabaseEquipmentLog as any).equipmentId;
      delete (supabaseEquipmentLog as any).equipmentName;
      delete (supabaseEquipmentLog as any).equipmentType;
      delete (supabaseEquipmentLog as any).createdAt;
      delete (supabaseEquipmentLog as any).oldId; // Remove camelCase property
      delete (supabaseEquipmentLog as any).usageDuration;

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
    if (!supabase || !(await AuthManager.shouldUseSupabase())) {
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
                  completed_date: maintenanceLog.completion_date, // Fixed: was completion_date, should be completed_date
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
    if (!supabase || !(await AuthManager.shouldUseSupabase())) {
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
    if (!supabase || !(await AuthManager.shouldUseSupabase())) {
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
    if (!supabase || !(await AuthManager.shouldUseSupabase())) {
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
    if (!supabase || !(await AuthManager.shouldUseSupabase())) {
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
    if (!supabase || !(await AuthManager.shouldUseSupabase())) {
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
    if (!supabase || !(await AuthManager.shouldUseSupabase())) {
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
    if (!supabase || !(await AuthManager.shouldUseSupabase())) {
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

  // Preventive Maintenance Configuration Operations
  static async getAllPreventiveMaintenanceConfigs(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    if (!supabase || !(await AuthManager.shouldUseSupabase())) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }

    try {
      const { data, error } = await supabase
        .from('preventive_maintenance_configs')
        .select('*')
        .order('equipment_type');

      if (error) {
        console.error('Error fetching preventive maintenance configs from Supabase:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching preventive maintenance configs:', error);
      return { success: false, error: 'Failed to fetch preventive maintenance configs' };
    }
  }

  static async createPreventiveMaintenanceConfig(config: any): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!supabase || !(await AuthManager.shouldUseSupabase())) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }

    try {
      console.log('Creating preventive maintenance config in Supabase:', config);
      
      const { data, error } = await supabase
        .from('preventive_maintenance_configs')
        .insert([config])
        .select()
        .single();

      if (error) {
        console.error('Error creating preventive maintenance config in Supabase:', error);
        return { success: false, error: error.message };
      }

      console.log('Successfully created preventive maintenance config in Supabase:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Error creating preventive maintenance config:', error);
      return { success: false, error: 'Failed to create preventive maintenance config' };
    }
  }

  static async updatePreventiveMaintenanceConfig(configId: string, updateData: any): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!supabase || !(await AuthManager.shouldUseSupabase())) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }

    try {
      console.log('Updating preventive maintenance config in Supabase:', configId, updateData);
      
      const { data, error } = await supabase
        .from('preventive_maintenance_configs')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', configId)
        .select()
        .single();

      if (error) {
        console.error('Error updating preventive maintenance config in Supabase:', error);
        return { success: false, error: error.message };
      }

      console.log('Successfully updated preventive maintenance config in Supabase:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Error updating preventive maintenance config:', error);
      return { success: false, error: 'Failed to update preventive maintenance config' };
    }
  }

  static async deletePreventiveMaintenanceConfig(configId: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase || !(await AuthManager.shouldUseSupabase())) {
      return { success: false, error: 'Supabase not configured or not in Supabase mode' };
    }

    try {
      console.log('Deleting preventive maintenance config in Supabase:', configId);
      
      const { error } = await supabase
        .from('preventive_maintenance_configs')
        .delete()
        .eq('id', configId);

      if (error) {
        console.error('Error deleting preventive maintenance config in Supabase:', error);
        return { success: false, error: error.message };
      }

      console.log('Successfully deleted preventive maintenance config in Supabase:', configId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting preventive maintenance config:', error);
      return { success: false, error: 'Failed to delete preventive maintenance config' };
    }
  }
}