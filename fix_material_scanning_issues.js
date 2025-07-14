// Material QR Scanning and Logging Fix Script
// This script addresses the reported issues with material QR scanning and logging

console.log('🔧 Starting Material QR Scanning and Logging Fix...');

// Function to check and fix double MAT- prefix in existing materials
function fixMaterialQRCodes() {
    console.log('\n📋 Checking existing materials for QR code issues...');
    
    const materials = JSON.parse(localStorage.getItem('qr_system_materials') || '[]');
    let fixedCount = 0;
    
    materials.forEach(material => {
        // Check for double MAT- prefix
        if (material.qrCode && material.qrCode.startsWith('MAT-MAT-')) {
            console.log(`❌ Found double prefix in material: ${material.name} (${material.qrCode})`);
            material.qrCode = material.qrCode.replace('MAT-MAT-', 'MAT-');
            fixedCount++;
            console.log(`✅ Fixed to: ${material.qrCode}`);
        }
        
        // Ensure qrCode matches id if both start with MAT-
        if (material.id && material.id.startsWith('MAT-') && (!material.qrCode || material.qrCode !== material.id)) {
            material.qrCode = material.id;
            console.log(`🔄 Synchronized QR code for ${material.name}: ${material.qrCode}`);
        }
    });
    
    if (fixedCount > 0) {
        localStorage.setItem('qr_system_materials', JSON.stringify(materials));
        console.log(`✅ Fixed ${fixedCount} material QR codes`);
    } else {
        console.log('✅ No QR code issues found in existing materials');
    }
    
    return materials;
}

// Function to test QR code parsing
function testQRCodeParsing() {
    console.log('\n🔍 Testing QR Code Parsing...');
    
    const testCodes = [
        'MAT-20250713-001-123456',
        'MAT-MAT-20250713-001-123456', // Double prefix (should fail)
        'EMP-20250713-001-123456',
        'SITE-20250713-001-123456',
        'INVALID-CODE'
    ];
    
    // Mock parseQRCode function (same as in the actual app)
    function parseQRCode(qrData) {
        if (qrData.startsWith('EMP-')) {
            return { type: 'employee', id: qrData };
        } else if (qrData.startsWith('EQP-')) {
            return { type: 'equipment', id: qrData };
        } else if (qrData.startsWith('MAT-')) {
            return { type: 'material', id: qrData };
        } else if (qrData.startsWith('SITE-')) {
            return { type: 'site', id: qrData };
        }
        return { type: null, id: qrData };
    }
    
    testCodes.forEach(code => {
        const result = parseQRCode(code);
        if (result.type) {
            console.log(`✅ ${code} -> Type: ${result.type}`);
        } else {
            console.log(`❌ ${code} -> Invalid format`);
        }
    });
}

// Function to test material logging
function testMaterialLogging() {
    console.log('\n📝 Testing Material Logging...');
    
    const materials = JSON.parse(localStorage.getItem('qr_system_materials') || '[]');
    
    if (materials.length === 0) {
        console.log('❌ No materials found for logging test');
        return;
    }
    
    const testMaterial = materials[0];
    console.log(`Testing with material: ${testMaterial.name} (${testMaterial.id})`);
    
    // Create a test log entry
    const materialLog = {
        id: `mat-log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        materialId: testMaterial.id,
        materialName: testMaterial.name,
        materialType: testMaterial.type,
        action: 'material-in',
        quantity: 5,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
        timestamp: new Date().toISOString(),
        site: testMaterial.site || 'Test Site',
        status: testMaterial.status || 'available',
        notes: 'Test log entry from fix script'
    };
    
    // Save to localStorage
    const materialLogs = JSON.parse(localStorage.getItem('qr_system_material_logs') || '[]');
    materialLogs.push(materialLog);
    localStorage.setItem('qr_system_material_logs', JSON.stringify(materialLogs));
    
    console.log(`✅ Created test material log: ${materialLog.id}`);
    console.log(`   Action: ${materialLog.action}, Quantity: ${materialLog.quantity}`);
    
    return materialLog;
}

// Function to verify log storage and retrieval
function verifyLogStorage() {
    console.log('\n🔍 Verifying Log Storage and Retrieval...');
    
    const materialLogs = JSON.parse(localStorage.getItem('qr_system_material_logs') || '[]');
    console.log(`Found ${materialLogs.length} material logs in storage`);
    
    if (materialLogs.length > 0) {
        const recentLog = materialLogs[materialLogs.length - 1];
        console.log(`Most recent log: ${recentLog.materialName} - ${recentLog.action} (${recentLog.timestamp})`);
    }
    
    // Check if logs are properly structured
    const requiredFields = ['id', 'materialId', 'materialName', 'action', 'timestamp'];
    let validLogs = 0;
    
    materialLogs.forEach(log => {
        const hasAllFields = requiredFields.every(field => log.hasOwnProperty(field));
        if (hasAllFields) {
            validLogs++;
        } else {
            console.log(`❌ Invalid log structure: ${log.id || 'Unknown ID'}`);
        }
    });
    
    console.log(`✅ ${validLogs}/${materialLogs.length} logs have valid structure`);
}

// Function to create a test material with proper QR code
function createTestMaterial() {
    console.log('\n🏗️ Creating Test Material...');
    
    // Generate proper material ID
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const counter = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const materialId = `MAT-${date}-${counter}-${timestamp}${random}`;
    
    const testMaterial = {
        id: materialId,
        qrCode: materialId, // QR code should match ID
        name: 'Test Construction Material',
        type: 'Construction',
        unit: 'pieces',
        site: 'Test Construction Site',
        quantity: 100,
        status: 'available',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        notes: 'Created by fix script for testing'
    };
    
    const materials = JSON.parse(localStorage.getItem('qr_system_materials') || '[]');
    materials.push(testMaterial);
    localStorage.setItem('qr_system_materials', JSON.stringify(materials));
    
    console.log(`✅ Created test material: ${testMaterial.name}`);
    console.log(`   ID: ${testMaterial.id}`);
    console.log(`   QR Code: ${testMaterial.qrCode}`);
    
    return testMaterial;
}

// Function to display summary
function displaySummary() {
    console.log('\n📊 Summary Report:');
    console.log('==================');
    
    const materials = JSON.parse(localStorage.getItem('qr_system_materials') || '[]');
    const materialLogs = JSON.parse(localStorage.getItem('qr_system_material_logs') || '[]');
    const employeeLogs = JSON.parse(localStorage.getItem('qr_system_employee_logs') || '[]');
    const equipmentLogs = JSON.parse(localStorage.getItem('qr_system_equipment_logs') || '[]');
    
    console.log(`📦 Materials: ${materials.length}`);
    console.log(`📝 Material Logs: ${materialLogs.length}`);
    console.log(`👥 Employee Logs: ${employeeLogs.length}`);
    console.log(`🔧 Equipment Logs: ${equipmentLogs.length}`);
    
    // Check for QR code consistency
    let qrIssues = 0;
    materials.forEach(material => {
        if (material.qrCode && material.qrCode !== material.id) {
            qrIssues++;
        }
    });
    
    if (qrIssues === 0) {
        console.log('✅ All material QR codes are consistent with IDs');
    } else {
        console.log(`❌ ${qrIssues} materials have QR code inconsistencies`);
    }
}

// Main execution function
function runFix() {
    console.log('🚀 Material QR Scanning and Logging Fix Script');
    console.log('===============================================');
    
    try {
        // Step 1: Fix existing QR codes
        fixMaterialQRCodes();
        
        // Step 2: Test QR code parsing
        testQRCodeParsing();
        
        // Step 3: Create a test material if none exist
        const materials = JSON.parse(localStorage.getItem('qr_system_materials') || '[]');
        if (materials.length === 0) {
            createTestMaterial();
        }
        
        // Step 4: Test material logging
        testMaterialLogging();
        
        // Step 5: Verify log storage
        verifyLogStorage();
        
        // Step 6: Display summary
        displaySummary();
        
        console.log('\n🎉 Fix script completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Test material QR scanning in the app');
        console.log('2. Verify that logs appear in the Reports panel');
        console.log('3. Check that new materials have consistent QR codes');
        
    } catch (error) {
        console.error('❌ Error during fix execution:', error);
    }
}

// Run the fix when this script is loaded
if (typeof window !== 'undefined') {
    // Browser environment
    runFix();
} else {
    // Export for Node.js if needed
    module.exports = {
        fixMaterialQRCodes,
        testQRCodeParsing,
        testMaterialLogging,
        verifyLogStorage,
        createTestMaterial,
        displaySummary,
        runFix
    };
}