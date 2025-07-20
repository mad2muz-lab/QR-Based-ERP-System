-- Check existing preventive maintenance configurations
-- This query will show you which equipment types already have configurations

SELECT 
  equipment_type,
  class_a_hours,
  class_b_hours,
  class_c_hours,
  class_a_threshold_hours,
  class_b_threshold_hours,
  class_c_threshold_hours,
  is_active,
  created_at,
  updated_at
FROM preventive_maintenance_configs
ORDER BY equipment_type;

-- Count total configurations
SELECT 
  COUNT(*) as total_configurations,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_configurations,
  COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_configurations
FROM preventive_maintenance_configs;

-- Show equipment types that DON'T have configurations yet
-- (This requires you to have an equipment table with equipment types)
SELECT DISTINCT e.type as equipment_type
FROM equipment e
LEFT JOIN preventive_maintenance_configs pmc ON e.type = pmc.equipment_type
WHERE pmc.equipment_type IS NULL
ORDER BY e.type; 