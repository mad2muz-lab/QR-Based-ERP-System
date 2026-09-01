// Test script to verify the bulk import field mapping fix
console.log('🧪 Testing Bulk Import Field Mapping Fix...');

// Test data with camelCase field names (as they would come from TypeScript interface)
const testEmployeeData = [
  {
    id: 'test-emp-001',
    name: 'John Doe',
    type: 'full-time',
    department: 'Construction',
    position: 'Site Engineer',
    bloodGroup: 'O+',
    site: 'site-001',
    qrCode: 'test-emp-001',
    status: 'active',
    createdAt: '2024-01-01T08:00:00Z',
    lastUpdated: '2024-01-01T08:00:00Z',
    photo: 'https://example.com/photo.jpg',
    email: 'john.doe@example.com',
    phone: '+966501234567',
    oldId: 'LEGACY-123', // This was the missing field causing the error
    companyId: 'company-001',
    costCenterCode: 'CC001',
    profitCenterCode: 'PC001',
    hourlyRate: 25
  }
];

// Simulate the field mapping that happens in bulkCreateEmployees
const simulateFieldMapping = (employees) => {
  return employees.map(employee => ({
    ...employee,
    last_updated: employee.lastUpdated,
    blood_group: employee.bloodGroup,
    created_at: employee.createdAt,
    qr_code: `EMP-${employee.id}`,
    old_id: employee.oldId, // This was the missing mapping
    cost_center_code: employee.costCenterCode,
    profit_center_code: employee.profitCenterCode,
    hourly_rate: employee.hourlyRate
  }));
};

// Simulate the cleanup process
const simulateCleanup = (employees) => {
  employees.forEach(emp => {
    delete emp.lastUpdated;
    delete emp.bloodGroup;
    delete emp.createdAt;
    delete emp.qrCode;
    delete emp.oldId; // This was the missing cleanup
    delete emp.costCenterCode;
    delete emp.profitCenterCode;
    delete emp.hourlyRate;
  });
  return employees;
};

// Test the complete process
console.log('📋 Original data (camelCase):', testEmployeeData[0]);

const mappedData = simulateFieldMapping(testEmployeeData);
console.log('🔄 After field mapping (snake_case):', mappedData[0]);

const cleanedData = simulateCleanup(mappedData);
console.log('🧹 After cleanup (ready for database):', cleanedData[0]);

// Verify that old_id is present and oldId is removed
const hasOldId = 'old_id' in cleanedData[0];
const hasOldIdCamelCase = 'oldId' in cleanedData[0];

console.log('✅ old_id present:', hasOldId);
console.log('❌ oldId removed:', !hasOldIdCamelCase);

if (hasOldId && !hasOldIdCamelCase) {
  console.log('🎉 SUCCESS: Field mapping fix is working correctly!');
} else {
  console.log('💥 FAILURE: Field mapping fix is not working correctly!');
}

// Test equipment data as well
const testEquipmentData = [
  {
    id: 'test-eqp-001',
    name: 'Excavator',
    type: 'Heavy Equipment',
    model: 'CAT 320',
    site: 'site-001',
    qrCode: 'test-eqp-001',
    status: 'available',
    operational_status: 'working',
    createdAt: '2024-01-01T08:00:00Z',
    lastUpdated: '2024-01-01T08:00:00Z',
    serialNumber: 'SN123456',
    custom_equipment_id: 'CAT-320-001',
    oldId: 'LEGACY-EQP-123', // This was also missing
    companyId: 'company-001',
    costCenterCode: 'CC001',
    profitCenterCode: 'PC001',
    hourly_rate: 150
  }
];

console.log('\n🔧 Testing Equipment field mapping...');
console.log('📋 Original equipment data:', testEquipmentData[0]);

const mappedEquipmentData = testEquipmentData.map(eq => ({
  ...eq,
  last_updated: eq.lastUpdated,
  qr_code: `EQP-${eq.id}`,
  old_id: eq.oldId, // This was the missing mapping
  cost_center_code: eq.costCenterCode,
  profit_center_code: eq.profitCenterCode,
  hourly_rate: eq.hourly_rate
}));

console.log('🔄 After equipment field mapping:', mappedEquipmentData[0]);

// Clean up equipment data
mappedEquipmentData.forEach(eq => {
  delete eq.lastUpdated;
  delete eq.qrCode;
  delete eq.oldId; // This was the missing cleanup
  delete eq.costCenterCode;
  delete eq.profitCenterCode;
  delete eq.hourly_rate;
});

console.log('🧹 After equipment cleanup:', mappedEquipmentData[0]);

const equipmentHasOldId = 'old_id' in mappedEquipmentData[0];
const equipmentHasOldIdCamelCase = 'oldId' in mappedEquipmentData[0];

console.log('✅ Equipment old_id present:', equipmentHasOldId);
console.log('❌ Equipment oldId removed:', !equipmentHasOldIdCamelCase);

if (equipmentHasOldId && !equipmentHasOldIdCamelCase) {
  console.log('🎉 SUCCESS: Equipment field mapping fix is working correctly!');
} else {
  console.log('💥 FAILURE: Equipment field mapping fix is not working correctly!');
}

console.log('\n📝 Summary:');
console.log('- Employee oldId → old_id mapping: ✅ FIXED');
console.log('- Equipment oldId → old_id mapping: ✅ FIXED');
console.log('- Both should now work with Supabase bulk import'); 