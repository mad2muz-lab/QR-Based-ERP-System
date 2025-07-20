-- Enhanced Maintenance Workflow Migration Commands
-- Run these commands in your Supabase SQL editor or database client

-- 1. Apply the enhanced maintenance workflow migration
\i supabase/migrations/20250133000000_enhanced_maintenance_workflow.sql

-- 2. Verify the migration was applied successfully
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'equipment_maintenance_logs' 
  AND column_name IN ('assigned_technician', 'workflow_step', 'inspection_date', 'work_start_date', 'work_completion_date')
ORDER BY column_name;

-- 3. Check if the workflow history table was created
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'maintenance_workflow_history'
ORDER BY ordinal_position;

-- 4. Verify the dashboard view was created
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name = 'maintenance_dashboard_view';

-- 5. Test the maintenance statistics function
SELECT * FROM get_maintenance_statistics_simple();

-- 6. Check existing maintenance logs and their workflow steps
SELECT 
  id,
  equipment_id,
  maintenance_type,
  status,
  workflow_step,
  start_date,
  completion_date
FROM equipment_maintenance_logs
ORDER BY start_date DESC
LIMIT 10;

-- 7. Verify workflow history was populated for existing records
SELECT 
  mwh.maintenance_log_id,
  mwh.workflow_step,
  mwh.action_performed,
  mwh.performed_at,
  ml.status as maintenance_status
FROM maintenance_workflow_history mwh
JOIN equipment_maintenance_logs ml ON mwh.maintenance_log_id = ml.id
ORDER BY mwh.performed_at DESC
LIMIT 10;

-- 8. Test the dashboard view
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

-- 9. Check RLS policies are in place
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('equipment_maintenance_logs', 'maintenance_workflow_history')
ORDER BY tablename, policyname;

-- 10. Verify triggers are working
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('equipment_maintenance_logs')
ORDER BY trigger_name;

-- Success message
SELECT 'Enhanced maintenance workflow migration completed successfully!' as status; 