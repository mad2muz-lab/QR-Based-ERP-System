-- Check the current schema of preventive_maintenance_logs table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'preventive_maintenance_logs'
ORDER BY ordinal_position;

-- Show sample data from preventive_maintenance_logs
SELECT 
  id,
  equipment_id,
  maintenance_class,
  status,
  scheduled_date,
  completed_date,
  created_at
FROM preventive_maintenance_logs
ORDER BY created_at DESC
LIMIT 5;

-- Check if there are any logs with completed status
SELECT 
  COUNT(*) as total_logs,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_logs,
  COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_logs,
  COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_logs
FROM preventive_maintenance_logs; 