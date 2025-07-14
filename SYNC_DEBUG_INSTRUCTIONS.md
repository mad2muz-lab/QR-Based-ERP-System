# Material Sync Debug Instructions

The material quantity updates are not syncing to Supabase. Here's how to debug and fix the issue:

## Quick Debug Steps

1. **Open the application** in your browser (http://localhost:5176/)

2. **Open browser console** (F12 → Console tab)

3. **Run the debug script**:
   ```javascript
   // Copy and paste this into the console:
   fetch('/debug_sync.js').then(r => r.text()).then(eval);
   ```
   
   OR manually run:
   ```javascript
   window.debugSyncStatus();
   ```

4. **Check the output** for:
   - Pending material operations
   - Sync errors
   - Failed operations
   - Supabase availability

## Common Issues and Solutions

### Issue 1: Operations Queued but Not Syncing
**Symptoms**: You see material operations in the queue but they're not processing

**Solutions**:
- Check if you're authenticated with Supabase
- Verify network connectivity
- Force sync manually:
  ```javascript
  window.offlineSyncManager.forcSync();
  ```

### Issue 2: Supabase Authentication
**Symptoms**: "Supabase not configured" errors

**Solutions**:
- Check if you're logged into Supabase mode
- Verify Supabase credentials in environment variables
- Check browser network tab for 401/403 errors

### Issue 3: Material Update Operations Missing
**Symptoms**: No material operations in the sync queue

**Solutions**:
- The issue is in the `createMaterialLog` function
- Material updates might not be getting queued properly

## Manual Testing

1. **Test Material In/Out Operation**:
   - Scan a material QR code
   - Perform Material In or Material Out
   - Immediately run: `window.debugSyncStatus()`
   - Check if material update operations appear in the queue

2. **Force Sync**:
   ```javascript
   // Check current status
   console.log(window.offlineSyncManager.getStatus());
   
   // Force sync
   window.offlineSyncManager.forcSync().then(() => {
     console.log('Sync completed');
     console.log(window.offlineSyncManager.getStatus());
   });
   ```

3. **Clear Sync Queue** (if needed):
   ```javascript
   window.offlineSyncManager.clearSyncQueue();
   window.offlineSyncManager.clearErrors();
   ```

## Expected Behavior

When you perform a Material In/Out operation:
1. A `materialLog` should be created (type: 'create')
2. A `material` update should be queued (type: 'update')
3. Both should sync to Supabase when online

## Next Steps

After running the debug script, check:
1. Are material update operations being queued?
2. Are there any sync errors?
3. Is Supabase properly configured?
4. Are operations failing due to authentication?

Share the console output to help identify the specific issue.