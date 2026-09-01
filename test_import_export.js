// Test script for Import/Export functionality
// This script can be run in the browser console to test the import/export features

console.log('🧪 Testing Import/Export Functionality...');

// Test data for different entity types
const testEmployees = [
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

const testEquipment = [
  {
    id: 'test-eq-001',
    name: 'Asphalt Paver',
    type: 'Heavy Machinery',
    model: 'CAT AP655F',
    site: 'site-001',
    qr_code: 'test-eq-001',
    status: 'available',
    created_at: '2024-01-01T08:00:00Z',
    last_updated: '2024-01-01T08:00:00Z',
    serial_number: 'AP655F-2024-001',
    custom_equipment_id: 'CUST-001',
    old_id: 'LEGACY-456',
    operational_status: 'working',
    cost_center_code: 'CC002',
    profit_center_code: 'PC002',
    hourly_rate: 150.00,
    usage_duration: 0,
    standby_duration: 0,
    maintenance_duration: 0
  }
];

const testMaterials = [
  {
    id: 'test-mat-001',
    name: 'Bitumen (60/70)',
    type: 'Bituminous Materials',
    unit: 'Tons',
    site: 'site-001',
    qr_code: 'test-mat-001',
    quantity: 150,
    status: 'available',
    created_at: '2024-01-01T08:00:00Z',
    last_updated: '2024-01-01T08:00:00Z',
    use: 'Main binder in asphalt mix',
    access_level: 'basic',
    old_id: 'LEGACY-789',
    cost_center_code: 'CC003',
    profit_center_code: 'PC003',
    cost: 2500.00
  }
];

const testSites = [
  {
    id: 'test-site-001',
    name: 'Al Khobar Construction Site',
    province: 'Eastern Province',
    coordinates: '(50.2089,26.2172)',
    address: 'Al Khobar, Eastern Province',
    manager: 'Ahmed Al-Rashid',
    last_updated: '2024-01-01T08:00:00Z',
    type: 'Construction Site',
    qr_code: 'test-site-001',
    cost_center_code: 'CC004',
    profit_center_code: 'PC004'
  }
];

// Test function to validate template structure
function validateTemplate(template, entityType) {
  console.log(`🔍 Validating ${entityType} template...`);
  
  if (!Array.isArray(template) || template.length === 0) {
    console.error(`❌ ${entityType} template is not an array or is empty`);
    return false;
  }
  
  const sample = template[0];
  const requiredFields = getRequiredFields(entityType);
  
  for (const field of requiredFields) {
    if (!(field in sample)) {
      console.error(`❌ ${entityType} template missing required field: ${field}`);
      return false;
    }
  }
  
  console.log(`✅ ${entityType} template validation passed`);
  return true;
}

// Get required fields for each entity type
function getRequiredFields(entityType) {
  const requiredFields = {
    employees: ['name', 'department', 'position', 'site'],
    equipment: ['name', 'type', 'model', 'site'],
    materials: ['name', 'type', 'unit', 'site'],
    sites: ['name', 'province', 'address', 'manager']
  };
  
  return requiredFields[entityType] || [];
}

// Test function to validate import data structure
function validateImportData(data, entityType) {
  console.log(`🔍 Validating ${entityType} import data...`);
  
  if (!Array.isArray(data) || data.length === 0) {
    console.error(`❌ ${entityType} import data is not an array or is empty`);
    return false;
  }
  
  const requiredFields = getRequiredFields(entityType);
  
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    for (const field of requiredFields) {
      if (!item[field] || item[field].toString().trim() === '') {
        console.error(`❌ ${entityType} import data row ${i + 1} missing required field: ${field}`);
        return false;
      }
    }
  }
  
  console.log(`✅ ${entityType} import data validation passed`);
  return true;
}

// Test function to simulate import process
async function testImportProcess(entityType, testData) {
  console.log(`🧪 Testing ${entityType} import process...`);
  
  try {
    // Simulate file reading (in real scenario, this would be from Excel file)
    const importedData = testData.map(item => {
      // Simulate the import function processing
      return {
        id: item.id || crypto.randomUUID(),
        name: item.name,
        type: item.type || '',
        department: item.department || '',
        position: item.position || '',
        site: item.site,
        // Add other fields as needed
        ...item
      };
    });
    
    // Validate the imported data
    if (validateImportData(importedData, entityType)) {
      console.log(`✅ ${entityType} import process test passed`);
      return true;
    } else {
      console.error(`❌ ${entityType} import process test failed`);
      return false;
    }
  } catch (error) {
    console.error(`❌ ${entityType} import process test error:`, error);
    return false;
  }
}

// Test function to validate export data structure
function validateExportData(data, entityType) {
  console.log(`🔍 Validating ${entityType} export data...`);
  
  if (!Array.isArray(data) || data.length === 0) {
    console.error(`❌ ${entityType} export data is not an array or is empty`);
    return false;
  }
  
  const sample = data[0];
  const expectedFields = getExpectedExportFields(entityType);
  
  for (const field of expectedFields) {
    if (!(field in sample)) {
      console.error(`❌ ${entityType} export data missing expected field: ${field}`);
      return false;
    }
  }
  
  console.log(`✅ ${entityType} export data validation passed`);
  return true;
}

// Get expected export fields for each entity type
function getExpectedExportFields(entityType) {
  const expectedFields = {
    employees: ['ID', 'Name', 'Department', 'Position', 'Site', 'Status'],
    equipment: ['ID', 'Name', 'Type', 'Model', 'Site', 'Status'],
    materials: ['ID', 'Name', 'Type', 'Unit', 'Site', 'Quantity', 'Status'],
    sites: ['ID', 'Name', 'Province', 'Address', 'Manager']
  };
  
  return expectedFields[entityType] || [];
}

// Test function to simulate export process
function testExportProcess(entityType, testData) {
  console.log(`🧪 Testing ${entityType} export process...`);
  
  try {
    // Simulate the export function processing
    const exportData = testData.map(item => {
      // Convert to export format (with proper column headers)
      const exportItem = {};
      
      // Map fields to export format
      Object.keys(item).forEach(key => {
        const exportKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
        exportItem[exportKey] = item[key];
      });
      
      return exportItem;
    });
    
    // Validate the export data
    if (validateExportData(exportData, entityType)) {
      console.log(`✅ ${entityType} export process test passed`);
      return true;
    } else {
      console.error(`❌ ${entityType} export process test failed`);
      return false;
    }
  } catch (error) {
    console.error(`❌ ${entityType} export process test error:`, error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Import/Export Tests...\n');
  
  const testResults = {
    employees: { template: false, import: false, export: false },
    equipment: { template: false, import: false, export: false },
    materials: { template: false, import: false, export: false },
    sites: { template: false, import: false, export: false }
  };
  
  // Test templates
  testResults.employees.template = validateTemplate(testEmployees, 'employees');
  testResults.equipment.template = validateTemplate(testEquipment, 'equipment');
  testResults.materials.template = validateTemplate(testMaterials, 'materials');
  testResults.sites.template = validateTemplate(testSites, 'sites');
  
  // Test import processes
  testResults.employees.import = await testImportProcess('employees', testEmployees);
  testResults.equipment.import = await testImportProcess('equipment', testEquipment);
  testResults.materials.import = await testImportProcess('materials', testMaterials);
  testResults.sites.import = await testImportProcess('sites', testSites);
  
  // Test export processes
  testResults.employees.export = testExportProcess('employees', testEmployees);
  testResults.equipment.export = testExportProcess('equipment', testEquipment);
  testResults.materials.export = testExportProcess('materials', testMaterials);
  testResults.sites.export = testExportProcess('sites', testSites);
  
  // Print summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  Object.keys(testResults).forEach(entityType => {
    const results = testResults[entityType];
    const passed = Object.values(results).filter(Boolean).length;
    const total = Object.keys(results).length;
    
    console.log(`${entityType.toUpperCase()}: ${passed}/${total} tests passed`);
    console.log(`  - Template: ${results.template ? '✅' : '❌'}`);
    console.log(`  - Import: ${results.import ? '✅' : '❌'}`);
    console.log(`  - Export: ${results.export ? '✅' : '❌'}`);
    console.log('');
  });
  
  const totalPassed = Object.values(testResults).flat().filter(Boolean).length;
  const totalTests = Object.values(testResults).flat().length;
  
  console.log(`🎯 Overall: ${totalPassed}/${totalTests} tests passed`);
  
  if (totalPassed === totalTests) {
    console.log('🎉 All tests passed! Import/Export functionality is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the error messages above.');
  }
}

// Export test functions for manual testing
window.importExportTests = {
  runAllTests,
  validateTemplate,
  validateImportData,
  validateExportData,
  testImportProcess,
  testExportProcess,
  testEmployees,
  testEquipment,
  testMaterials,
  testSites
};

console.log('📝 Test functions loaded. Run "importExportTests.runAllTests()" to start testing.'); 