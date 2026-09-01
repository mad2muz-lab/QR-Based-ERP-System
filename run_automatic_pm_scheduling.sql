-- Automatic PM Schedule Generation Script
-- This script helps test and run the automatic preventive maintenance scheduling

-- 1. Check equipment table structure first
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'equipment'
ORDER BY ordinal_position;

-- 2. Check if is_pm column exists, if not, add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'equipment' AND column_name = 'is_pm'
    ) THEN
        ALTER TABLE equipment ADD COLUMN is_pm BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_pm column to equipment table';
    ELSE
        RAISE NOTICE 'is_pm column already exists in equipment table';
    END IF;
END $$;

-- 3. Check enrolled equipment (after ensuring is_pm column exists)
SELECT 
  id,
  name,
  type,
  status,
  is_pm
FROM equipment 
WHERE is_pm = true
ORDER BY name;

-- 4. Check PM configurations for equipment types
SELECT 
  equipment_type,
  maintenance_class,
  class_a_hours,
  class_b_hours,
  class_c_hours,
  class_a_threshold_hours,
  class_b_threshold_hours,
  class_c_threshold_hours,
  interval_days,
  is_active
FROM preventive_maintenance_configs
ORDER BY equipment_type, maintenance_class;

-- 5. Check equipment usage from logs (sample calculation)
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
WHERE e.is_pm = true
GROUP BY e.id, e.name, e.type
ORDER BY e.name;

-- 6. Check existing PM logs
SELECT 
  id,
  equipment_id,
  maintenance_class,
  maintenance_type,
  scheduled_date,
  performed_date,
  status,
  created_at
FROM preventive_maintenance_logs
ORDER BY scheduled_date DESC
LIMIT 20;

-- 7. Check overdue PM logs
SELECT 
  id,
  equipment_id,
  maintenance_class,
  scheduled_date,
  status,
  CASE 
    WHEN scheduled_date < CURRENT_DATE THEN 
      EXTRACT(DAY FROM CURRENT_DATE - scheduled_date::date)
    ELSE 0 
  END as days_overdue
FROM preventive_maintenance_logs
WHERE status IN ('scheduled', 'in_progress')
  AND scheduled_date < CURRENT_DATE
ORDER BY days_overdue DESC;

-- 8. Insert sample equipment usage data (if needed for testing)
-- Uncomment and modify as needed:

/*
INSERT INTO equipment_logs (id, equipment_id, action, created_at, updated_at)
VALUES 
  ('log-' || gen_random_uuid()::text, 'your-equipment-id', 'start-use', NOW() - INTERVAL '2 hours', NOW()),
  ('log-' || gen_random_uuid()::text, 'your-equipment-id', 'stop-use', NOW() - INTERVAL '1 hour', NOW());
*/

-- 9. Check PM statistics
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM preventive_maintenance_logs
GROUP BY status
ORDER BY count DESC;

-- 10. Find equipment that needs PM based on usage
-- This is a simplified version of what the automatic scheduler does
WITH equipment_usage AS (
  SELECT 
    e.id,
    e.name,
    e.type,
    e.is_pm,
    COUNT(CASE WHEN el.action = 'start-use' THEN 1 END) as usage_sessions,
    MAX(el.created_at) as last_usage
  FROM equipment e
  LEFT JOIN equipment_logs el ON e.id = el.equipment_id
  WHERE e.is_pm = true
  GROUP BY e.id, e.name, e.type, e.is_pm
),
pm_needs AS (
  SELECT 
    eu.*,
    pmc.maintenance_class,
    pmc.class_a_threshold_hours,
    pmc.class_b_threshold_hours,
    pmc.class_c_threshold_hours,
    pmc.interval_days,
    CASE 
      WHEN eu.usage_sessions >= COALESCE(pmc.class_a_threshold_hours, 0) THEN 'Class A'
      WHEN eu.usage_sessions >= COALESCE(pmc.class_b_threshold_hours, 0) THEN 'Class B'
      WHEN eu.usage_sessions >= COALESCE(pmc.class_c_threshold_hours, 0) THEN 'Class C'
      ELSE 'No PM needed'
    END as recommended_pm_class
  FROM equipment_usage eu
  LEFT JOIN preventive_maintenance_configs pmc ON eu.type = pmc.equipment_type
)
SELECT 
  id,
  name,
  type,
  usage_sessions,
  maintenance_class,
  recommended_pm_class,
  CASE 
    WHEN recommended_pm_class != 'No PM needed' THEN 'PM Required'
    ELSE 'No PM needed'
  END as pm_status
FROM pm_needs
ORDER BY usage_sessions DESC;

-- 11. Quick diagnostic queries
-- Check if required tables exist
SELECT 
  table_name,
  CASE WHEN table_name IN ('equipment', 'equipment_logs', 'preventive_maintenance_configs', 'preventive_maintenance_logs') 
       THEN 'Required' 
       ELSE 'Optional' 
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('equipment', 'equipment_logs', 'preventive_maintenance_configs', 'preventive_maintenance_logs');

-- Check equipment enrollment status
SELECT 
  COUNT(*) as total_equipment,
  COUNT(CASE WHEN is_pm = true THEN 1 END) as enrolled_in_pm,
  COUNT(CASE WHEN is_pm = false OR is_pm IS NULL THEN 1 END) as not_enrolled
FROM equipment;

-- Check equipment logs
SELECT 
  COUNT(*) as total_logs,
  COUNT(CASE WHEN action = 'start-use' THEN 1 END) as start_actions,
  COUNT(CASE WHEN action = 'stop-use' THEN 1 END) as stop_actions
FROM equipment_logs;

-- 12. Clean up test data (if needed)
-- Uncomment to remove test PM logs:
/*
DELETE FROM preventive_maintenance_logs 
WHERE created_at > NOW() - INTERVAL '1 hour'
  AND notes LIKE '%test%';
*/ 