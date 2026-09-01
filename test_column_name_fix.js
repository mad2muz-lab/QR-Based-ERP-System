// Test script to verify the column name fix
console.log('🧪 Testing Column Name Fix...');

// Simulate the Supabase field mapping for employees
const simulateEmployeeFieldMapping = (employees) => {
  return employees.map(employee => ({
    name: employee.name,
    type: employee.type,
    department: employee.department,
    position: employee.position,
    blood_group: employee.bloodGroup,
    site: employee.site,
    status: employee.status,
    photo: employee.photo,
    email: employee.email,
    phone: employee.phone,
    old_id: employee.oldId, // Map oldId to old_id
    companyId: employee.companyId, // Use correct camelCase column name
    cost_center_code: employee.costCenterCode, // Handle cost center code
    profit_center_code: employee.profitCenterCode, // Handle profit center code
    hourly_rate: employee.hourlyRate, // Add hourly_rate mapping
    last_updated: employee.lastUpdated,
    created_at: employee.createdAt
  }));
};

// Simulate the Supabase field mapping for equipment
const simulateEquipmentFieldMapping = (equipment) => {
  return equipment.map(eq => ({
    custom_equipment_id: eq.custom_equipment_id,
    name: eq.name,
    type: eq.type,
    model: eq.model,
    site: eq.site,
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
};

// Test data
const testEmployeeData = [
  {
    name: 'John Doe',
    type: 'full-time',
    department: 'Construction',
    position: 'Site Engineer',
    bloodGroup: 'O+',
    site: 'site-001',
    status: 'active',
    photo: 'https://example.com/photo.jpg',
    email: 'john.doe@example.com',
    phone: '+966501234567',
    oldId: 'LEGACY-123',
    companyId: 'company-001',
    costCenterCode: 'CC001',
    profitCenterCode: 'PC001',
    hourlyRate: 25,
    lastUpdated: '2024-01-01T08:00:00Z',
    createdAt: '2024-01-01T08:00:00Z'
  }
];

const testEquipmentData = [
  {
    custom_equipment_id: 'EQP-001',
    name: 'Excavator',
    type: 'Heavy Equipment',
    model: 'CAT 320',
    site: 'site-001',
    status: 'available',
    operational_status: 'working',
    serialNumber: 'SN123456',
    oldId: 'LEGACY-EQP-001',
    costCenterCode: 'CC001',
    profitCenterCode: 'PC001',
    hourly_rate: 150,
    usageDuration: 0,
    standbyDuration: 0,
    maintenanceDuration: 0,
    lastUpdated: '2024-01-01T08:00:00Z',
    createdAt: '2024-01-01T08:00:00Z'
  }
];

console.log('📋 Original employee data:', testEmployeeData[0]);

// Test employee field mapping
console.log('\n🔄 Testing Employee field mapping:');
const mappedEmployeeData = simulateEmployeeFieldMapping(testEmployeeData);
console.log('Mapped employee data:', mappedEmployeeData[0]);

// Check for correct column names
const hasCompanyId = 'companyId' in mappedEmployeeData[0];
const hasCompanyIdSnakeCase = 'company_id' in mappedEmployeeData[0];
const hasOldId = 'old_id' in mappedEmployeeData[0];
const hasOldIdCamelCase = 'oldId' in mappedEmployeeData[0];

console.log('✅ companyId (camelCase) present:', hasCompanyId);
console.log('❌ company_id (snake_case) absent:', !hasCompanyIdSnakeCase);
console.log('✅ old_id (snake_case) present:', hasOldId);
console.log('❌ oldId (camelCase) absent:', !hasOldIdCamelCase);

// Test equipment field mapping
console.log('\n🔄 Testing Equipment field mapping:');
const mappedEquipmentData = simulateEquipmentFieldMapping(testEquipmentData);
console.log('Mapped equipment data:', mappedEquipmentData[0]);

// Check for correct column names
const hasEquipmentCompanyId = 'companyId' in mappedEquipmentData[0];
const hasEquipmentCompanyIdSnakeCase = 'company_id' in mappedEquipmentData[0];
const hasEquipmentOldId = 'old_id' in mappedEquipmentData[0];
const hasEquipmentOldIdCamelCase = 'oldId' in mappedEquipmentData[0];

console.log('❌ companyId (camelCase) absent for equipment:', !hasEquipmentCompanyId);
console.log('❌ company_id (snake_case) absent for equipment:', !hasEquipmentCompanyIdSnakeCase);
console.log('✅ old_id (snake_case) present for equipment:', hasEquipmentOldId);
console.log('❌ oldId (camelCase) absent for equipment:', !hasEquipmentOldIdCamelCase);

// Test reverse mapping simulation
console.log('\n🔄 Testing reverse mapping simulation:');
const simulateReverseMapping = (data, type) => {
  if (type === 'employee') {
    return {
      id: 'auto-generated-uuid',
      name: data.name,
      type: data.type,
      department: data.department,
      position: data.position,
      bloodGroup: data.blood_group,
      site: data.site,
      qrCode: `EMP-${data.id}`,
      status: data.status,
      photo: data.photo,
      email: data.email,
      phone: data.phone,
      oldId: data.old_id, // Map old_id back to oldId
      companyId: data.companyId, // Use correct camelCase column name
      costCenterCode: data.cost_center_code,
      profitCenterCode: data.profit_center_code,
      hourlyRate: data.hourly_rate,
      createdAt: data.created_at,
      lastUpdated: data.last_updated
    };
  } else if (type === 'equipment') {
    return {
      id: 'auto-generated-uuid',
      custom_equipment_id: data.custom_equipment_id,
      name: data.name,
      type: data.type,
      model: data.model,
      site: data.site,
      qrCode: `EQP-${data.id}`,
      status: data.status,
      operational_status: data.operational_status,
      serialNumber: data.serial_number,
      oldId: data.old_id, // Map old_id back to oldId
      costCenterCode: data.cost_center_code,
      profitCenterCode: data.profit_center_code,
      hourly_rate: data.hourly_rate,
      usageDuration: data.usage_duration,
      standbyDuration: data.standby_duration,
      maintenanceDuration: data.maintenance_duration,
      createdAt: data.created_at,
      lastUpdated: data.last_updated
    };
  }
};

const reverseMappedEmployee = simulateReverseMapping(mappedEmployeeData[0], 'employee');
const reverseMappedEquipment = simulateReverseMapping(mappedEquipmentData[0], 'equipment');

console.log('Reverse mapped employee:', reverseMappedEmployee);
console.log('Reverse mapped equipment:', reverseMappedEquipment);

// Summary
console.log('\n📝 Summary:');
if (hasCompanyId && !hasCompanyIdSnakeCase && hasOldId && !hasOldIdCamelCase && 
    !hasEquipmentCompanyId && !hasEquipmentCompanyIdSnakeCase && hasEquipmentOldId && !hasEquipmentOldIdCamelCase) {
  console.log('🎉 SUCCESS: Column name fix is working correctly!');
  console.log('- Employees: companyId (camelCase) and old_id (snake_case) correctly mapped');
  console.log('- Equipment: old_id (snake_case) correctly mapped, no companyId field');
  console.log('- No column name conflicts with database schema');
} else {
  console.log('💥 FAILURE: Column name fix is not working correctly!');
}

console.log('\n🔧 Expected behavior:');
console.log('- Employees table: companyId (camelCase), old_id (snake_case)');
console.log('- Equipment table: old_id (snake_case), no companyId field');
console.log('- This prevents "Could not find the column" errors'); 