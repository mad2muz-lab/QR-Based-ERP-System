import { DataStorage } from './dataStorage';
import { supabase } from './supabaseClient';

// Function to create separate log tables
export const createSeparateLogTables = async (): Promise<{
  success: boolean;
  message: string;
  details?: string[];
}> => {
  try {
    if (!supabase) {
      return {
        success: false,
        message: 'Supabase not configured. Please connect to Supabase first.'
      };
    }

    const results: string[] = [];

    // Test if employee_logs table exists
    const { data: empExists, error: empCheckError } = await supabase
      .from('employee_logs')
      .select('count', { count: 'exact', head: true });
    
    if (empCheckError && empCheckError.code === '42P01') {
      // Table doesn't exist, we need to create it
      results.push('❌ employee_logs table does not exist. Please run the migration manually in Supabase SQL editor.');
    } else if (empCheckError) {
      results.push(`❌ Error checking employee_logs table: ${empCheckError.message}`);
    } else {
      results.push('✓ employee_logs table already exists');
    }

    // Test if equipment_logs table exists
    const { data: eqExists, error: eqCheckError } = await supabase
      .from('equipment_logs')
      .select('count', { count: 'exact', head: true });
    
    if (eqCheckError && eqCheckError.code === '42P01') {
      // Table doesn't exist
      results.push('❌ equipment_logs table does not exist. Please run the migration manually in Supabase SQL editor.');
    } else if (eqCheckError) {
      results.push(`❌ Error checking equipment_logs table: ${eqCheckError.message}`);
    } else {
      results.push('✓ equipment_logs table already exists');
    }

    // Test if material_logs table exists
    const { data: matExists, error: matCheckError } = await supabase
      .from('material_logs')
      .select('count', { count: 'exact', head: true });
    
    if (matCheckError && matCheckError.code === '42P01') {
      // Table doesn't exist
      results.push('❌ material_logs table does not exist. Please run the migration manually in Supabase SQL editor.');
    } else if (matCheckError) {
      results.push(`❌ Error checking material_logs table: ${matCheckError.message}`);
    } else {
      results.push('✓ material_logs table already exists');
    }

    const hasErrors = results.some(result => result.includes('❌'));
    
    if (hasErrors) {
      results.push('');
      results.push('📋 To create the tables manually, run this SQL in your Supabase SQL editor:');
      results.push('');
      results.push('-- Copy and paste the content from: supabase/migrations/20250114000000_separate_log_tables.sql');
    }
    
    return {
      success: !hasErrors,
      message: hasErrors ? 'Some tables failed to create' : 'All separate log tables created successfully',
      details: results
    };

  } catch (error: any) {
    return {
      success: false,
      message: `Error creating separate log tables: ${error.message}`
    };
  }
};

export const migrateDataToSupabase = async (): Promise<{
  success: boolean;
  message: string;
  details?: {
    users: number;
    employees: number;
    equipment: number;
    materials: number;
    sites: number;
    timeLogs: number;
  };
}> => {
  try {
    if (!supabase) {
      return {
        success: false,
        message: 'Supabase not configured. Please connect to Supabase first.'
      };
    }

    // Get current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        message: 'Authentication required for data migration. Please sign in first.'
      };
    }

    // Load all local data
    const users = DataStorage.loadUsers();
    const employees = DataStorage.loadEmployees();
    const equipment = DataStorage.loadEquipment();
    const materials = DataStorage.loadMaterials();
    const sites = DataStorage.loadSites();
    const timeLogs = DataStorage.loadTimeLogs();

    // Migrate users
    const { error: usersError, count: usersCount } = await supabase
      .from('users')
      .upsert(
        users.map(user => ({
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name,
          email: user.email,
          site: user.site,
          created_at: user.createdAt,
          last_login: user.lastLogin
        }))
      );

    if (usersError) throw usersError;

    // Migrate employees
    const { error: employeesError, count: employeesCount } = await supabase
      .from('employees')
      .upsert(
        employees.map(employee => ({
          id: employee.id,
          name: employee.name,
          type: employee.type,
          department: employee.department,
          position: employee.position,
          blood_group: employee.bloodGroup,
          site: employee.site,
          qr_code: employee.qrCode,
          status: employee.status,
          created_at: employee.createdAt,
          last_updated: employee.lastUpdated,
          photo: employee.photo,
          email: employee.email,
          phone: employee.phone
        }))
      );

    if (employeesError) throw employeesError;

    // Migrate equipment
    const { error: equipmentError, count: equipmentCount } = await supabase
      .from('equipment')
      .upsert(
        equipment.map(item => ({
          id: item.id,
          name: item.name,
          type: item.type,
          model: item.model,
          site: item.site,
          qr_code: item.qrCode,
          status: item.status,
          created_at: item.createdAt,
          last_updated: item.lastUpdated,
          serial_number: item.serialNumber
        }))
      );

    if (equipmentError) throw equipmentError;

    // Migrate materials
    const { error: materialsError, count: materialsCount } = await supabase
      .from('materials')
      .upsert(
        materials.map(material => ({
          id: material.id,
          name: material.name,
          type: material.type,
          unit: material.unit,
          site: material.site,
          qr_code: material.qrCode,
          quantity: material.quantity,
          status: material.status,
          created_at: material.createdAt,
          last_updated: material.lastUpdated,
          use: material.use
        }))
      );

    if (materialsError) throw materialsError;

    // Migrate sites
    const { error: sitesError, count: sitesCount } = await supabase
      .from('sites')
      .upsert(
        sites.map(site => ({
          id: site.id,
          name: site.name,
          province: site.province,
          coordinates: site.coordinates,
          address: site.address,
          manager: site.manager,
          last_updated: site.lastUpdated,
          type: site.type
        }))
      );

    if (sitesError) throw sitesError;

    // Migrate time logs
    const { error: timeLogsError, count: timeLogsCount } = await supabase
      .from('time_logs')
      .upsert(
        timeLogs.map(log => ({
          id: log.id,
          entity_id: log.entityId,
          entity_type: log.entityType,
          action: log.action,
          timestamp: log.timestamp,
          site: log.site,
          notes: log.notes,
          location: log.location,
          quantity: log.quantity
        }))
      );

    if (timeLogsError) throw timeLogsError;

    return {
      success: true,
      message: 'Data migration completed successfully',
      details: {
        users: usersCount || users.length,
        employees: employeesCount || employees.length,
        equipment: equipmentCount || equipment.length,
        materials: materialsCount || materials.length,
        sites: sitesCount || sites.length,
        timeLogs: timeLogsCount || timeLogs.length
      }
    };
  } catch (error: any) {
    console.error('Data migration error:', error);
    return {
      success: false,
      message: `Data migration failed: ${error.message}`
    };
  }
};