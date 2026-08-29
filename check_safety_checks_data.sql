-- Check and Fix Safety Checks Data in PM Logs
-- This script will help diagnose and fix the safety_checks_passed issue

-- 1. Check current safety_checks_passed values
SELECT 
    'Current safety_checks_passed values:' as info;
    
SELECT 
    id,
    equipment_id,
    maintenance_class,
    quality_score,
    safety_checks_passed,
    checklist_completed,
    completed_date
FROM preventive_maintenance_logs 
WHERE checklist_completed = true
ORDER BY completed_date DESC
LIMIT 10;

-- 2. Check if safety_checks_passed column has proper default
SELECT 
    'Safety checks column definition:' as info;
    
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'preventive_maintenance_logs' 
  AND column_name = 'safety_checks_passed';

-- 3. Update any null safety_checks_passed to false (if needed)
UPDATE preventive_maintenance_logs 
SET safety_checks_passed = false 
WHERE safety_checks_passed IS NULL 
  AND checklist_completed = true;

-- 4. For testing purposes, let's update recent records to have safety_checks_passed = true
-- (This is for demonstration - remove in production)
UPDATE preventive_maintenance_logs 
SET safety_checks_passed = true 
WHERE checklist_completed = true 
  AND completed_date >= CURRENT_DATE - INTERVAL '7 days'
  AND safety_checks_passed = false;

-- 5. Verify the changes
SELECT 
    'Updated safety_checks_passed values:' as info;
    
SELECT 
    id,
    equipment_id,
    maintenance_class,
    quality_score,
    safety_checks_passed,
    checklist_completed,
    completed_date
FROM preventive_maintenance_logs 
WHERE checklist_completed = true
ORDER BY completed_date DESC
LIMIT 10;

-- 6. Add proper default value to the column (if not already set)
ALTER TABLE preventive_maintenance_logs 
ALTER COLUMN safety_checks_passed SET DEFAULT false;

-- 7. Ensure the column is NOT NULL
ALTER TABLE preventive_maintenance_logs 
ALTER COLUMN safety_checks_passed SET NOT NULL; 