-- Test Enhanced Maintenance Workflow
-- This script will help verify that maintenance logs are being created and stored properly

-- 1. Check if equipment_maintenance_logs table exists and has data
SELECT '=== CHECKING MAINTENANCE LOGS TABLE ===' as test_section;

SELECT 
  COUNT(*) as total_maintenance_logs,
  COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled_logs,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_logs,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_logs,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_logs
FROM equipment_maintenance_logs;

-- 2. Show recent maintenance logs
SELECT '=== RECENT MAINTENANCE LOGS ===' as test_section;

SELECT 
  id,
  equipment_id,
  maintenance_type,
  status,
  workflow_step,
  description,
  start_date,
  created_at
FROM equipment_maintenance_logs
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check if equipment table has equipment that can be marked for maintenance
SELECT '=== EQUIPMENT AVAILABLE FOR MAINTENANCE ===' as test_section;

SELECT 
  id,
  name,
  custom_equipment_id,
  type,
  site,
  status,
  operational_status
FROM equipment
WHERE status IN ('available', 'in-use', 'maintenance')
ORDER BY name
LIMIT 10;

-- 4. Test the maintenance dashboard view
SELECT '=== MAINTENANCE DASHBOARD VIEW TEST ===' as test_section;

SELECT 
  equipment_name,
  maintenance_type,
  status,
  workflow_status_display,
  workflow_step_display,
  total_hours_elapsed,
  work_hours_elapsed
FROM maintenance_dashboard_view
ORDER BY start_date DESC
LIMIT 10;

-- 5. Check workflow history
SELECT '=== WORKFLOW HISTORY ===' as test_section;

SELECT 
  COUNT(*) as total_workflow_history_records
FROM maintenance_workflow_history;

SELECT 
  mwh.maintenance_log_id,
  mwh.workflow_step,
  mwh.action_performed,
  mwh.performed_at,
  ml.status as maintenance_status,
  ml.description
FROM maintenance_workflow_history mwh
JOIN equipment_maintenance_logs ml ON mwh.maintenance_log_id = ml.id
ORDER BY mwh.performed_at DESC
LIMIT 10;

-- 6. Test maintenance statistics
SELECT '=== MAINTENANCE STATISTICS ===' as test_section;

SELECT * FROM get_maintenance_statistics_simple();

-- 7. Check for any maintenance logs created in the last 24 hours
SELECT '=== RECENT MAINTENANCE ACTIVITY (LAST 24 HOURS) ===' as test_section;

SELECT 
  id,
  equipment_id,
  maintenance_type,
  status,
  workflow_step,
  description,
  created_at
FROM equipment_maintenance_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 8. Check if there are any equipment logs related to maintenance
SELECT '=== EQUIPMENT LOGS WITH MAINTENANCE ACTIONS ===' as test_section;

SELECT 
  id,
  equipmentId,
  action,
  date,
  time,
  notes
FROM equipment_logs
WHERE action IN ('maintenance-start', 'maintenance-end')
ORDER BY timestamp DESC
LIMIT 10;

-- 9. Verify database structure
SELECT '=== DATABASE STRUCTURE VERIFICATION ===' as test_section;

SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'equipment_maintenance_logs' 
  AND column_name IN (
    'id', 'equipment_id', 'maintenance_type', 'status', 'workflow_step',
    'description', 'start_date', 'created_at'
  )
ORDER BY column_name;

-- 10. Test creating a sample maintenance log
SELECT '=== TESTING SAMPLE MAINTENANCE LOG CREATION ===' as test_section;

-- First, get a sample equipment ID
DO $$
DECLARE
  sample_equipment_id TEXT;
BEGIN
  SELECT id INTO sample_equipment_id 
  FROM equipment 
  LIMIT 1;
  
  IF sample_equipment_id IS NOT NULL THEN
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
      'test-maint-' || extract(epoch from now())::text,
      sample_equipment_id,
      'service',
      'scheduled',
      'marked',
      'Test maintenance log created by SQL script',
      NOW(),
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Test maintenance log created for equipment: %', sample_equipment_id;
  ELSE
    RAISE NOTICE 'No equipment found to create test maintenance log';
  END IF;
END $$;

-- 11. Show the test log that was just created
SELECT '=== TEST MAINTENANCE LOG CREATED ===' as test_section;

SELECT 
  id,
  equipment_id,
  maintenance_type,
  status,
  workflow_step,
  description,
  created_at
FROM equipment_maintenance_logs
WHERE description LIKE 'Test maintenance log created by SQL script%'
ORDER BY created_at DESC
LIMIT 5;

-- 12. Clean up test data (optional - uncomment if you want to remove test logs)
-- DELETE FROM equipment_maintenance_logs 
-- WHERE description LIKE 'Test maintenance log created by SQL script%';

SELECT '=== MAINTENANCE WORKFLOW TEST COMPLETE ===' as completion_message; 