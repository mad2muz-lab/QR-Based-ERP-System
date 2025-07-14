// Debug script to check sync queue status
// Run this in browser console to see current sync status

console.log('=== SYNC DEBUG INFO ===');

// Function to debug sync status
function debugSyncStatus() {
  console.log('\n--- Checking localStorage directly ---');
  
  // Check localStorage for pending operations
  const pendingOps = localStorage.getItem('qr_system_sync_queue');
  if (pendingOps) {
    const operations = JSON.parse(pendingOps);
    console.log('Total Pending Operations:', operations.length);
    console.log('All Pending Operations:', operations);
    
    // Filter material operations
    const materialOps = operations.filter(op => op.entityType === 'material');
    console.log('Material Operations Count:', materialOps.length);
    console.log('Material Operations:', materialOps);
    
    // Check for material update operations specifically
    const materialUpdates = materialOps.filter(op => op.type === 'update');
    console.log('Material Update Operations:', materialUpdates);
  } else {
    console.log('No pending operations found in localStorage');
  }
  
  // Check for sync errors
  const syncErrors = localStorage.getItem('qr_system_sync_errors');
  if (syncErrors) {
    const errors = JSON.parse(syncErrors);
    console.log('Sync Errors Count:', errors.length);
    console.log('Sync Errors:', errors);
    
    // Filter material-related errors
    const materialErrors = errors.filter(err => err.operation?.entityType === 'material');
    if (materialErrors.length > 0) {
      console.log('Material-related Errors:', materialErrors);
    }
  } else {
    console.log('No sync errors found');
  }
  
  // Check failed operations
  const failedOps = localStorage.getItem('qr_system_failed_sync');
  if (failedOps) {
    const failed = JSON.parse(failedOps);
    console.log('Failed Operations Count:', failed.length);
    console.log('Failed Operations:', failed);
    
    // Filter material-related failed operations
    const materialFailed = failed.filter(f => f.operation?.entityType === 'material');
    if (materialFailed.length > 0) {
      console.log('Material-related Failed Operations:', materialFailed);
    }
  } else {
    console.log('No failed operations found');
  }
  
  // Check last sync time
  const lastSync = localStorage.getItem('qr_system_last_sync');
  console.log('Last Sync Time:', lastSync);
  
  // Check network status
  console.log('Navigator Online:', navigator.onLine);
  
  // Check Supabase availability
  console.log('\n--- Checking Supabase ---');
  if (typeof window.supabase !== 'undefined') {
    console.log('Supabase client available:', !!window.supabase);
  } else {
    console.log('Supabase not available on window object');
  }
}

// Run the debug function
debugSyncStatus();

// Try to access offlineSyncManager from window or import
if (typeof window !== 'undefined') {
  // Try to get it from window first
  if (window.offlineSyncManager) {
    const syncManager = window.offlineSyncManager;
    console.log('\n--- Using offlineSyncManager from window ---');
    
    const status = syncManager.getStatus();
    console.log('Sync Manager Status:', status);
    
    // Force sync if online
    if (status.isOnline && !status.isSyncing && status.pendingOperations > 0) {
      console.log('Forcing sync...');
      syncManager.forcSync().then(() => {
        console.log('Force sync completed');
        // Re-check status after sync
        setTimeout(() => {
          console.log('Post-sync status:', syncManager.getStatus());
        }, 2000);
      }).catch(error => {
        console.error('Force sync failed:', error);
      });
    }
  } else {
    console.log('\n--- offlineSyncManager not available on window ---');
    console.log('Available window properties:', Object.keys(window).filter(k => k.includes('sync') || k.includes('offline')));
  }
}

console.log('\n=== END DEBUG INFO ===');

// Export debug function for manual use
if (typeof window !== 'undefined') {
  window.debugSyncStatus = debugSyncStatus;
  console.log('\nDebug function available as: window.debugSyncStatus()');
}