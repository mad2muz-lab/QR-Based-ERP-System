-- Enroll Existing Equipment in PM
-- This script will enroll your existing equipment so they show up in the UI

-- =====================================================
-- 1. ENROLL ALL EXISTING EQUIPMENT IN PM
-- =====================================================

-- Enroll all equipment in PM with Class A (most common)
UPDATE equipment 
SET 
    is_pm = true,
    pm_class = 'Class A',
    pm_frequency_days = 90,
    pm_frequency_hours = 500,
    pm_status = 'enrolled'
WHERE is_pm = false 
   OR is_pm IS NULL;

-- =====================================================
-- 2. VERIFY THE ENROLLMENT
-- =====================================================

SELECT 
    'Equipment Enrollment Status' as section,
    COUNT(*) as total_equipment,
    COUNT(CASE WHEN is_pm = true THEN 1 END) as enrolled_in_pm,
    COUNT(CASE WHEN pm_class IS NOT NULL THEN 1 END) as has_pm_class,
    COUNT(CASE WHEN is_pm = true AND pm_class IS NOT NULL THEN 1 END) as enrolled_with_class
FROM equipment;

-- =====================================================
-- 3. SHOW ENROLLED EQUIPMENT
-- =====================================================

SELECT 
    'Enrolled Equipment' as section,
    id,
    name,
    type,
    is_pm,
    pm_class,
    pm_frequency_days,
    pm_frequency_hours,
    pm_status
FROM equipment 
WHERE is_pm = true 
  AND pm_class IS NOT NULL
ORDER BY name;

-- =====================================================
-- 4. TEST THE UI QUERY
-- =====================================================

-- This is exactly what the UI is querying for:
SELECT 
    'UI Query Test (should now return results)' as section,
    id,
    name,
    type,
    is_pm,
    pm_class
FROM equipment 
WHERE is_pm = true 
  AND pm_class IS NOT NULL
ORDER BY name; 