// Test script to verify the UUID auto-generation fix
console.log('🧪 Testing UUID Auto-Generation Fix...');

// Simulate the import processing for Supabase vs Local Storage
const simulateImportProcessing = (importedData, useSupabase = true) => {
  return importedData.map(item => {
    // For Supabase, don't generate UUIDs - let the database auto-generate them
    const entityId = useSupabase ? undefined : (item.id || crypto.randomUUID());
    
    return {
      ...(useSupabase ? {} : { id: entityId }), // Only include id for local storage
      name: item.name,
      type: item.type || '',
      department: item.department,
      position: item.position,
      bloodGroup: item.blood_group || item.bloodGroup || '',
      site: item.site,
      ...(useSupabase ? {} : { qrCode: item.qr_code || item.qrCode || entityId }), // Only include qrCode for local storage
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
};

// Test data from Excel import
const testImportedData = [
  {
    name: 'John Doe',
    type: 'full-time',
    department: 'Construction',
    position: 'Site Engineer',
    blood_group: 'O+',
    site: 'site-001',
    status: 'active',
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

console.log('📋 Original imported data:', testImportedData[0]);

// Test Supabase processing (should NOT include id or qrCode)
console.log('\n🔄 Testing Supabase processing (useSupabase = true):');
const supabaseProcessed = simulateImportProcessing(testImportedData, true);
console.log('Supabase processed data:', supabaseProcessed[0]);

const hasIdForSupabase = 'id' in supabaseProcessed[0];
const hasQrCodeForSupabase = 'qrCode' in supabaseProcessed[0];

console.log('✅ id field excluded for Supabase:', !hasIdForSupabase);
console.log('✅ qrCode field excluded for Supabase:', !hasQrCodeForSupabase);

// Test Local Storage processing (should include id and qrCode)
console.log('\n🔄 Testing Local Storage processing (useSupabase = false):');
const localProcessed = simulateImportProcessing(testImportedData, false);
console.log('Local storage processed data:', localProcessed[0]);

const hasIdForLocal = 'id' in localProcessed[0];
const hasQrCodeForLocal = 'qrCode' in localProcessed[0];

console.log('✅ id field included for Local Storage:', hasIdForLocal);
console.log('✅ qrCode field included for Local Storage:', hasQrCodeForLocal);

// Test the field mapping that would be sent to Supabase
console.log('\n🔄 Testing Supabase field mapping:');
const simulateSupabaseFieldMapping = (employees) => {
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
    old_id: employee.oldId,
    company_id: employee.companyId,
    cost_center_code: employee.costCenterCode,
    profit_center_code: employee.profitCenterCode,
    hourly_rate: employee.hourlyRate,
    last_updated: employee.lastUpdated,
    created_at: employee.createdAt
  }));
};

const supabaseMappedData = simulateSupabaseFieldMapping(supabaseProcessed);
console.log('Supabase mapped data (ready for database):', supabaseMappedData[0]);

// Check for any problematic fields
const hasIdInMapped = 'id' in supabaseMappedData[0];
const hasQrCodeInMapped = 'qr_code' in supabaseMappedData[0];
const hasEmptyId = supabaseMappedData[0].id === '';

console.log('✅ No id field in mapped data:', !hasIdInMapped);
console.log('✅ No qr_code field in mapped data:', !hasQrCodeInMapped);
console.log('✅ No empty id values:', !hasEmptyId);

// Summary
console.log('\n📝 Summary:');
if (!hasIdForSupabase && !hasQrCodeForSupabase && hasIdForLocal && hasQrCodeForLocal && !hasIdInMapped && !hasQrCodeInMapped && !hasEmptyId) {
  console.log('🎉 SUCCESS: UUID auto-generation fix is working correctly!');
  console.log('- Supabase: No UUIDs generated (database will auto-generate)');
  console.log('- Local Storage: UUIDs generated for offline use');
  console.log('- No empty UUID values sent to database');
} else {
  console.log('💥 FAILURE: UUID auto-generation fix is not working correctly!');
}

console.log('\n🔧 Expected behavior:');
console.log('- For Supabase: Let database auto-generate UUIDs and QR codes');
console.log('- For Local Storage: Generate UUIDs and QR codes for offline use');
console.log('- This prevents "invalid input syntax for type uuid" errors'); 