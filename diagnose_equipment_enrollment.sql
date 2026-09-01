-- Diagnose Equipment Enrollment Issue
-- This script will help identify why the equipment enrollment page shows 0 enrolled equipment

-- =====================================================
-- 1. CHECK TOTAL EQUIPMENT COUNT
-- =====================================================

SELECT 
    'Equipment Count Summary' as section,
    COUNT(*) as total_equipment,
    COUNT(CASE WHEN is_pm = true THEN 1 END) as enrolled_in_pm,
    COUNT(CASE WHEN is_pm = false OR is_pm IS NULL THEN 1 END) as not_enrolled,
    COUNT(CASE WHEN pm_class IS NOT NULL THEN 1 END) as has_pm_class,
    COUNT(CASE WHEN is_pm = true AND pm_class IS NOT NULL THEN 1 END) as enrolled_with_class
FROM equipment;

-- =====================================================
-- 2. CHECK EQUIPMENT PM STATUS DETAILS
-- =====================================================

SELECT 
    'Equipment PM Status Details' as section,
    name,
    type,
    is_pm,
    pm_class,
    pm_frequency_days,
    pm_frequency_hours,
    CASE 
        WHEN is_pm = true AND pm_class IS NOT NULL THEN '✅ Properly Enrolled'
        WHEN is_pm = true AND pm_class IS NULL THEN '⚠️ Enrolled but NO PM Class'
        WHEN is_pm = false AND pm_class IS NOT NULL THEN '⚠️ Has PM Class but NOT Enrolled'
        WHEN is_pm = false AND pm_class IS NULL THEN '❌ Not Enrolled'
        WHEN is_pm IS NULL AND pm_class IS NULL THEN '❌ No PM Data'
        ELSE '❓ Unknown Status'
    END as enrollment_status
FROM equipment 
ORDER BY 
    CASE 
        WHEN is_pm = true AND pm_class IS NOT NULL THEN 1
        WHEN is_pm = true AND pm_class IS NULL THEN 2
        WHEN is_pm = false AND pm_class IS NOT NULL THEN 3
        ELSE 4
    END,
    name;

-- =====================================================
-- 3. CHECK PM CONFIGURATION TABLE
-- =====================================================

SELECT 
    'PM Configuration Table Status' as section,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'preventive_maintenance_configs') 
        THEN '✅ Table exists' 
        ELSE '❌ Table missing' 
    END as table_status;

-- If table exists, show sample data
SELECT 
    'PM Configuration Data' as section,
    equipment_type,
    maintenance_class,
    class_a_hours,
    class_b_hours,
    class_c_hours,
    interval_days,
    is_active
FROM preventive_maintenance_configs 
LIMIT 5;

-- =====================================================
-- 4. IDENTIFY EQUIPMENT THAT SHOULD BE ENROLLED
-- =====================================================

SELECT 
    'Equipment Ready for Enrollment' as section,
    name,
    type,
    'UPDATE equipment SET is_pm = true, pm_class = ''Class A'' WHERE name = ''' || name || '''' as enrollment_command
FROM equipment 
WHERE (is_pm = false OR is_pm IS NULL)
  AND (pm_class IS NULL OR pm_class = '')
ORDER BY name;

-- =====================================================
-- 5. FIX COMMON ENROLLMENT ISSUES
-- =====================================================

-- Fix equipment that have PM class but aren't enrolled
UPDATE equipment 
SET is_pm = true
WHERE pm_class IS NOT NULL 
  AND pm_class != ''
  AND (is_pm = false OR is_pm IS NULL);

-- Set default PM class for equipment that are enrolled but don't have a class
UPDATE equipment 
SET pm_class = 'Class A'
WHERE is_pm = true 
  AND (pm_class IS NULL OR pm_class = '');

-- Set frequency days for equipment that don't have them
UPDATE equipment 
SET pm_frequency_days = 
    CASE 
        WHEN pm_class = 'Class A' THEN 90
        WHEN pm_class = 'Class B' THEN 365
        WHEN pm_class = 'Class C' THEN 730
        ELSE 30
    END
WHERE is_pm = true 
  AND (pm_frequency_days IS NULL OR pm_frequency_days = 0);

-- =====================================================
-- 6. VERIFY FIXES
-- =====================================================

SELECT 
    'After Fixes - Equipment Count Summary' as section,
    COUNT(*) as total_equipment,
    COUNT(CASE WHEN is_pm = true THEN 1 END) as enrolled_in_pm,
    COUNT(CASE WHEN is_pm = false OR is_pm IS NULL THEN 1 END) as not_enrolled,
    COUNT(CASE WHEN pm_class IS NOT NULL THEN 1 END) as has_pm_class,
    COUNT(CASE WHEN is_pm = true AND pm_class IS NOT NULL THEN 1 END) as enrolled_with_class
FROM equipment;

-- Show enrolled equipment after fixes
SELECT 
    'Enrolled Equipment After Fixes' as section,
    name,
    type,
    pm_class,
    pm_frequency_days,
    pm_frequency_hours
FROM equipment 
WHERE is_pm = true 
  AND pm_class IS NOT NULL
ORDER BY name; 