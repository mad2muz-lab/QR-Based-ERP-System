-- Fix for Enhanced Maintenance Workflow Migration
-- Run these commands to fix the missing function and ensure all features work properly

-- 1. First, let's check if the function exists and drop it if it does
DROP FUNCTION IF EXISTS get_maintenance_statistics(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE);
DROP FUNCTION IF EXISTS get_maintenance_statistics();

-- 2. Create the maintenance statistics function properly
CREATE OR REPLACE FUNCTION get_maintenance_statistics(
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  total_maintenance_requests BIGINT,
  completed_maintenance BIGINT,
  in_progress_maintenance BIGINT,
  scheduled_maintenance BIGINT,
  average_completion_time_hours NUMERIC,
  total_cost NUMERIC,
  repair_count BIGINT,
  service_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_maintenance_requests,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_maintenance,
    COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_maintenance,
    COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled_maintenance,
    COALESCE(AVG(actual_duration_hours) FILTER (WHERE status = 'completed'), 0) as average_completion_time_hours,
    COALESCE(SUM(cost) FILTER (WHERE status = 'completed'), 0) as total_cost,
    COUNT(*) FILTER (WHERE maintenance_type = 'repair') as repair_count,
    COUNT(*) FILTER (WHERE maintenance_type = 'service') as service_count
  FROM equipment_maintenance_logs
  WHERE (p_start_date IS NULL OR start_date >= p_start_date)
    AND (p_end_date IS NULL OR start_date <= p_end_date);
END;
$$ LANGUAGE plpgsql;

-- 3. Create a simpler version without parameters for easier testing
CREATE OR REPLACE FUNCTION get_maintenance_statistics_simple()
RETURNS TABLE (
  total_maintenance_requests BIGINT,
  completed_maintenance BIGINT,
  in_progress_maintenance BIGINT,
  scheduled_maintenance BIGINT,
  average_completion_time_hours NUMERIC,
  total_cost NUMERIC,
  repair_count BIGINT,
  service_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_maintenance_requests,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_maintenance,
    COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_maintenance,
    COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled_maintenance,
    COALESCE(AVG(actual_duration_hours) FILTER (WHERE status = 'completed'), 0) as average_completion_time_hours,
    COALESCE(SUM(cost) FILTER (WHERE status = 'completed'), 0) as total_cost,
    COUNT(*) FILTER (WHERE maintenance_type = 'repair') as repair_count,
    COUNT(*) FILTER (WHERE maintenance_type = 'service') as service_count
  FROM equipment_maintenance_logs;
END;
$$ LANGUAGE plpgsql;

-- 4. Ensure the maintenance dashboard view exists
CREATE OR REPLACE VIEW maintenance_dashboard_view AS
SELECT 
  ml.*,
  e.name as equipment_name,
  e.custom_equipment_id,
  e.type as equipment_type,
  e.site as equipment_site,
  e.operational_status as equipment_operational_status,
  CASE 
    WHEN ml.status = 'scheduled' THEN 'Pending Inspection'
    WHEN ml.status = 'in_progress' THEN 'Work In Progress'
    WHEN ml.status = 'completed' THEN 'Completed'
    WHEN ml.status = 'cancelled' THEN 'Cancelled'
    ELSE 'Unknown'
  END as workflow_status_display,
  CASE 
    WHEN ml.workflow_step = 'marked' THEN 'Marked for Maintenance'
    WHEN ml.workflow_step = 'inspected' THEN 'Inspected by Technician'
    WHEN ml.workflow_step = 'in_progress' THEN 'Work Started'
    WHEN ml.workflow_step = 'completed' THEN 'Work Completed'
    ELSE 'Unknown'
  END as workflow_step_display,
  EXTRACT(EPOCH FROM (COALESCE(ml.work_completion_date, NOW()) - ml.start_date)) / 3600 as total_hours_elapsed,
  EXTRACT(EPOCH FROM (COALESCE(ml.work_completion_date, NOW()) - COALESCE(ml.work_start_date, ml.start_date))) / 3600 as work_hours_elapsed
FROM equipment_maintenance_logs ml
LEFT JOIN equipment e ON ml.equipment_id = e.id
ORDER BY 
  CASE ml.status
    WHEN 'in_progress' THEN 1
    WHEN 'scheduled' THEN 2
    WHEN 'completed' THEN 3
    WHEN 'cancelled' THEN 4
    ELSE 5
  END,
  ml.start_date DESC;

-- 5. Ensure the workflow history table exists
CREATE TABLE IF NOT EXISTS maintenance_workflow_history (
  id TEXT PRIMARY KEY DEFAULT ('mwh-' || replace(gen_random_uuid()::text, '-', '')),
  maintenance_log_id TEXT NOT NULL REFERENCES equipment_maintenance_logs(id) ON DELETE CASCADE,
  workflow_step TEXT NOT NULL,
  action_performed TEXT NOT NULL,
  performed_by TEXT,
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  equipment_status_before TEXT,
  equipment_status_after TEXT
);

-- 6. Create indexes for workflow history if they don't exist
CREATE INDEX IF NOT EXISTS idx_maintenance_workflow_history_maintenance_log ON maintenance_workflow_history(maintenance_log_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_workflow_history_performed_at ON maintenance_workflow_history(performed_at);

-- 7. Enable RLS on workflow history table
ALTER TABLE maintenance_workflow_history ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for workflow history
DROP POLICY IF EXISTS "Allow authenticated users to view workflow history" ON maintenance_workflow_history;
DROP POLICY IF EXISTS "Allow authenticated users to create workflow history" ON maintenance_workflow_history;

CREATE POLICY "Allow authenticated users to view workflow history"
  ON maintenance_workflow_history FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to create workflow history"
  ON maintenance_workflow_history FOR INSERT TO authenticated WITH CHECK (true);

-- 9. Grant permissions
GRANT SELECT ON maintenance_dashboard_view TO authenticated;
GRANT EXECUTE ON FUNCTION get_maintenance_statistics(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_maintenance_statistics_simple() TO authenticated;

-- 10. Test the functions
SELECT 'Testing get_maintenance_statistics_simple() function:' as test_message;
SELECT * FROM get_maintenance_statistics_simple();

SELECT 'Testing get_maintenance_statistics() function with parameters:' as test_message;
SELECT * FROM get_maintenance_statistics();

SELECT 'Testing maintenance_dashboard_view:' as test_message;
SELECT 
  equipment_name,
  maintenance_type,
  status,
  workflow_status_display,
  workflow_step_display
FROM maintenance_dashboard_view
LIMIT 5;

-- 11. Check if all required columns exist in equipment_maintenance_logs
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'equipment_maintenance_logs' 
  AND column_name IN (
    'assigned_technician', 
    'workflow_step', 
    'inspection_date', 
    'work_start_date', 
    'work_completion_date',
    'equipment_condition_before',
    'equipment_condition_after',
    'safety_checks_completed',
    'quality_checks_completed'
  )
ORDER BY column_name;

-- Success message
SELECT 'Enhanced maintenance workflow functions fixed successfully!' as status; 