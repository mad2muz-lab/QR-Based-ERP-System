import { DataStorage } from './dataStorage';

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