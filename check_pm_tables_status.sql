-- Check PM Tables Status
-- Based on your equipment table structure, let's check what PM tables exist

-- 1. Check if PM configuration table exists
SELECT 'Checking PM Configuration Table' as check_step;

SELECT 
  table_name,
  CASE WHEN table_name = 'preventive_maintenance_configs' 
       THEN 'PM Config Table Found' 
       ELSE 'PM Config Table Missing' 
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'preventive_maintenance_configs';

-- 2. Check if PM logs table exists
SELECT 'Checking PM Logs Table' as check_step;

SELECT 
  table_name,
  CASE WHEN table_name = 'preventive_maintenance_logs' 
       THEN 'PM Logs Table Found' 
       ELSE 'PM Logs Table Missing' 
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'preventive_maintenance_logs';

-- 3. Check equipment PM status
SELECT 'Equipment PM Status' as check_step;

SELECT 
  COUNT(*) as total_equipment,
  COUNT(CASE WHEN is_pm = true THEN 1 END) as enrolled_in_pm,
  COUNT(CASE WHEN is_pm = false OR is_pm IS NULL THEN 1 END) as not_enrolled,
  COUNT(CASE WHEN pm_class IS NOT NULL THEN 1 END) as has_pm_class
FROM equipment;

-- 4. Show sample enrolled equipment
SELECT 'Sample Enrolled Equipment' as check_step;

SELECT 
  id,
  name,
  type,
  is_pm,
  pm_class,
  pm_frequency_days,
  pm_frequency_hours,
  usage_duration,
  standby_duration
FROM equipment
WHERE is_pm = true
LIMIT 5;

-- 5. Check equipment usage from logs
SELECT 'Equipment Usage from Logs' as check_step;

SELECT 
  e.id,
  e.name,
  e.type,
  e.is_pm,
  e.usage_duration,
  COUNT(el.id) as total_logs,
  COUNT(CASE WHEN el.action = 'start-use' THEN 1 END) as start_actions,
  COUNT(CASE WHEN el.action = 'stop-use' THEN 1 END) as stop_actions
FROM equipment e
LEFT JOIN equipment_logs el ON e.id = el.equipment_id
WHERE e.is_pm = true
GROUP BY e.id, e.name, e.type, e.is_pm, e.usage_duration
ORDER BY e.usage_duration DESC
LIMIT 10; 