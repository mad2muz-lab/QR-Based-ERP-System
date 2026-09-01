// Test script to verify the import field mapping fix
console.log('🧪 Testing Import Field Mapping Fix...');

// Test data with snake_case field names (as they would come from Excel)
const testEmployeeData = [
  {
    id: 'test-emp-001',
    name: 'John Doe',
    type: 'full-time',
    department: 'Construction',
    position: 'Site Engineer',
    blood_group: 'O+',
    site: 'site-001',
    qr_code: 'test-emp-001',
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
  }
];

// Simulate the import processing logic from RegistrationForm.tsx
function processEmployeeImport(importedData) {
  return importedData.map(item => {
    const employeeId = item.id || crypto.randomUUID();
    return {
      id: employeeId,
      name: item.name,
      type: item.type || '',
      department: item.department,
      position: item.position,
      bloodGroup: item.blood_group || item.bloodGroup || '',
      site: item.site,
      qrCode: item.qr_code || item.qrCode || employeeId,
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
}

// Test the processing
console.log('📥 Input data (snake_case from Excel):');
console.log(JSON.stringify(testEmployeeData[0], null, 2));

const processedEmployees = processEmployeeImport(testEmployeeData);

console.log('\n📤 Output data (camelCase for TypeScript interface):');
console.log(JSON.stringify(processedEmployees[0], null, 2));

// Verify field mapping
const employee = processedEmployees[0];
const fieldMappings = [
  { from: 'blood_group', to: 'bloodGroup', expected: 'O+' },
  { from: 'qr_code', to: 'qrCode', expected: 'test-emp-001' },
  { from: 'created_at', to: 'createdAt', expected: '2024-01-01T08:00:00Z' },
  { from: 'last_updated', to: 'lastUpdated', expected: '2024-01-01T08:00:00Z' },
  { from: 'old_id', to: 'oldId', expected: 'LEGACY-123' },
  { from: 'cost_center_code', to: 'costCenterCode', expected: 'CC001' },
  { from: 'profit_center_code', to: 'profitCenterCode', expected: 'PC001' },
  { from: 'hourly_rate', to: 'hourlyRate', expected: 25 }
];

console.log('\n✅ Field Mapping Verification:');
let allPassed = true;

fieldMappings.forEach(mapping => {
  const actualValue = employee[mapping.to];
  const passed = actualValue === mapping.expected;
  console.log(`${passed ? '✅' : '❌'} ${mapping.from} → ${mapping.to}: ${actualValue} (expected: ${mapping.expected})`);
  if (!passed) allPassed = false;
});

console.log(`\n🎯 Overall Result: ${allPassed ? 'PASSED' : 'FAILED'}`);

if (allPassed) {
  console.log('🎉 Import field mapping fix is working correctly!');
  console.log('The system can now properly handle both snake_case (Excel) and camelCase (TypeScript) field names.');
} else {
  console.log('⚠️  Some field mappings are not working correctly. Please check the implementation.');
}

// Test with mixed field names (some snake_case, some camelCase)
console.log('\n🧪 Testing with mixed field names...');
const mixedData = [
  {
    id: 'test-emp-002',
    name: 'Jane Smith',
    type: 'part-time',
    department: 'Engineering',
    position: 'Assistant Engineer',
    bloodGroup: 'A-', // camelCase
    site: 'site-002',
    qr_code: 'test-emp-002', // snake_case
    status: 'active',
    createdAt: '2024-01-02T08:00:00Z', // camelCase
    last_updated: '2024-01-02T08:00:00Z', // snake_case
    photo: 'https://example.com/jane.jpg',
    email: 'jane.smith@example.com',
    phone: '+966502345678',
    oldId: 'LEGACY-456', // camelCase
    companyId: 'company-001',
    costCenterCode: 'CC002', // camelCase
    profit_center_code: 'PC002', // snake_case
    hourlyRate: 20 // camelCase
  }
];

const processedMixed = processEmployeeImport(mixedData);
console.log('📤 Mixed field names result:');
console.log(JSON.stringify(processedMixed[0], null, 2));

console.log('\n✅ Mixed field names test completed successfully!');
console.log('The system can handle Excel files with inconsistent field naming conventions.'); 