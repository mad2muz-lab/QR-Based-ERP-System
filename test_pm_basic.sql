-- Basic PM System Test Script
-- This script tests the PM system step by step

-- 1. Check current database structure
SELECT 'Current Database Structure' as test_step;

SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'equipment'
ORDER BY ordinal_position;

-- 2. Check if PM tables exist
SELECT 'Checking PM Tables' as test_step;

SELECT 
  table_name,
  CASE WHEN table_name IN ('preventive_maintenance_configs', 'preventive_maintenance_logs') 
       THEN 'PM Table Found' 
       ELSE 'Not a PM Table' 
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('preventive_maintenance_configs', 'preventive_maintenance_logs');

-- 3. Check equipment data
SELECT 'Equipment Data' as test_step;

SELECT 
  id,
  name,
  type,
  status,
  CASE WHEN is_pm IS NULL THEN 'No PM Column' ELSE is_pm::text END as pm_status
FROM equipment
LIMIT 10;

-- 4. Check equipment logs
SELECT 'Equipment Logs' as test_step;

SELECT 
  COUNT(*) as total_logs,
  COUNT(CASE WHEN action = 'start-use' THEN 1 END) as start_actions,
  COUNT(CASE WHEN action = 'stop-use' THEN 1 END) as stop_actions
FROM equipment_logs;

-- 5. Show equipment usage summary
SELECT 'Equipment Usage Summary' as test_step;

SELECT 
  e.id,
  e.name,
  e.type,
  COUNT(el.id) as total_logs,
  COUNT(CASE WHEN el.action = 'start-use' THEN 1 END) as start_actions,
  COUNT(CASE WHEN el.action = 'stop-use' THEN 1 END) as stop_actions,
  MAX(el.created_at) as last_activity
FROM equipment e
LEFT JOIN equipment_logs el ON e.id = el.equipment_id
GROUP BY e.id, e.name, e.type
ORDER BY total_logs DESC
LIMIT 10;

-- 6. Check if we can create PM tables (test only)
SELECT 'PM Table Creation Test' as test_step;

-- This is just a test - won't actually create tables
SELECT 
  'preventive_maintenance_configs' as table_name,
  'Would create with columns: equipment_type, maintenance_class, threshold_hours, interval_days' as description
UNION ALL
SELECT 
  'preventive_maintenance_logs' as table_name,
  'Would create with columns: equipment_id, maintenance_class, scheduled_date, status' as description;

-- 7. Show what needs to be done
SELECT 'Next Steps' as test_step;

SELECT 
  '1. Run add_pm_columns_migration.sql to add PM columns to equipment table' as step,
  'Required' as priority
UNION ALL
SELECT 
  '2. Run create_pm_tables_migration.sql to create PM configuration and logs tables' as step,
  'Required' as priority
UNION ALL
SELECT 
  '3. Run run_automatic_pm_scheduling.sql to test the complete PM system' as step,
  'Required' as priority; 