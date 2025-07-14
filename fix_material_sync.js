// Material Sync Fix Script
// This script will diagnose and fix the material sync issue

(async function fixMaterialSync() {
    console.log('🔧 Starting Material Sync Fix...');
    
    try {
        // Step 1: Check if we have the necessary managers
        if (!window.AuthManager) {
            console.error('❌ AuthManager not found. Make sure you\'re on the QR System page.');
            return;
        }
        
        if (!window.offlineSyncManager) {
            console.error('❌ OfflineSyncManager not found. Make sure you\'re on the QR System page.');
            return;
        }
        
        // Step 2: Check current authentication mode
        const useSupabase = window.AuthManager.useSupabase();
        console.log(`📋 Current mode: ${useSupabase ? 'Supabase' : 'Local Storage'}`);
        
        if (!useSupabase) {
            console.log('🔄 Switching to Supabase mode...');
            window.AuthManager.setUseSupabase(true);
            console.log('✅ Switched to Supabase mode');
        }
        
        // Step 3: Check authentication status
        const isAuthenticated = await window.AuthManager.isAuthenticated();
        console.log(`🔐 Authentication status: ${isAuthenticated ? 'Authenticated' : 'Not Authenticated'}`);
        
        if (!isAuthenticated) {
            console.warn('⚠️ Not authenticated with Supabase. Please log in first.');
            console.log('💡 Go to the login page and sign in with your Supabase credentials.');
            return;
        }
        
        // Step 4: Check sync queue
        const queueData = localStorage.getItem('qr_system_sync_queue');
        const queue = queueData ? JSON.parse(queueData) : [];
        console.log(`📋 Sync queue length: ${queue.length}`);
        
        const materialOps = queue.filter(op => op.entityType === 'material');
        const materialLogOps = queue.filter(op => op.entityType === 'materialLog');
        console.log(`📦 Material operations in queue: ${materialOps.length}`);
        console.log(`📝 Material log operations in queue: ${materialLogOps.length}`);
        
        // Step 5: Force sync if there are pending operations
        if (queue.length > 0) {
            console.log('⚡ Processing sync queue...');
            await window.offlineSyncManager.processSyncQueue();
            console.log('✅ Sync queue processed');
            
            // Check queue again
            const newQueueData = localStorage.getItem('qr_system_sync_queue');
            const newQueue = newQueueData ? JSON.parse(newQueueData) : [];
            console.log(`📋 Remaining operations in queue: ${newQueue.length}`);
            
            if (newQueue.length > 0) {
                console.warn('⚠️ Some operations are still in the queue. Check for errors:');
                const failedOps = newQueue.filter(op => op.retryCount > 0);
                if (failedOps.length > 0) {
                    console.error('❌ Failed operations:', failedOps);
                }
            }
        }
        
        // Step 6: Test a material operation
        console.log('🧪 Testing material operation...');
        
        // Find an existing material or create a test one
        const materials = window.OfflineDataManager?.getAllMaterials?.() || [];
        let testMaterial = materials.find(m => m.id.includes('TEST')) || materials[0];
        
        if (!testMaterial && window.OfflineDataManager?.createMaterial) {
            testMaterial = {
                id: 'TEST-SYNC-' + Date.now(),
                name: 'Test Sync Material',
                type: 'Test',
                quantity: 10,
                unit: 'pcs',
                site: 'Test Site',
                status: 'active',
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            };
            
            await window.OfflineDataManager.createMaterial(testMaterial);
            console.log('📦 Created test material:', testMaterial.id);
        }
        
        if (testMaterial && window.OfflineDataManager?.updateMaterial) {
            const originalQuantity = testMaterial.quantity;
            const newQuantity = originalQuantity + 1;
            
            const updatedMaterial = {
                ...testMaterial,
                quantity: newQuantity,
                lastUpdated: new Date().toISOString()
            };
            
            console.log(`📦 Updating material ${testMaterial.id} quantity: ${originalQuantity} → ${newQuantity}`);
            await window.OfflineDataManager.updateMaterial(updatedMaterial);
            
            // Create material log
            if (window.LogManager?.createMaterialLog) {
                await window.LogManager.createMaterialLog({
                    materialId: testMaterial.id,
                    type: 'in',
                    quantity: 1,
                    previousQuantity: originalQuantity,
                    newQuantity: newQuantity,
                    reason: 'Sync test operation',
                    performedBy: 'System Test',
                    timestamp: new Date().toISOString()
                });
                console.log('📝 Created material log');
            }
            
            // Force sync immediately
            console.log('⚡ Forcing immediate sync...');
            await window.offlineSyncManager.processSyncQueue();
            
            console.log('✅ Test operation completed');
        }
        
        // Step 7: Final status check
        const finalQueueData = localStorage.getItem('qr_system_sync_queue');
        const finalQueue = finalQueueData ? JSON.parse(finalQueueData) : [];
        
        console.log('\n📊 FINAL STATUS:');
        console.log(`✅ Supabase mode: ${window.AuthManager.useSupabase()}`);
        console.log(`✅ Authenticated: ${await window.AuthManager.isAuthenticated()}`);
        console.log(`📋 Pending operations: ${finalQueue.length}`);
        
        if (finalQueue.length === 0) {
            console.log('🎉 SUCCESS: All operations synced to Supabase!');
        } else {
            console.warn('⚠️ Some operations are still pending. Check the diagnostic tool for details.');
        }
        
    } catch (error) {
        console.error('❌ Fix script failed:', error);
        console.log('💡 Try running the diagnostic tool: open material_sync_diagnostic.html');
    }
})();

// Instructions for manual execution
console.log(`
📋 MANUAL FIX INSTRUCTIONS:
1. Make sure you're logged into the QR System
2. Open browser console (F12)
3. Copy and paste this entire script
4. Or run: fetch('/fix_material_sync.js').then(r=>r.text()).then(eval)
5. Check the console output for results
`);