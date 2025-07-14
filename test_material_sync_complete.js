// Complete Material Sync Test Script
// This script tests the entire material sync workflow step by step

console.log('🚀 Starting Complete Material Sync Test...');

// Test configuration
const TEST_CONFIG = {
    materialId: 'MAT-TEST-' + Date.now(),
    materialName: 'Test Sync Material',
    initialQuantity: 100,
    addQuantity: 25,
    site: 'Test Site'
};

function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const emoji = {
        'info': 'ℹ️',
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'step': '🔄'
    }[type] || 'ℹ️';
    console.log(`${emoji} [${timestamp}] ${message}`);
}

async function testMaterialSync() {
    try {
        log('=== MATERIAL SYNC COMPLETE TEST ===', 'step');
        
        // Step 1: Verify environment
        log('Step 1: Verifying environment...', 'step');
        
        if (!window.AuthManager) {
            log('AuthManager not available', 'error');
            return false;
        }
        
        if (!window.OfflineDataManager) {
            log('OfflineDataManager not available', 'error');
            return false;
        }
        
        if (!window.OfflineSyncManager) {
            log('OfflineSyncManager not available', 'error');
            return false;
        }
        
        if (!window.LogManager) {
            log('LogManager not available', 'error');
            return false;
        }
        
        log('All required managers available', 'success');
        
        // Step 2: Ensure Supabase mode and authentication
        log('Step 2: Checking authentication...', 'step');
        
        if (!AuthManager.useSupabase()) {
            log('Switching to Supabase mode...', 'warning');
            AuthManager.setSupabaseMode(true);
        }
        
        const currentUser = AuthManager.getCurrentUser();
        if (!currentUser) {
            log('No authenticated user found', 'error');
            return false;
        }
        
        log(`Authenticated as: ${currentUser.username}`, 'success');
        
        // Step 3: Clear any existing test materials
        log('Step 3: Cleaning up any existing test materials...', 'step');
        
        try {
            await OfflineDataManager.deleteMaterial(TEST_CONFIG.materialId);
            log('Cleaned up existing test material', 'info');
        } catch (error) {
            log('No existing test material to clean up', 'info');
        }
        
        // Step 4: Create test material
        log('Step 4: Creating test material...', 'step');
        
        const testMaterial = {
            id: TEST_CONFIG.materialId,
            name: TEST_CONFIG.materialName,
            type: 'consumable',
            unit: 'pieces',
            site: TEST_CONFIG.site,
            qrCode: TEST_CONFIG.materialId,
            quantity: TEST_CONFIG.initialQuantity,
            status: 'available',
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };
        
        const createOpId = await OfflineDataManager.createMaterial(testMaterial);
        log(`Material created with operation ID: ${createOpId}`, 'success');
        
        // Step 5: Check initial sync queue
        log('Step 5: Checking sync queue after creation...', 'step');
        
        const syncManager = OfflineSyncManager.getInstance();
        let queue = syncManager.getSyncQueue();
        const createOps = queue.filter(op => op.entityType === 'material' && op.type === 'create');
        log(`Create operations in queue: ${createOps.length}`, 'info');
        
        // Step 6: Process initial sync
        log('Step 6: Processing initial sync...', 'step');
        
        await syncManager.processSyncQueue();
        
        queue = syncManager.getSyncQueue();
        const remainingCreateOps = queue.filter(op => op.entityType === 'material' && op.type === 'create');
        
        if (remainingCreateOps.length === 0) {
            log('Material creation synced successfully', 'success');
        } else {
            log(`${remainingCreateOps.length} create operations still in queue`, 'warning');
        }
        
        // Step 7: Simulate Material IN operation
        log('Step 7: Simulating Material IN operation...', 'step');
        
        const updatedMaterial = {
            ...testMaterial,
            quantity: TEST_CONFIG.initialQuantity + TEST_CONFIG.addQuantity,
            lastUpdated: new Date().toISOString()
        };
        
        const updateOpId = await OfflineDataManager.updateMaterial(updatedMaterial);
        log(`Material updated with operation ID: ${updateOpId}`, 'success');
        log(`Quantity changed: ${TEST_CONFIG.initialQuantity} → ${updatedMaterial.quantity}`, 'info');
        
        // Step 8: Create material log
        log('Step 8: Creating material log...', 'step');
        
        const logManager = LogManager.getInstance();
        const logId = await logManager.createMaterialLog(
            updatedMaterial,
            'material-in',
            TEST_CONFIG.addQuantity,
            TEST_CONFIG.site,
            'available',
            'Test material IN operation for sync verification'
        );
        
        log(`Material log created with ID: ${logId}`, 'success');
        
        // Step 9: Check sync queue after operations
        log('Step 9: Checking sync queue after operations...', 'step');
        
        queue = syncManager.getSyncQueue();
        const updateOps = queue.filter(op => op.entityType === 'material' && op.type === 'update');
        const logOps = queue.filter(op => op.entityType === 'materialLog' && op.type === 'create');
        
        log(`Update operations in queue: ${updateOps.length}`, 'info');
        log(`Log operations in queue: ${logOps.length}`, 'info');
        
        // Show operation details
        if (updateOps.length > 0) {
            const updateOp = updateOps[0];
            log(`Update operation data: quantity=${updateOp.data.quantity}, status=${updateOp.data.status}`, 'info');
        }
        
        // Step 10: Process sync queue
        log('Step 10: Processing sync queue...', 'step');
        
        await syncManager.processSyncQueue();
        
        // Step 11: Check final sync queue status
        log('Step 11: Checking final sync status...', 'step');
        
        queue = syncManager.getSyncQueue();
        const finalUpdateOps = queue.filter(op => op.entityType === 'material' && op.type === 'update');
        const finalLogOps = queue.filter(op => op.entityType === 'materialLog' && op.type === 'create');
        
        log(`Remaining update operations: ${finalUpdateOps.length}`, finalUpdateOps.length === 0 ? 'success' : 'warning');
        log(`Remaining log operations: ${finalLogOps.length}`, finalLogOps.length === 0 ? 'success' : 'warning');
        
        if (queue.length > 0) {
            log('Operations still in queue:', 'warning');
            queue.forEach((op, index) => {
                log(`  ${index + 1}. ${op.type} ${op.entityType} (${op.entityId}) - Retries: ${op.retryCount}`, 'info');
            });
        } else {
            log('All operations synced successfully!', 'success');
        }
        
        // Step 12: Verify Supabase data
        log('Step 12: Verifying data in Supabase...', 'step');
        
        try {
            const verifyResult = await SupabaseRegistrationService.updateMaterial({
                ...updatedMaterial,
                lastUpdated: new Date().toISOString()
            });
            
            if (verifyResult.success) {
                log(`✅ Material verified in Supabase! Quantity: ${verifyResult.data.quantity}`, 'success');
                
                if (verifyResult.data.quantity === updatedMaterial.quantity) {
                    log('✅ Quantity matches expected value!', 'success');
                } else {
                    log(`⚠️ Quantity mismatch: Expected ${updatedMaterial.quantity}, Got ${verifyResult.data.quantity}`, 'warning');
                }
            } else {
                log(`❌ Material verification failed: ${verifyResult.error}`, 'error');
            }
        } catch (error) {
            log(`❌ Verification error: ${error.message}`, 'error');
        }
        
        // Step 13: Cleanup
        log('Step 13: Cleaning up test data...', 'step');
        
        try {
            await OfflineDataManager.deleteMaterial(TEST_CONFIG.materialId);
            await syncManager.processSyncQueue();
            log('Test material cleaned up', 'success');
        } catch (error) {
            log(`Cleanup warning: ${error.message}`, 'warning');
        }
        
        log('=== TEST COMPLETED ===', 'step');
        
        return true;
        
    } catch (error) {
        log(`Test failed: ${error.message}`, 'error');
        console.error('Full error:', error);
        return false;
    }
}

// Run the test
testMaterialSync().then(success => {
    if (success) {
        console.log('🎉 Material sync test completed successfully!');
    } else {
        console.log('💥 Material sync test failed. Check the logs above for details.');
    }
});