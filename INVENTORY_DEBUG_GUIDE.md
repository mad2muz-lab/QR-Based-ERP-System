# Inventory System Debugging Guide

## Issue: No notifications or data in inventory page after submitting maintenance request

Let's debug this step by step. Please run these SQL queries in your Supabase SQL editor to identify where the issue is:

## Step 1: Check if tables exist and have data

```sql
-- Check if inventory tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('cm_inventory_material_requests', 'cm_material_request_items');

-- Check if there are any inventory requests
SELECT COUNT(*) as inventory_requests_count FROM cm_inventory_material_requests;

-- Check if there are any material request items
SELECT COUNT(*) as material_items_count FROM cm_material_request_items;

-- Check recent inventory requests (if any)
SELECT 
  id, 
  equipment_name, 
  status, 
  priority, 
  created_at,
  requested_by
FROM cm_inventory_material_requests 
ORDER BY created_at DESC 
LIMIT 5;
```

## Step 2: Check if maintenance requests have materials selected

```sql
-- Check recent maintenance requests
SELECT 
  id, 
  equipment_name, 
  issue_description,
  inventory_request_id,
  inventory_status,
  created_at
FROM corrective_maintenance_requests 
ORDER BY created_at DESC 
LIMIT 5;
```

## Step 3: Check if notifications exist

```sql
-- Check if there are any inventory notifications
SELECT 
  id, 
  title, 
  message, 
  type, 
  user_id,
  created_at
FROM notifications 
WHERE type = 'inventory' 
ORDER BY created_at DESC 
LIMIT 10;

-- Check all recent notifications
SELECT 
  id, 
  title, 
  message, 
  type, 
  user_id,
  created_at
FROM notifications 
ORDER BY created_at DESC 
LIMIT 10;
```

## Step 4: Check if the notification trigger function exists

```sql
-- Check if the notification trigger function exists
SELECT 
  routine_name, 
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'create_inventory_notification';

-- Check if the trigger exists
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name = 'inventory_material_request_notification';
```

## Step 5: Test the notification trigger manually

```sql
-- Test the notification trigger by creating a test inventory request
INSERT INTO cm_inventory_material_requests (
  id,
  maintenance_request_id,
  equipment_id,
  equipment_name,
  site,
  requested_by,
  status,
  priority,
  materials_requested,
  total_estimated_cost
) VALUES (
  'test-inventory-' || gen_random_uuid(),
  (SELECT id FROM corrective_maintenance_requests LIMIT 1),
  (SELECT id FROM equipment LIMIT 1),
  'Test Equipment',
  'Test Site',
  (SELECT id FROM auth.users WHERE username = 'admin' LIMIT 1),
  'pending',
  'medium',
  '[]',
  0
);

-- Check if notification was created
SELECT 
  id, 
  title, 
  message, 
  type, 
  user_id,
  created_at
FROM notifications 
WHERE type = 'inventory' 
ORDER BY created_at DESC 
LIMIT 5;

-- Clean up test data
DELETE FROM cm_inventory_material_requests WHERE equipment_name = 'Test Equipment';
DELETE FROM notifications WHERE title = 'Inventory Material Request' AND message LIKE '%Test Equipment%';
```

## Step 6: Check user data

```sql
-- Check if admin and maintenance users exist
SELECT 
  id, 
  username, 
  email, 
  role
FROM auth.users 
WHERE username = 'admin' OR email = 'maintenance@system.local';
```

## Common Issues and Solutions:

### Issue 1: No materials selected in maintenance form
**Solution:** Make sure you're selecting materials in the maintenance form before submitting.

### Issue 2: Notification trigger not working
**Solution:** Run the updated notification trigger SQL:
```sql
CREATE OR REPLACE FUNCTION public.create_inventory_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      entity_type,
      entity_id,
      priority,
      action_url,
      created_at
    ) 
    SELECT 
      u.id,
      'Inventory Material Request',
      'New material request for equipment ' || NEW.equipment_name || ' requires inventory review.',
      'inventory',
      'equipment',
      NEW.equipment_id,
      NEW.priority,
      '/inventory/requests/' || NEW.id,
      now()
    FROM public.users u 
    WHERE u.username = 'admin' OR u.email = 'maintenance@system.local';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Issue 3: Tables don't exist
**Solution:** Run the table creation SQL from the implementation guide.

### Issue 4: Users don't exist
**Solution:** Make sure admin and maintenance users exist in the auth.users table.

## Browser Console Debugging:

1. **Open browser developer tools** (F12)
2. **Go to Console tab**
3. **Submit a maintenance request with materials**
4. **Look for any error messages** in the console
5. **Check Network tab** for failed API calls

## Expected Flow:

1. **Submit maintenance request** with materials selected
2. **Inventory request created** in `cm_inventory_material_requests`
3. **Material items created** in `cm_material_request_items`
4. **Notification created** for admin/maintenance users
5. **Notification appears** in the notification bell
6. **Click notification** → Navigate to inventory request detail

Please run these queries and share the results so we can identify exactly where the issue is occurring. 