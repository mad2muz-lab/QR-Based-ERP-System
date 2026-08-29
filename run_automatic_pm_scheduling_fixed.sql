-- Automatic PM Schedule Generation Script (Fixed for Your Database)
-- This script works with your existing equipment table structure

-- 1. Check current PM status
SELECT 'Current PM Status' as step;

SELECT 
  COUNT(*) as total_equipment,
  COUNT(CASE WHEN is_pm = true THEN 1 END) as enrolled_in_pm,
  COUNT(CASE WHEN is_pm = false OR is_pm IS NULL THEN 1 END) as not_enrolled
FROM equipment;

-- 2. Check if PM configuration table exists
SELECT 'PM Configuration Table Check' as step;

SELECT 
  table_name,
  CASE WHEN table_name = 'preventive_maintenance_configs' 
       THEN 'PM Config Table Found' 
       ELSE 'PM Config Table Missing - Need to create it' 
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'preventive_maintenance_configs';

-- 3. Check if PM logs table exists
SELECT 'PM Logs Table Check' as step;

SELECT 
  table_name,
  CASE WHEN table_name = 'preventive_maintenance_logs' 
       THEN 'PM Logs Table Found' 
       ELSE 'PM Logs Table Missing - Need to create it' 
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'preventive_maintenance_logs';

-- 4. Show enrolled equipment with their PM settings
SELECT 'Enrolled Equipment Details' as step;

SELECT 
  id,
  name,
  type,
  is_pm,
  pm_class,
  pm_frequency_days,
  pm_frequency_hours,
  usage_duration,
  standby_duration,
  maintenance_duration
FROM equipment
WHERE is_pm = true
ORDER BY name;

-- 5. Calculate equipment usage from logs (if PM logs table doesn't exist)
SELECT 'Equipment Usage from Equipment Logs' as step;

SELECT 
  e.id,
  e.name,
  e.type,
  e.is_pm,
  e.usage_duration as stored_usage,
  COUNT(el.id) as total_logs,
  COUNT(CASE WHEN el.action = 'start-use' THEN 1 END) as start_actions,
  COUNT(CASE WHEN el.action = 'stop-use' THEN 1 END) as stop_actions,
  MAX(el.created_at) as last_activity
FROM equipment e
LEFT JOIN equipment_logs el ON e.id = el.equipment_id
WHERE e.is_pm = true
GROUP BY e.id, e.name, e.type, e.is_pm, e.usage_duration
ORDER BY e.usage_duration DESC;

-- 6. Check equipment that needs PM based on usage duration
SELECT 'Equipment Needing PM Based on Usage' as step;

SELECT 
  id,
  name,
  type,
  pm_class,
  usage_duration,
  pm_frequency_hours,
  CASE 
    WHEN usage_duration >= pm_frequency_hours THEN 'PM Overdue'
    WHEN usage_duration >= (pm_frequency_hours * 0.8) THEN 'PM Due Soon'
    ELSE 'PM Not Due'
  END as pm_status,
  CASE 
    WHEN usage_duration >= pm_frequency_hours THEN usage_duration - pm_frequency_hours
    ELSE pm_frequency_hours - usage_duration
  END as hours_difference
FROM equipment
WHERE is_pm = true 
  AND pm_frequency_hours IS NOT NULL
  AND usage_duration IS NOT NULL
ORDER BY usage_duration DESC;

-- 7. Show equipment by PM class
SELECT 'Equipment by PM Class' as step;

SELECT 
  pm_class,
  COUNT(*) as equipment_count,
  AVG(usage_duration) as avg_usage_duration,
  AVG(pm_frequency_hours) as avg_frequency_hours
FROM equipment
WHERE is_pm = true AND pm_class IS NOT NULL
GROUP BY pm_class
ORDER BY pm_class;

-- 8. Check equipment logs for recent activity
SELECT 'Recent Equipment Activity' as step;

SELECT 
  e.id,
  e.name,
  e.type,
  COUNT(el.id) as recent_logs,
  MAX(el.created_at) as last_activity
FROM equipment e
LEFT JOIN equipment_logs el ON e.id = el.equipment_id 
  AND el.created_at >= NOW() - INTERVAL '7 days'
WHERE e.is_pm = true
GROUP BY e.id, e.name, e.type
ORDER BY last_activity DESC NULLS LAST;

-- 9. Summary statistics
SELECT 'PM System Summary' as step;

SELECT 
  'Total Equipment' as metric,
  COUNT(*) as value
FROM equipment
UNION ALL
SELECT 
  'Enrolled in PM' as metric,
  COUNT(CASE WHEN is_pm = true THEN 1 END) as value
FROM equipment
UNION ALL
SELECT 
  'PM Overdue' as metric,
  COUNT(CASE WHEN is_pm = true AND usage_duration >= pm_frequency_hours THEN 1 END) as value
FROM equipment
UNION ALL
SELECT 
  'PM Due Soon' as metric,
  COUNT(CASE WHEN is_pm = true AND usage_duration >= (pm_frequency_hours * 0.8) AND usage_duration < pm_frequency_hours THEN 1 END) as value
FROM equipment;

-- 10. Next steps recommendation
SELECT 'Next Steps' as step;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'preventive_maintenance_configs') 
    THEN 'PM Config Table: ✅ Exists'
    ELSE 'PM Config Table: ❌ Missing - Run create_pm_tables_migration.sql'
  END as status
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'preventive_maintenance_logs') 
    THEN 'PM Logs Table: ✅ Exists'
    ELSE 'PM Logs Table: ❌ Missing - Run create_pm_tables_migration.sql'
  END as status
UNION ALL
SELECT 
  CASE 
    WHEN COUNT(CASE WHEN is_pm = true THEN 1 END) > 0 
    THEN 'Enrolled Equipment: ✅ ' || COUNT(CASE WHEN is_pm = true THEN 1 END) || ' equipment enrolled'
    ELSE 'Enrolled Equipment: ❌ No equipment enrolled - Use PM enrollment form'
  END as status
FROM equipment; 