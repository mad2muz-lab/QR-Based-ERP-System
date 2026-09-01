-- Create Sample PM History Data for Class B and C
-- This will help demonstrate the hierarchical view

-- First, let's check what Class B and C equipment we have
SELECT 
  'Available Class B & C Equipment' as info,
  name,
  type,
  pm_class,
  id
FROM equipment 
WHERE pm_class IN ('Class B', 'Class C') AND is_pm = true
ORDER BY pm_class, name;

-- Now let's create some sample PM history records for Class B equipment
INSERT INTO preventive_maintenance_logs (
  equipment_id,
  maintenance_class,
  maintenance_type,
  preventive_type_id,
  scheduled_date,
  completed_date,
  status,
  technician_id,
  checklist_completed,
  safety_checks_passed,
  quality_score,
  total_items,
  completed_items,
  required_items_completed,
  notes
)
SELECT 
  e.id as equipment_id,
  e.pm_class as maintenance_class,
  'preventive' as maintenance_type,
  CONCAT(e.name, '_', e.pm_class) as preventive_type_id,
  (CURRENT_DATE - INTERVAL '30 days')::date as scheduled_date,
  (CURRENT_DATE - INTERVAL '25 days')::date as completed_date,
  'completed' as status,
  (SELECT id FROM employees WHERE position ILIKE '%technician%' LIMIT 1) as technician_id,
  true as checklist_completed,
  true as safety_checks_passed,
  85 + (random() * 15)::int as quality_score,
  8 as total_items,
  8 as completed_items,
  6 as required_items_completed,
  'Sample Class B PM completed successfully'
FROM equipment e
WHERE e.pm_class = 'Class B' 
  AND e.is_pm = true
  AND NOT EXISTS (
    SELECT 1 FROM preventive_maintenance_logs pml 
    WHERE pml.equipment_id = e.id 
    AND pml.maintenance_class = 'Class B'
    AND pml.checklist_completed = true
  )
LIMIT 3;

-- Create sample PM history for Class C equipment
INSERT INTO preventive_maintenance_logs (
  equipment_id,
  maintenance_class,
  maintenance_type,
  preventive_type_id,
  scheduled_date,
  completed_date,
  status,
  technician_id,
  checklist_completed,
  safety_checks_passed,
  quality_score,
  total_items,
  completed_items,
  required_items_completed,
  notes
)
SELECT 
  e.id as equipment_id,
  e.pm_class as maintenance_class,
  'preventive' as maintenance_type,
  CONCAT(e.name, '_', e.pm_class) as preventive_type_id,
  (CURRENT_DATE - INTERVAL '60 days')::date as scheduled_date,
  (CURRENT_DATE - INTERVAL '55 days')::date as completed_date,
  'completed' as status,
  (SELECT id FROM employees WHERE position ILIKE '%technician%' LIMIT 1) as technician_id,
  true as checklist_completed,
  true as safety_checks_passed,
  90 + (random() * 10)::int as quality_score,
  12 as total_items,
  12 as completed_items,
  10 as required_items_completed,
  'Sample Class C PM completed successfully'
FROM equipment e
WHERE e.pm_class = 'Class C' 
  AND e.is_pm = true
  AND NOT EXISTS (
    SELECT 1 FROM preventive_maintenance_logs pml 
    WHERE pml.equipment_id = e.id 
    AND pml.maintenance_class = 'Class C'
    AND pml.checklist_completed = true
  )
LIMIT 2;

-- Create additional recent PM history for variety
INSERT INTO preventive_maintenance_logs (
  equipment_id,
  maintenance_class,
  maintenance_type,
  preventive_type_id,
  scheduled_date,
  completed_date,
  status,
  technician_id,
  checklist_completed,
  safety_checks_passed,
  quality_score,
  total_items,
  completed_items,
  required_items_completed,
  notes
)
SELECT 
  e.id as equipment_id,
  e.pm_class as maintenance_class,
  'preventive' as maintenance_type,
  CONCAT(e.name, '_', e.pm_class) as preventive_type_id,
  (CURRENT_DATE - INTERVAL '15 days')::date as scheduled_date,
  (CURRENT_DATE - INTERVAL '10 days')::date as completed_date,
  'completed' as status,
  (SELECT id FROM employees WHERE position ILIKE '%technician%' LIMIT 1) as technician_id,
  true as checklist_completed,
  CASE WHEN random() > 0.1 THEN true ELSE false END as safety_checks_passed,
  75 + (random() * 20)::int as quality_score,
  CASE WHEN e.pm_class = 'Class A' THEN 6
       WHEN e.pm_class = 'Class B' THEN 8
       ELSE 12 END as total_items,
  CASE WHEN e.pm_class = 'Class A' THEN 6
       WHEN e.pm_class = 'Class B' THEN 8
       ELSE 12 END as completed_items,
  CASE WHEN e.pm_class = 'Class A' THEN 4
       WHEN e.pm_class = 'Class B' THEN 6
       ELSE 10 END as required_items_completed,
  CONCAT('Recent ', e.pm_class, ' PM completed')
FROM equipment e
WHERE e.is_pm = true
  AND e.pm_class IN ('Class B', 'Class C')
  AND NOT EXISTS (
    SELECT 1 FROM preventive_maintenance_logs pml 
    WHERE pml.equipment_id = e.id 
    AND pml.completed_date > (CURRENT_DATE - INTERVAL '20 days')
  )
LIMIT 5;

-- Verify the new data
SELECT 
  'New PM History Created' as section,
  maintenance_class,
  COUNT(*) as new_records,
  AVG(quality_score)::int as avg_quality_score,
  COUNT(CASE WHEN safety_checks_passed THEN 1 END) as safety_passed_count
FROM preventive_maintenance_logs 
WHERE created_at > (CURRENT_TIMESTAMP - INTERVAL '5 minutes')
GROUP BY maintenance_class
ORDER BY maintenance_class;

-- Show what should now be visible in PM History
SELECT 
  'PM History Summary' as section,
  pml.maintenance_class,
  e.type as equipment_type,
  e.name as equipment_name,
  pml.completed_date,
  pml.quality_score,
  pml.safety_checks_passed
FROM preventive_maintenance_logs pml
JOIN equipment e ON pml.equipment_id = e.id
WHERE pml.checklist_completed = true
ORDER BY pml.completed_date DESC
LIMIT 15; 