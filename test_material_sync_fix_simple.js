// Simple Material Sync Test Script
// Run this in the browser console after logging into the QR System

console.log('🧪 Starting Material Sync Test...');

(async function testMaterialSync() {
    try {
        // Step 1: Check if we have the necessary components
        if (!window.AuthManager || !window.OfflineDataManager || !window.offlineSyncManager) {
            console.error('❌ Required components not found. Make sure you\'re on the QR System page and logged in.');
            return;
        }

        // Step 2: Ensure Supabase mode
        console.log('🔄 Ensuring Supabase mode...');
        window.AuthManager.setUseSupabase(true);
        
        // Step 3: Check authentication
        const isAuth = await window.AuthManager.isAuthenticated();
        console.log(`🔐 Authentication status: ${isAuth}`);
        
        if (!isAuth) {
            console.error('❌ Not authenticated. Please log in to Supabase first.');
            return;
        }

        // Step 4: Get or create a test material
        const materials = window.OfflineDataManager.getAllMaterials() || [];
        let testMaterial = materials.find(m => m.name.includes('Test'));
        
        if (!testMaterial && materials.length > 0) {
            testMaterial = materials[0]; // Use first available material
        }
        
        if (!testMaterial) {
            console.log('📦 Creating test material...');
            testMaterial = {
                id: 'TEST-SYNC-' + Date.now(),
                name: 'Test Sync Material',
                type: 'Test',
                quantity: 10,
                unit: 'pcs',
                site: 'Test Site',
                status: 'available',
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            };
            
            await window.OfflineDataManager.createMaterial(testMaterial);
            console.log('✅ Test material created:', testMaterial.id);
        }

        // Step 5: Check sync queue before operation
        const queueBefore = JSON.parse(localStorage.getItem('qr_system_sync_queue') || '[]');
        console.log(`📋 Sync queue before operation: ${queueBefore.length} items`);

        // Step 6: Perform material operation
        const originalQuantity = testMaterial.quantity;
        const addQuantity = 5;
        const newQuantity = originalQuantity + addQuantity;
        
        console.log(`📦 Testing material operation: ${testMaterial.name}`);
        console.log(`📊 Quantity change: ${originalQuantity} → ${newQuantity}`);
        
        const updatedMaterial = {
            ...testMaterial,
            quantity: newQuantity,
            lastUpdated: new Date().toISOString()
        };
        
        // Update material
        await window.OfflineDataManager.updateMaterial(updatedMaterial);
        console.log('✅ Material updated locally');
        
        // Create material log
        if (window.LogManager) {
            await window.LogManager.createMaterialLog({
                materialId: testMaterial.id,
                type: 'in',
                quantity: addQuantity,
                previousQuantity: originalQuantity,
                newQuantity: newQuantity,
                reason: 'Sync test operation',
                performedBy: 'Test Script',
                timestamp: new Date().toISOString()
            });
            console.log('✅ Material log created');
        }

        // Step 7: Check sync queue after operation
        const queueAfter = JSON.parse(localStorage.getItem('qr_system_sync_queue') || '[]');
        console.log(`📋 Sync queue after operation: ${queueAfter.length} items`);
        
        const materialOps = queueAfter.filter(op => op.entityType === 'material');
        const logOps = queueAfter.filter(op => op.entityType === 'materialLog');
        console.log(`📦 Material operations queued: ${materialOps.length}`);
        console.log(`📝 Log operations queued: ${logOps.length}`);

        // Step 8: Force sync
        console.log('⚡ Forcing sync to Supabase...');
        await window.offlineSyncManager.processSyncQueue();
        
        // Step 9: Check final queue status
        const queueFinal = JSON.parse(localStorage.getItem('qr_system_sync_queue') || '[]');
        console.log(`📋 Sync queue after sync: ${queueFinal.length} items`);
        
        if (queueFinal.length === 0) {
            console.log('🎉 SUCCESS: All operations synced to Supabase!');
        } else {
            console.warn('⚠️ Some operations still pending:', queueFinal);
        }
        
        // Step 10: Verify material was updated
        const verifyMaterial = window.OfflineDataManager.getMaterial(testMaterial.id);
        if (verifyMaterial && verifyMaterial.quantity === newQuantity) {
            console.log('✅ Material quantity verified locally:', verifyMaterial.quantity);
        } else {
            console.error('❌ Material quantity mismatch');
        }
        
        console.log('\n📊 TEST SUMMARY:');
        console.log(`✅ Supabase mode: ${window.AuthManager.useSupabase()}`);
        console.log(`✅ Authenticated: ${await window.AuthManager.isAuthenticated()}`);
        console.log(`✅ Material updated: ${testMaterial.id}`);
        console.log(`✅ Quantity: ${originalQuantity} → ${newQuantity}`);
        console.log(`✅ Sync queue processed: ${queueAfter.length} → ${queueFinal.length}`);
        
        if (queueFinal.length === 0) {
            console.log('🎉 MATERIAL SYNC FIX SUCCESSFUL!');
        } else {
            console.warn('⚠️ Some operations may need manual review');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.log('💡 Make sure you are:');
        console.log('  1. Logged into the QR System');
        console.log('  2. Authenticated with Supabase');
        console.log('  3. Have network connectivity');
    }
})();

console.log('\n📋 INSTRUCTIONS:');
console.log('1. Make sure you are logged into the QR System');
console.log('2. Open browser console (F12)');
console.log('3. Copy and paste this script');
console.log('4. Check the console output for results');
console.log('5. If successful, try a Material In/Out operation to verify');