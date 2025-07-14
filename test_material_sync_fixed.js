/**
 * Comprehensive Material Sync Test Script - With Fixes Applied
 * This script tests the complete material sync workflow after applying fixes:
 * 1. Using SupabaseRegistrationService for entity operations
 * 2. Adding delay before forcing sync
 * 3. Proper error handling and logging
 */

// Test configuration
const TEST_CONFIG = {
  materialId: 'MAT-TEST-SYNC-001',
  materialName: 'Test Material for Sync Fix',
  initialQuantity: 100,
  updateQuantity: 150,
  operationQuantity: 25
};

console.log('🔧 Starting Material Sync Test - With Fixes Applied');
console.log('=' .repeat(60));

// Environment and authentication checks
console.log('\n📋 Environment Verification:');
console.log('- Current URL:', window.location.href);
console.log('- User Agent:', navigator.userAgent.substring(0, 50) + '...');
console.log('- Local Storage Available:', typeof(Storage) !== 'undefined');

// Check authentication and Supabase mode
console.log('\n🔐 Authentication & Mode Check:');
const useSupabase = AuthManager.useSupabase();
console.log('- Supabase Mode:', useSupabase);

if (useSupabase) {
  AuthManager.isAuthenticated().then(isAuth => {
    console.log('- Authenticated:', isAuth);
    if (isAuth) {
      AuthManager.getCurrentUser().then(user => {
        console.log('- Current User:', user?.username || user?.email || 'Unknown');
      });
    }
  });
} else {
  console.log('- Authentication: Not required (offline mode)');
}

// Get sync manager instance
const syncManager = OfflineSyncManager.getInstance();
if (!syncManager) {
  console.error('❌ OfflineSyncManager not available');
  throw new Error('Sync manager not initialized');
}

console.log('✅ OfflineSyncManager available');

// Function to check sync queue status
const checkSyncQueue = () => {
  const queueStatus = syncManager.getSyncQueueStatus();
  console.log('📊 Sync Queue Status:');
  console.log('  - Total Operations:', queueStatus.totalOperations);
  console.log('  - Pending Operations:', queueStatus.pendingOperations);
  console.log('  - Failed Operations:', queueStatus.failedOperations);
  console.log('  - Last Sync:', queueStatus.lastSyncAttempt || 'Never');
  
  if (queueStatus.pendingOperations > 0) {
    console.log('  - Pending Operation Types:', queueStatus.operationTypes);
  }
  
  return queueStatus;
};

// Function to verify material in Supabase
const verifyMaterialInSupabase = async (materialId) => {
  if (!useSupabase) {
    console.log('⏭️  Skipping Supabase verification (offline mode)');
    return null;
  }
  
  try {
    console.log(`🔍 Verifying material ${materialId} in Supabase...`);
    const materials = await SupabaseDataService.getMaterials();
    const material = materials.find(m => m.id === materialId);
    
    if (material) {
      console.log('✅ Material found in Supabase:');
      console.log(`  - ID: ${material.id}`);
      console.log(`  - Name: ${material.name}`);
      console.log(`  - Quantity: ${material.quantity}`);
      console.log(`  - Status: ${material.status}`);
      console.log(`  - Last Updated: ${material.lastUpdated}`);
    } else {
      console.log('❌ Material not found in Supabase');
    }
    
    return material;
  } catch (error) {
    console.error('❌ Error verifying material in Supabase:', error.message);
    return null;
  }
};

// Function to verify material logs in Supabase
const verifyMaterialLogsInSupabase = async (materialId) => {
  if (!useSupabase) {
    console.log('⏭️  Skipping Supabase log verification (offline mode)');
    return [];
  }
  
  try {
    console.log(`🔍 Verifying material logs for ${materialId} in Supabase...`);
    const logs = await SupabaseDataService.getMaterialLogs();
    const materialLogs = logs.filter(log => log.entityId === materialId);
    
    console.log(`📋 Found ${materialLogs.length} logs for material ${materialId}:`);
    materialLogs.forEach((log, index) => {
      console.log(`  ${index + 1}. ${log.action} - Qty: ${log.quantity} - ${new Date(log.timestamp).toLocaleString()}`);
    });
    
    return materialLogs;
  } catch (error) {
    console.error('❌ Error verifying material logs in Supabase:', error.message);
    return [];
  }
};

// Main test function
const runMaterialSyncTest = async () => {
  try {
    console.log('\n🚀 Starting Material Sync Test...');
    
    // Step 1: Check initial sync queue status
    console.log('\n📊 Initial Sync Queue Status:');
    checkSyncQueue();
    
    // Step 2: Create test material
    console.log('\n📦 Creating test material...');
    const testMaterial = {
      id: TEST_CONFIG.materialId,
      name: TEST_CONFIG.materialName,
      category: 'Test Category',
      unit: 'pieces',
      quantity: TEST_CONFIG.initialQuantity,
      status: 'available',
      site: 'SITE-001',
      description: 'Test material for sync verification',
      lastUpdated: new Date().toISOString()
    };
    
    await OfflineDataManager.createMaterial(testMaterial);
    console.log('✅ Test material created locally');
    
    // Step 3: Update material quantity
    console.log('\n🔄 Updating material quantity...');
    const updatedMaterial = {
      ...testMaterial,
      quantity: TEST_CONFIG.updateQuantity,
      lastUpdated: new Date().toISOString()
    };
    
    await OfflineDataManager.updateMaterial(updatedMaterial);
    console.log('✅ Material updated locally');
    
    // Step 4: Create material log
    console.log('\n📝 Creating material log...');
    const logManager = LogManager.getInstance();
    await logManager.createMaterialLog(
      updatedMaterial,
      'material-in',
      TEST_CONFIG.operationQuantity,
      updatedMaterial.site,
      'available',
      `Test material IN operation - Sync test - ${new Date().toISOString()}`
    );
    console.log('✅ Material log created');
    
    // Step 5: Check sync queue status after operations
    console.log('\n📊 Sync Queue Status After Operations:');
    const queueStatus = checkSyncQueue();
    
    // Step 6: Add delay before forcing sync (simulating the fix)
    console.log('\n⏱️  Adding delay before sync (race condition fix)...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 7: Force sync processing
    console.log('\n🔄 Processing sync queue...');
    try {
      await syncManager.processSyncQueue();
      console.log('✅ Sync queue processed successfully');
    } catch (syncError) {
      console.error('❌ Sync processing failed:', syncError.message);
      console.log('📋 Sync error details:', syncError);
    }
    
    // Step 8: Check final sync queue status
    console.log('\n📊 Final Sync Queue Status:');
    checkSyncQueue();
    
    // Step 9: Verify data in Supabase
    console.log('\n🔍 Verifying data in Supabase...');
    await verifyMaterialInSupabase(TEST_CONFIG.materialId);
    await verifyMaterialLogsInSupabase(TEST_CONFIG.materialId);
    
    // Step 10: Cleanup
    console.log('\n🧹 Cleaning up test data...');
    try {
      await OfflineDataManager.deleteMaterial(TEST_CONFIG.materialId);
      console.log('✅ Test material deleted locally');
      
      // Force sync to delete from Supabase
      await new Promise(resolve => setTimeout(resolve, 500));
      await syncManager.processSyncQueue();
      console.log('✅ Cleanup sync completed');
    } catch (cleanupError) {
      console.error('⚠️  Cleanup failed:', cleanupError.message);
    }
    
    console.log('\n🎉 Material Sync Test Completed!');
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('❌ Material Sync Test Failed:', error.message);
    console.log('📋 Error details:', error);
    
    // Attempt cleanup even if test failed
    try {
      await OfflineDataManager.deleteMaterial(TEST_CONFIG.materialId);
      console.log('✅ Emergency cleanup completed');
    } catch (cleanupError) {
      console.error('❌ Emergency cleanup failed:', cleanupError.message);
    }
  }
};

// Run the test
runMaterialSyncTest();

console.log('\n📋 Test Instructions:');
console.log('1. Check the console output above for detailed sync flow');
console.log('2. Verify that material operations use SupabaseRegistrationService');
console.log('3. Confirm that sync queue is processed correctly');
console.log('4. Check Supabase database for material and log entries');
console.log('5. Look for any error messages or failed operations');