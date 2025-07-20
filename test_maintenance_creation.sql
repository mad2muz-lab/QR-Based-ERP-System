-- Test Maintenance Log Creation and Data Flow
-- This script will help verify that maintenance logs are being created properly

-- 1. Check current maintenance logs
SELECT '=== CURRENT MAINTENANCE LOGS ===' as test_section;

SELECT 
  COUNT(*) as total_logs,
  COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled_logs,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_logs,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_logs,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_logs
FROM equipment_maintenance_logs;

-- 2. Show recent maintenance logs with equipment details
SELECT '=== RECENT MAINTENANCE LOGS WITH EQUIPMENT ===' as test_section;

SELECT 
  ml.id,
  ml.equipment_id,
  e.name as equipment_name,
  e.custom_equipment_id,
  e.site as equipment_site,
  ml.maintenance_type,
  ml.status,
  ml.workflow_step,
  ml.description,
  ml.start_date,
  ml.created_at
FROM equipment_maintenance_logs ml
LEFT JOIN equipment e ON ml.equipment_id = e.id
ORDER BY ml.created_at DESC
LIMIT 10;

-- 3. Check if there are any equipment logs related to maintenance
SELECT '=== EQUIPMENT LOGS WITH MAINTENANCE ACTIONS ===' as test_section;

SELECT 
  COUNT(*) as total_maintenance_equipment_logs
FROM equipment_logs
WHERE action IN ('maintenance-start', 'maintenance-end');

SELECT 
  id,
  equipmentId,
  action,
  date,
  time,
  notes,
  timestamp
FROM equipment_logs
WHERE action IN ('maintenance-start', 'maintenance-end')
ORDER BY timestamp DESC
LIMIT 10;

-- 4. Test creating a sample maintenance log
SELECT '=== CREATING TEST MAINTENANCE LOG ===' as test_section;

-- First, get a sample equipment ID
DO $$
DECLARE
  sample_equipment_id TEXT;
  test_log_id TEXT;
BEGIN
  -- Get a sample equipment ID
  SELECT id INTO sample_equipment_id 
  FROM equipment 
  LIMIT 1;
  
  IF sample_equipment_id IS NOT NULL THEN
    -- Create a test maintenance log ID
    test_log_id := 'test-maint-' || extract(epoch from now())::text;
    
    -- Insert a test maintenance log
    INSERT INTO equipment_maintenance_logs (
      id,
      equipment_id,
      maintenance_type,
      status,
      workflow_step,
      description,
      start_date,
      created_at,
      updated_at
    ) VALUES (
      test_log_id,
      sample_equipment_id,
      'service',
      'scheduled',
      'marked',
      'Test maintenance log for Departments page verification',
      NOW(),
      NOW(),
      NOW()
    );
    
    -- Also create a corresponding equipment log
    INSERT INTO equipment_logs (
      id,
      equipmentId,
      action,
      date,
      time,
      notes,
      timestamp
    ) VALUES (
      'test-equip-log-' || extract(epoch from now())::text,
      sample_equipment_id,
      'maintenance-start',
      CURRENT_DATE,
      CURRENT_TIME,
      'Test maintenance log for Departments page verification',
      NOW()
    );
    
    RAISE NOTICE 'Test maintenance log created with ID: % for equipment: %', test_log_id, sample_equipment_id;
  ELSE
    RAISE NOTICE 'No equipment found to create test maintenance log';
  END IF;
END $$;

-- 5. Verify the test log was created
SELECT '=== VERIFYING TEST LOG CREATION ===' as test_section;

SELECT 
  ml.id,
  ml.equipment_id,
  e.name as equipment_name,
  ml.maintenance_type,
  ml.status,
  ml.workflow_step,
  ml.description,
  ml.created_at
FROM equipment_maintenance_logs ml
LEFT JOIN equipment e ON ml.equipment_id = e.id
WHERE ml.description LIKE 'Test maintenance log for Departments page verification%'
ORDER BY ml.created_at DESC
LIMIT 5;

-- 6. Check the maintenance dashboard view
SELECT '=== MAINTENANCE DASHBOARD VIEW TEST ===' as test_section;

SELECT 
  equipment_display_name,
  maintenance_type,
  status,
  workflow_status_display,
  workflow_step_display,
  total_hours_elapsed,
  work_hours_elapsed
FROM maintenance_dashboard_view
ORDER BY start_date DESC
LIMIT 10;

-- 7. Test the maintenance statistics function
SELECT '=== MAINTENANCE STATISTICS ===' as test_section;

SELECT * FROM get_maintenance_statistics_simple();

-- 8. Check for any recent activity (last 24 hours)
SELECT '=== RECENT ACTIVITY (LAST 24 HOURS) ===' as test_section;

SELECT 
  'Maintenance Logs' as source,
  COUNT(*) as count
FROM equipment_maintenance_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
  'Equipment Logs (Maintenance)' as source,
  COUNT(*) as count
FROM equipment_logs
WHERE action IN ('maintenance-start', 'maintenance-end')
  AND timestamp >= NOW() - INTERVAL '24 hours';

-- 9. Clean up test data (optional - uncomment if you want to remove test logs)
-- DELETE FROM equipment_maintenance_logs 
-- WHERE description LIKE 'Test maintenance log for Departments page verification%';
-- 
-- DELETE FROM equipment_logs 
-- WHERE notes LIKE 'Test maintenance log for Departments page verification%';

SELECT '=== MAINTENANCE CREATION TEST COMPLETE ===' as completion_message; 