# Notification System Rollback Instructions

## Overview
This document provides instructions for rolling back the notification system implementation if needed. All changes were made using an append method to preserve existing functionality.

## Rollback Steps

### 1. Database Rollback

Run these SQL commands in your Supabase SQL editor to rollback database changes:

```sql
-- Step 1: Remove the maintenance notification trigger
DROP TRIGGER IF EXISTS equipment_maintenance_notification ON public.equipment;
DROP FUNCTION IF EXISTS public.create_maintenance_notification();

-- Step 2: Remove the corrective maintenance requests table
DROP TABLE IF EXISTS public.corrective_maintenance_requests CASCADE;

-- Step 3: Remove enhanced notification columns (optional - these are additive)
-- ALTER TABLE public.notifications DROP COLUMN IF EXISTS maintenance_request_id;
-- ALTER TABLE public.notifications DROP COLUMN IF EXISTS priority;
-- ALTER TABLE public.notifications DROP COLUMN IF EXISTS assigned_to;
-- DROP INDEX IF EXISTS idx_notifications_maintenance_request_id;

-- Step 4: Remove migration log entries
DELETE FROM migration_rollback_log WHERE migration_name LIKE '%notification%' OR migration_name LIKE '%maintenance%';

-- Step 5: Restore from backup (if needed)
-- INSERT INTO notifications SELECT * FROM notifications_backup;
-- INSERT INTO equipment SELECT * FROM equipment_backup;
```

### 2. Code Rollback

Delete the following files that were created:

```bash
# Remove new TypeScript files
rm src/types/correctiveMaintenance.ts
rm src/utils/correctiveMaintenanceService.ts
rm src/components/maintenance/CorrectiveMaintenanceForm.tsx
rm src/components/maintenance/MaintenancePage.tsx

# Remove migration files
rm supabase/migrations/20250118_create_corrective_maintenance_requests.sql
rm supabase/migrations/20250118_enhance_notifications_table.sql
rm supabase/migrations/20250118_create_maintenance_notification_trigger.sql
```

### 3. Code Reversion

Revert the following files to their original state:

#### A. Revert routes.tsx
Remove these lines from `src/routes.tsx`:
```typescript
import MaintenancePage from './components/maintenance/MaintenancePage';
```
And remove these route objects:
```typescript
{
  path: '/maintenance',
  element: (
    <LazyComponentErrorBoundary>
      <Suspense fallback={<LoadingSpinner message="Loading Maintenance Page..." />}>
        <MaintenancePage />
      </Suspense>
    </LazyComponentErrorBoundary>
  ),
},
{
  path: '/maintenance/corrective/new',
  element: (
    <LazyComponentErrorBoundary>
      <Suspense fallback={<LoadingSpinner message="Loading Corrective Maintenance Form..." />}>
        <MaintenancePage />
      </Suspense>
    </LazyComponentErrorBoundary>
  ),
},
```

#### B. Revert App.tsx
Remove these lines from `src/App.tsx`:
```typescript
const handleNotificationClick = (notification: any) => {
  if (notification.type === 'maintenance' && notification.action_url) {
    navigate(notification.action_url);
  }
};
```
And remove the `onNotificationClick={handleNotificationClick}` prop from the Header component.

#### C. Revert Header.tsx
Remove these changes from `src/components/layout/Header.tsx`:
1. Remove `onNotificationClick?: (notification: any) => void;` from HeaderProps interface
2. Remove `onNotificationClick` from the component parameters
3. Remove the maintenance navigation item from ALL_NAV_ITEMS
4. Remove the Wrench import
5. Revert the NotificationButton onNotificationClick prop to the original implementation

#### D. Revert NotificationButton.tsx
Remove these changes from `src/components/common/NotificationButton.tsx`:
1. Remove the new imports (Wrench, AlertTriangle, MaintenanceNotification)
2. Revert the notifications state type back to `any[]`
3. Remove the priority display logic in the notification rendering

### 4. Verification

After rollback, verify that:
1. The application starts without errors
2. All existing functionality works as before
3. No maintenance-related features are accessible
4. Notifications work as they did before the changes

## Rollback Confirmation

To confirm the rollback was successful, check that:
- No maintenance-related database tables exist
- No maintenance-related routes are accessible
- The notification system works as it did originally
- All existing equipment scanning and logging functionality is preserved

## Notes

- The rollback preserves all existing functionality
- No data is lost during rollback
- The backup tables created during implementation can be safely deleted after confirming rollback success
- If you need to restore specific data, use the backup tables created in the rollback point migration

## Emergency Contact

If you encounter issues during rollback, the original functionality should still be intact as all changes were additive. The core QR scanning and equipment management features were not modified. 