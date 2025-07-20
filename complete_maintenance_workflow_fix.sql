-- Complete Enhanced Maintenance Workflow Fix
-- This script will add all missing columns and fix all issues

-- 1. First, let's add all the missing columns to equipment_maintenance_logs table
ALTER TABLE equipment_maintenance_logs 
ADD COLUMN IF NOT EXISTS assigned_technician TEXT,
ADD COLUMN IF NOT EXISTS workflow_step TEXT DEFAULT 'marked',
ADD COLUMN IF NOT EXISTS inspection_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS work_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS work_completion_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS equipment_condition_before TEXT,
ADD COLUMN IF NOT EXISTS equipment_condition_after TEXT,
ADD COLUMN IF NOT EXISTS safety_checks_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS quality_checks_completed BOOLEAN DEFAULT false;

-- 2. Add constraint for workflow_step if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'equipment_maintenance_logs_workflow_step_check'
    ) THEN
        ALTER TABLE equipment_maintenance_logs 
        ADD CONSTRAINT equipment_maintenance_logs_workflow_step_check 
        CHECK (workflow_step IN ('marked', 'inspected', 'in_progress', 'completed'));
    END IF;
END $$;

-- 3. Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_logs_workflow_step ON equipment_maintenance_logs(workflow_step);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_logs_assigned_technician ON equipment_maintenance_logs(assigned_technician);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_logs_inspection_date ON equipment_maintenance_logs(inspection_date);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_logs_work_start_date ON equipment_maintenance_logs(work_start_date);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_logs_work_completion_date ON equipment_maintenance_logs(work_completion_date);

-- 4. Update existing records to have proper workflow_step based on their status
UPDATE equipment_maintenance_logs 
SET workflow_step = CASE status
  WHEN 'scheduled' THEN 'marked'
  WHEN 'in_progress' THEN 'in_progress'
  WHEN 'completed' THEN 'completed'
  WHEN 'cancelled' THEN 'marked'
  ELSE 'marked'
END
WHERE workflow_step IS NULL OR workflow_step = '';

-- 5. Create or recreate the maintenance workflow history table
DROP TABLE IF EXISTS maintenance_workflow_history CASCADE;
CREATE TABLE maintenance_workflow_history (
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

-- 6. Create indexes for workflow history
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

-- 9. Create function to automatically update workflow step based on status
CREATE OR REPLACE FUNCTION update_maintenance_workflow_step()
RETURNS TRIGGER AS $$
BEGIN
  -- Update workflow_step based on status changes
  IF NEW.status = 'scheduled' AND OLD.status != 'scheduled' THEN
    NEW.workflow_step := 'marked';
  ELSIF NEW.status = 'in_progress' AND OLD.status != 'in_progress' THEN
    NEW.workflow_step := 'in_progress';
    NEW.work_start_date := COALESCE(NEW.work_start_date, NOW());
  ELSIF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.workflow_step := 'completed';
    NEW.work_completion_date := COALESCE(NEW.work_completion_date, NOW());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger for automatic workflow step updates
DROP TRIGGER IF EXISTS equipment_maintenance_workflow_trigger ON equipment_maintenance_logs;
CREATE TRIGGER equipment_maintenance_workflow_trigger
  BEFORE UPDATE ON equipment_maintenance_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_maintenance_workflow_step();

-- 11. Create function to log workflow changes
CREATE OR REPLACE FUNCTION log_maintenance_workflow_change(
  p_maintenance_log_id TEXT,
  p_workflow_step TEXT,
  p_action_performed TEXT,
  p_performed_by TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_equipment_status_before TEXT DEFAULT NULL,
  p_equipment_status_after TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  history_id TEXT;
BEGIN
  INSERT INTO maintenance_workflow_history (
    maintenance_log_id,
    workflow_step,
    action_performed,
    performed_by,
    notes,
    equipment_status_before,
    equipment_status_after
  ) VALUES (
    p_maintenance_log_id,
    p_workflow_step,
    p_action_performed,
    p_performed_by,
    p_notes,
    p_equipment_status_before,
    p_equipment_status_after
  ) RETURNING id INTO history_id;
  
  RETURN history_id;
END;
$$ LANGUAGE plpgsql;

-- 12. Create trigger to automatically log workflow changes
CREATE OR REPLACE FUNCTION trigger_maintenance_workflow_log()
RETURNS TRIGGER AS $$
BEGIN
  -- Log workflow step changes
  IF NEW.workflow_step != OLD.workflow_step THEN
    PERFORM log_maintenance_workflow_change(
      NEW.id,
      NEW.workflow_step,
      'Workflow step changed from ' || OLD.workflow_step || ' to ' || NEW.workflow_step,
      NEW.completed_by,
      'Automatic workflow step update',
      OLD.workflow_step,
      NEW.workflow_step
    );
  END IF;
  
  -- Log status changes
  IF NEW.status != OLD.status THEN
    PERFORM log_maintenance_workflow_change(
      NEW.id,
      NEW.workflow_step,
      'Status changed from ' || OLD.status || ' to ' || NEW.status,
      NEW.completed_by,
      'Status update',
      OLD.status,
      NEW.status
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 13. Create trigger for automatic workflow logging
DROP TRIGGER IF EXISTS equipment_maintenance_workflow_log_trigger ON equipment_maintenance_logs;
CREATE TRIGGER equipment_maintenance_workflow_log_trigger
  AFTER UPDATE ON equipment_maintenance_logs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_maintenance_workflow_log();

-- 14. Create or recreate the maintenance dashboard view
DROP VIEW IF EXISTS maintenance_dashboard_view;
CREATE VIEW maintenance_dashboard_view AS
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

-- 15. Create maintenance statistics functions
DROP FUNCTION IF EXISTS get_maintenance_statistics(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE);
DROP FUNCTION IF EXISTS get_maintenance_statistics();
DROP FUNCTION IF EXISTS get_maintenance_statistics_simple();

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

-- 16. Grant permissions
GRANT SELECT ON maintenance_dashboard_view TO authenticated;
GRANT EXECUTE ON FUNCTION get_maintenance_statistics(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_maintenance_statistics_simple() TO authenticated;
GRANT EXECUTE ON FUNCTION log_maintenance_workflow_change(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 17. Insert sample workflow history for existing maintenance logs
INSERT INTO maintenance_workflow_history (
  maintenance_log_id,
  workflow_step,
  action_performed,
  performed_by,
  notes,
  equipment_status_before,
  equipment_status_after
)
SELECT 
  id,
  CASE status
    WHEN 'scheduled' THEN 'marked'
    WHEN 'in_progress' THEN 'in_progress'
    WHEN 'completed' THEN 'completed'
    ELSE 'marked'
  END,
  'Initial workflow setup',
  completed_by,
  'Migration: Setting up workflow history for existing records',
  'unknown',
  status
FROM equipment_maintenance_logs
WHERE id NOT IN (SELECT DISTINCT maintenance_log_id FROM maintenance_workflow_history);

-- 18. Verification queries
SELECT '=== VERIFICATION RESULTS ===' as verification_header;

SELECT '1. Checking equipment_maintenance_logs columns:' as check_name;
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

SELECT '2. Testing get_maintenance_statistics_simple() function:' as check_name;
SELECT * FROM get_maintenance_statistics_simple();

SELECT '3. Testing maintenance_dashboard_view:' as check_name;
SELECT 
  equipment_name,
  maintenance_type,
  status,
  workflow_status_display,
  workflow_step_display
FROM maintenance_dashboard_view
LIMIT 5;

SELECT '4. Checking workflow history table:' as check_name;
SELECT 
  COUNT(*) as total_history_records
FROM maintenance_workflow_history;

SELECT '5. Checking triggers:' as check_name;
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers 
WHERE event_object_table = 'equipment_maintenance_logs'
ORDER BY trigger_name;

SELECT '=== ENHANCED MAINTENANCE WORKFLOW SETUP COMPLETE ===' as completion_message; 