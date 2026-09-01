-- Check PM History Data - Diagnostic Script
-- This script will help identify why only Class A items are showing in PM History

-- 1. Check all PM logs with their maintenance classes
SELECT 
  'PM Logs by Class' as section,
  maintenance_class,
  COUNT(*) as total_records,
  COUNT(CASE WHEN checklist_completed = true THEN 1 END) as completed_records,
  COUNT(CASE WHEN checklist_completed = false THEN 1 END) as pending_records
FROM preventive_maintenance_logs 
GROUP BY maintenance_class
ORDER BY maintenance_class;

-- 2. Check equipment with their PM classes
SELECT 
  'Equipment PM Classes' as section,
  pm_class,
  COUNT(*) as equipment_count,
  COUNT(CASE WHEN is_pm = true THEN 1 END) as enrolled_count
FROM equipment 
WHERE pm_class IS NOT NULL
GROUP BY pm_class
ORDER BY pm_class;

-- 3. Check completed PM logs with equipment details
SELECT 
  'Completed PM Logs' as section,
  pml.maintenance_class,
  e.name as equipment_name,
  e.type as equipment_type,
  pml.completed_date,
  pml.quality_score,
  pml.safety_checks_passed,
  pml.technician_id
FROM preventive_maintenance_logs pml
JOIN equipment e ON pml.equipment_id = e.id
WHERE pml.checklist_completed = true
ORDER BY pml.completed_date DESC
LIMIT 20;

-- 4. Check if there are any Class B or C equipment enrolled
SELECT 
  'Class B & C Equipment' as section,
  name,
  type,
  pm_class,
  is_pm,
  pm_frequency_days,
  last_pm_date,
  next_pm_date
FROM equipment 
WHERE pm_class IN ('Class B', 'Class C')
ORDER BY pm_class, name;

-- 5. Check recent PM logs for Class B and C
SELECT 
  'Recent Class B & C PM Logs' as section,
  maintenance_class,
  equipment_id,
  scheduled_date,
  completed_date,
  checklist_completed,
  status
FROM preventive_maintenance_logs 
WHERE maintenance_class IN ('Class B', 'Class C')
ORDER BY created_at DESC
LIMIT 10;

-- 6. Summary of what should be visible
SELECT 
  'Summary' as section,
  'Total Equipment' as metric,
  COUNT(*) as value
FROM equipment 
WHERE is_pm = true
UNION ALL
SELECT 
  'Summary' as section,
  'Class A Equipment' as metric,
  COUNT(*) as value
FROM equipment 
WHERE is_pm = true AND pm_class = 'Class A'
UNION ALL
SELECT 
  'Summary' as section,
  'Class B Equipment' as metric,
  COUNT(*) as value
FROM equipment 
WHERE is_pm = true AND pm_class = 'Class B'
UNION ALL
SELECT 
  'Summary' as section,
  'Class C Equipment' as metric,
  COUNT(*) as value
FROM equipment 
WHERE is_pm = true AND pm_class = 'Class C'
UNION ALL
SELECT 
  'Summary' as section,
  'Completed PM Logs' as metric,
  COUNT(*) as value
FROM preventive_maintenance_logs 
WHERE checklist_completed = true; 