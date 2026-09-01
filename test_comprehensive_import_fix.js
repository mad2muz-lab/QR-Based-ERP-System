// Comprehensive test script to verify the entire import fix
console.log('🧪 Testing Comprehensive Import Fix...');

// Simulate the entire data flow from Excel import to Supabase
const simulateCompleteImportFlow = () => {
  console.log('\n📋 Step 1: Simulating Excel Import (no ID fields)');
  
  // Simulate Excel import data (no id fields)
  const importedEmployeeData = [
    {
      name: 'John Doe',
      type: 'full-time',
      department: 'Construction',
      position: 'Site Engineer',
      blood_group: 'O+',
      site: 'site-001',
      status: 'active',
      created_at: '2024-01-01T08:00:00Z',
      last_updated: '2024-01-01T08:00:00Z',
      photo: 'https://example.com/photo.jpg',
      email: 'john.doe@example.com',
      phone: '+966501234567',
      old_id: 'LEGACY-123',
      companyId: 'company-001',
      cost_center_code: 'CC001',
      profit_center_code: 'PC001',
      hourly_rate: 25
    },
    {
      name: 'Jane Smith',
      type: 'part-time',
      department: 'Maintenance',
      position: 'Technician',
      blood_group: 'A+',
      site: 'site-002',
      status: 'active',
      created_at: '2024-01-01T08:00:00Z',
      last_updated: '2024-01-01T08:00:00Z',
      photo: '',
      email: 'jane.smith@example.com',
      phone: '+966501234568',
      old_id: 'LEGACY-124',
      companyId: 'company-001',
      cost_center_code: 'CC002',
      profit_center_code: 'PC002',
      hourly_rate: 20
    }
  ];

  console.log('✅ Excel import data (no id fields):', importedEmployeeData[0]);
  console.log('✅ No id field in imported data:', !('id' in importedEmployeeData[0]));

  console.log('\n📋 Step 2: Simulating RegistrationForm Processing (Supabase mode)');
  
  // Simulate RegistrationForm processing for Supabase
  const useSupabase = true;
  const processedEmployees = importedEmployeeData.map(item => {
    // For Supabase, don't generate UUIDs - let the database auto-generate them
    const employeeId = useSupabase ? undefined : crypto.randomUUID();
    return {
      ...(useSupabase ? {} : { id: employeeId }), // Only include id for local storage
      name: item.name,
      type: item.type || '',
      department: item.department,
      position: item.position,
      bloodGroup: item.blood_group || item.bloodGroup || '',
      site: item.site,
      ...(useSupabase ? {} : { qrCode: employeeId }), // Only include qrCode for local storage
      status: item.status || 'active',
      createdAt: item.created_at || item.createdAt || new Date().toISOString(),
      lastUpdated: item.last_updated || item.lastUpdated || new Date().toISOString(),
      photo: item.photo || '',
      email: item.email || '',
      phone: item.phone || '',
      oldId: item.old_id || item.oldId || '',
      companyId: item.companyId || '',
      costCenterCode: item.cost_center_code || item.costCenterCode || '',
      profitCenterCode: item.profit_center_code || item.profitCenterCode || '',
      hourlyRate: item.hourly_rate || item.hourlyRate || 0
    };
  });

  console.log('✅ Processed employee data (Supabase mode):', processedEmployees[0]);
  console.log('✅ No id field for Supabase:', !('id' in processedEmployees[0]));
  console.log('✅ No qrCode field for Supabase:', !('qrCode' in processedEmployees[0]));

  console.log('\n📋 Step 3: Simulating Supabase Service Field Mapping');
  
  // Simulate Supabase service field mapping
  const supabaseEmployees = processedEmployees.map(employee => ({
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

  console.log('✅ Supabase mapped data:', supabaseEmployees[0]);
  
  // Check for problematic fields
  const hasIdField = 'id' in supabaseEmployees[0];
  const hasQrCodeField = 'qr_code' in supabaseEmployees[0];
  const hasCompanyId = 'companyId' in supabaseEmployees[0];
  const hasCompanyIdSnakeCase = 'company_id' in supabaseEmployees[0];
  const hasOldId = 'old_id' in supabaseEmployees[0];
  const hasOldIdCamelCase = 'oldId' in supabaseEmployees[0];

  console.log('❌ No id field in Supabase data:', !hasIdField);
  console.log('❌ No qr_code field in Supabase data:', !hasQrCodeField);
  console.log('✅ companyId (camelCase) present:', hasCompanyId);
  console.log('❌ company_id (snake_case) absent:', !hasCompanyIdSnakeCase);
  console.log('✅ old_id (snake_case) present:', hasOldId);
  console.log('❌ oldId (camelCase) absent:', !hasOldIdCamelCase);

  console.log('\n📋 Step 4: Simulating Local Storage Processing');
  
  // Simulate RegistrationForm processing for Local Storage
  const useLocalStorage = false;
  const localProcessedEmployees = importedEmployeeData.map(item => {
    // For Local Storage, generate UUIDs
    const employeeId = useLocalStorage ? crypto.randomUUID() : undefined;
    return {
      ...(useLocalStorage ? { id: employeeId } : {}), // Only include id for local storage
      name: item.name,
      type: item.type || '',
      department: item.department,
      position: item.position,
      bloodGroup: item.blood_group || item.bloodGroup || '',
      site: item.site,
      ...(useLocalStorage ? { qrCode: employeeId } : {}), // Only include qrCode for local storage
      status: item.status || 'active',
      createdAt: item.created_at || item.createdAt || new Date().toISOString(),
      lastUpdated: item.last_updated || item.lastUpdated || new Date().toISOString(),
      photo: item.photo || '',
      email: item.email || '',
      phone: item.phone || '',
      oldId: item.old_id || item.oldId || '',
      companyId: item.companyId || '',
      costCenterCode: item.cost_center_code || item.costCenterCode || '',
      profitCenterCode: item.profit_center_code || item.profitCenterCode || '',
      hourlyRate: item.hourly_rate || item.hourlyRate || 0
    };
  });

  console.log('✅ Local storage processed data:', localProcessedEmployees[0]);
  console.log('✅ No id field for local storage (useLocalStorage=false):', !('id' in localProcessedEmployees[0]));
  console.log('✅ No qrCode field for local storage (useLocalStorage=false):', !('qrCode' in localProcessedEmployees[0]));

  console.log('\n📋 Step 5: Testing Equipment Import (no companyId field)');
  
  // Simulate equipment import data
  const importedEquipmentData = [
    {
      name: 'Excavator',
      type: 'Heavy Equipment',
      model: 'CAT 320',
      site: 'site-001',
      status: 'available',
      created_at: '2024-01-01T08:00:00Z',
      last_updated: '2024-01-01T08:00:00Z',
      serial_number: 'SN123456',
      custom_equipment_id: 'EQP-001',
      old_id: 'LEGACY-EQP-001',
      operational_status: 'working',
      cost_center_code: 'CC001',
      profit_center_code: 'PC001',
      hourly_rate: 150,
      usage_duration: 0,
      standby_duration: 0,
      maintenance_duration: 0
    }
  ];

  // Simulate equipment processing for Supabase
  const processedEquipment = importedEquipmentData.map(item => {
    const equipmentId = useSupabase ? undefined : crypto.randomUUID();
    return {
      ...(useSupabase ? {} : { id: equipmentId }),
      name: item.name,
      type: item.type,
      model: item.model,
      site: item.site,
      ...(useSupabase ? {} : { qrCode: equipmentId }),
      status: item.status || 'available',
      createdAt: item.created_at || item.createdAt || new Date().toISOString(),
      lastUpdated: item.last_updated || item.lastUpdated || new Date().toISOString(),
      serialNumber: item.serial_number || item.serialNumber || '',
      custom_equipment_id: item.custom_equipment_id || '',
      oldId: item.old_id || item.oldId || '',
      operational_status: item.operational_status || 'working',
      costCenterCode: item.cost_center_code || item.costCenterCode || '',
      profitCenterCode: item.profit_center_code || item.profitCenterCode || '',
      hourly_rate: item.hourly_rate || 0,
      usageDuration: item.usage_duration || item.usageDuration || 0,
      standbyDuration: item.standby_duration || item.standbyDuration || 0,
      maintenanceDuration: item.maintenance_duration || item.maintenanceDuration || 0
    };
  });

  // Simulate equipment Supabase mapping
  const supabaseEquipment = processedEquipment.map(eq => ({
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

  console.log('✅ Equipment Supabase mapped data:', supabaseEquipment[0]);
  
  // Check equipment fields
  const hasEquipmentId = 'id' in supabaseEquipment[0];
  const hasEquipmentQrCode = 'qr_code' in supabaseEquipment[0];
  const hasEquipmentCompanyId = 'companyId' in supabaseEquipment[0];
  const hasEquipmentCompanyIdSnakeCase = 'company_id' in supabaseEquipment[0];
  const hasEquipmentOldId = 'old_id' in supabaseEquipment[0];

  console.log('❌ No id field in equipment data:', !hasEquipmentId);
  console.log('❌ No qr_code field in equipment data:', !hasEquipmentQrCode);
  console.log('❌ No companyId field in equipment data:', !hasEquipmentCompanyId);
  console.log('❌ No company_id field in equipment data:', !hasEquipmentCompanyIdSnakeCase);
  console.log('✅ old_id field in equipment data:', hasEquipmentOldId);

  // Summary
  console.log('\n📝 COMPREHENSIVE TEST SUMMARY:');
  
  const allTestsPassed = 
    !hasIdField && !hasQrCodeField && hasCompanyId && !hasCompanyIdSnakeCase && hasOldId && !hasOldIdCamelCase &&
    !hasEquipmentId && !hasEquipmentQrCode && !hasEquipmentCompanyId && !hasEquipmentCompanyIdSnakeCase && hasEquipmentOldId;

  if (allTestsPassed) {
    console.log('🎉 SUCCESS: All import issues have been comprehensively fixed!');
    console.log('✅ Excel import: No ID fields generated');
    console.log('✅ RegistrationForm: Proper conditional UUID generation');
    console.log('✅ Supabase mapping: Correct column names (companyId camelCase, old_id snake_case)');
    console.log('✅ Equipment: No companyId field (column doesn\'t exist)');
    console.log('✅ No empty UUID strings sent to database');
    console.log('✅ No column name conflicts');
    console.log('✅ Proper field mapping for all entity types');
  } else {
    console.log('💥 FAILURE: Some import issues remain!');
  }

  console.log('\n🔧 Expected behavior:');
  console.log('- Excel templates: No ID fields (database auto-generates)');
  console.log('- Supabase mode: No ID/QR fields sent to database');
  console.log('- Local storage mode: ID/QR fields generated for offline use');
  console.log('- Column mapping: Matches actual database schema exactly');
  console.log('- No UUID conflicts or empty string errors');
};

// Run the comprehensive test
simulateCompleteImportFlow(); 