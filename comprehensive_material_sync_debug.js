// Comprehensive Material Sync Debug Script
// Run this in browser console to debug the complete material sync flow

console.log('🔍 Starting Comprehensive Material Sync Debug...');

// Helper function to log with timestamp
function debugLog(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
}

// Test material data
const testMaterial = {
    id: 'MAT-TEST-' + Date.now(),
    name: 'Test Material for Sync Debug',
    type: 'consumable',
    unit: 'pieces',
    site: 'Test Site',
    qrCode: 'MAT-TEST-' + Date.now(),
    quantity: 100,
    status: 'available',
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
};

async function runComprehensiveDebug() {
    try {
        debugLog('=== PHASE 1: Environment Check ===');
        
        // Check required components
        const components = {
            'AuthManager': typeof window.AuthManager !== 'undefined',
            'OfflineDataManager': typeof window.OfflineDataManager !== 'undefined',
            'OfflineSyncManager': typeof window.OfflineSyncManager !== 'undefined',
            'SupabaseRegistrationService': typeof window.SupabaseRegistrationService !== 'undefined',
            'DataStorage': typeof window.DataStorage !== 'undefined'
        };
        
        debugLog('Component availability:');
        Object.entries(components).forEach(([name, available]) => {
            debugLog(`  ${name}: ${available ? '✅' : '❌'}`, available ? 'success' : 'error');
        });
        
        if (!components.AuthManager) {
            debugLog('AuthManager not available, cannot proceed', 'error');
            return;
        }
        
        debugLog('=== PHASE 2: Authentication & Mode Check ===');
        
        // Check current auth mode
        const useSupabase = AuthManager.useSupabase();
        debugLog(`Supabase mode: ${useSupabase}`);
        
        if (!useSupabase) {
            debugLog('Switching to Supabase mode...', 'warning');
            AuthManager.setSupabaseMode(true);
            debugLog(`Supabase mode after switch: ${AuthManager.useSupabase()}`);
        }
        
        // Check authentication
        const currentUser = AuthManager.getCurrentUser();
        debugLog(`Current user: ${currentUser ? currentUser.username : 'None'}`);
        
        if (!currentUser) {
            debugLog('No authenticated user found', 'error');
            return;
        }
        
        debugLog('=== PHASE 3: Initial Sync Queue Status ===');
        
        let syncManager;
        try {
            syncManager = OfflineSyncManager.getInstance();
            const initialQueue = syncManager.getSyncQueue();
            debugLog(`Initial sync queue length: ${initialQueue.length}`);
            
            const materialOps = initialQueue.filter(op => op.entityType === 'material');
            const materialLogOps = initialQueue.filter(op => op.entityType === 'materialLog');
            debugLog(`Material operations in queue: ${materialOps.length}`);
            debugLog(`Material log operations in queue: ${materialLogOps.length}`);
            
            if (initialQueue.length > 0) {
                debugLog('Recent operations in queue:');
                initialQueue.slice(-3).forEach((op, index) => {
                    debugLog(`  ${index + 1}. ${op.type} ${op.entityType} (${op.entityId})`);
                });
            }
        } catch (error) {
            debugLog(`Failed to get sync manager: ${error.message}`, 'error');
        }
        
        debugLog('=== PHASE 4: Create Test Material ===');
        
        // Create test material in local storage
        try {
            const operationId = await OfflineDataManager.createMaterial(testMaterial);
            debugLog(`Created test material with operation ID: ${operationId}`, 'success');
        } catch (error) {
            debugLog(`Failed to create test material: ${error.message}`, 'error');
            return;
        }
        
        debugLog('=== PHASE 5: Test Material Update (Simulating Material IN) ===');
        
        // Update material quantity (simulate Material IN)
        const updatedMaterial = {
            ...testMaterial,
            quantity: testMaterial.quantity + 50,
            lastUpdated: new Date().toISOString()
        };
        
        try {
            const updateOperationId = await OfflineDataManager.updateMaterial(updatedMaterial);
            debugLog(`Updated test material with operation ID: ${updateOperationId}`, 'success');
            debugLog(`Material quantity changed from ${testMaterial.quantity} to ${updatedMaterial.quantity}`);
        } catch (error) {
            debugLog(`Failed to update test material: ${error.message}`, 'error');
            return;
        }
        
        debugLog('=== PHASE 6: Create Material Log ===');
        
        // Create material log
        try {
            const logManager = LogManager.getInstance();
            const logId = await logManager.createMaterialLog(
                updatedMaterial,
                'material-in',
                50,
                'Test Site',
                'available',
                'Debug test material in operation'
            );
            debugLog(`Created material log with ID: ${logId}`, 'success');
        } catch (error) {
            debugLog(`Failed to create material log: ${error.message}`, 'error');
        }
        
        debugLog('=== PHASE 7: Post-Operation Sync Queue Status ===');
        
        try {
            const postQueue = syncManager.getSyncQueue();
            debugLog(`Post-operation sync queue length: ${postQueue.length}`);
            
            const materialOps = postQueue.filter(op => op.entityType === 'material');
            const materialLogOps = postQueue.filter(op => op.entityType === 'materialLog');
            debugLog(`Material operations in queue: ${materialOps.length}`);
            debugLog(`Material log operations in queue: ${materialLogOps.length}`);
            
            // Show recent operations
            debugLog('Recent operations added to queue:');
            postQueue.slice(-5).forEach((op, index) => {
                debugLog(`  ${index + 1}. ${op.type} ${op.entityType} (${op.entityId}) - Priority: ${op.priority}`);
                if (op.entityType === 'material' && op.type === 'update') {
                    debugLog(`     Material data: quantity=${op.data.quantity}, status=${op.data.status}`);
                }
            });
        } catch (error) {
            debugLog(`Failed to check post-operation queue: ${error.message}`, 'error');
        }
        
        debugLog('=== PHASE 8: Force Sync Processing ===');
        
        try {
            debugLog('Forcing sync queue processing...');
            await syncManager.processSyncQueue();
            debugLog('Sync processing completed', 'success');
        } catch (error) {
            debugLog(`Sync processing failed: ${error.message}`, 'error');
        }
        
        debugLog('=== PHASE 9: Final Sync Queue Status ===');
        
        try {
            const finalQueue = syncManager.getSyncQueue();
            debugLog(`Final sync queue length: ${finalQueue.length}`);
            
            if (finalQueue.length > 0) {
                debugLog('Remaining operations in queue:', 'warning');
                finalQueue.forEach((op, index) => {
                    debugLog(`  ${index + 1}. ${op.type} ${op.entityType} (${op.entityId}) - Retries: ${op.retryCount}`);
                });
            } else {
                debugLog('Sync queue is empty - all operations processed!', 'success');
            }
        } catch (error) {
            debugLog(`Failed to check final queue: ${error.message}`, 'error');
        }
        
        debugLog('=== PHASE 10: Verify Supabase Data ===');
        
        try {
            // Check if material exists in Supabase
            const supabaseService = SupabaseRegistrationService;
            
            // Try to fetch the material from Supabase
            debugLog('Checking if material was synced to Supabase...');
            
            // Since we don't have a direct get method, we'll try to update it to see if it exists
            const verifyResult = await supabaseService.updateMaterial({
                ...updatedMaterial,
                lastUpdated: new Date().toISOString()
            });
            
            if (verifyResult.success) {
                debugLog('✅ Material successfully synced to Supabase!', 'success');
                debugLog(`Synced material quantity: ${verifyResult.data.quantity}`);
            } else {
                debugLog(`❌ Material not found in Supabase: ${verifyResult.error}`, 'error');
            }
        } catch (error) {
            debugLog(`Failed to verify Supabase data: ${error.message}`, 'error');
        }
        
        debugLog('=== PHASE 11: Cleanup ===');
        
        try {
            // Clean up test material from local storage
            await OfflineDataManager.deleteMaterial(testMaterial.id);
            debugLog('Cleaned up test material from local storage', 'success');
        } catch (error) {
            debugLog(`Failed to cleanup test material: ${error.message}`, 'warning');
        }
        
        debugLog('=== DEBUG COMPLETE ===');
        debugLog('Check the console output above to identify any issues in the material sync flow.');
        
    } catch (error) {
        debugLog(`Debug script failed: ${error.message}`, 'error');
        console.error('Full error:', error);
    }
}

// Run the debug
runComprehensiveDebug();