-- Check the actual column names in preventive_maintenance_logs table
-- This will help us identify the correct column name for completion date

SELECT 
    'preventive_maintenance_logs table columns:' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'preventive_maintenance_logs' 
  AND (column_name LIKE '%completion%' OR column_name LIKE '%complete%')
ORDER BY column_name;

-- Check sample data to see the actual column names
SELECT 
    'Sample data from preventive_maintenance_logs:' as info;

SELECT 
    id,
    equipment_id,
    pm_class,
    completed_date,  -- This is the actual column name
    status,
    checklist_completed
FROM preventive_maintenance_logs 
LIMIT 3; 