-- Check PM Enrollment Status
-- This script identifies why Class B and Class C equipment aren't showing up

-- =====================================================
-- 1. CHECK ALL EQUIPMENT PM STATUS
-- =====================================================

SELECT 
    'All Equipment PM Status' as section,
    name,
    type,
    is_pm,
    pm_class,
    pm_frequency_days,
    CASE 
        WHEN is_pm = true AND pm_class IS NOT NULL THEN 'Enrolled with PM Class'
        WHEN is_pm = true AND pm_class IS NULL THEN 'Enrolled but NO PM Class'
        WHEN is_pm = false THEN 'Not Enrolled'
        WHEN is_pm IS NULL THEN 'PM Status Unknown'
        ELSE 'Other'
    END as enrollment_status
FROM equipment 
ORDER BY is_pm DESC, pm_class, name;

-- =====================================================
-- 2. CHECK EQUIPMENT THAT SHOULD BE ENROLLED
-- =====================================================

SELECT 
    'Equipment with PM Class but Not Enrolled' as section,
    name,
    type,
    is_pm,
    pm_class,
    pm_frequency_days
FROM equipment 
WHERE pm_class IS NOT NULL 
  AND (is_pm = false OR is_pm IS NULL)
ORDER BY pm_class, name;

-- =====================================================
-- 3. CHECK ENROLLED EQUIPMENT WITHOUT PM CLASS
-- =====================================================

SELECT 
    'Enrolled Equipment without PM Class' as section,
    name,
    type,
    is_pm,
    pm_class,
    pm_frequency_days
FROM equipment 
WHERE is_pm = true 
  AND (pm_class IS NULL OR pm_class = '')
ORDER BY name;

-- =====================================================
-- 4. SUMMARY BY PM CLASS
-- =====================================================

SELECT 
    'PM Class Summary' as section,
    pm_class,
    COUNT(*) as total_equipment,
    COUNT(CASE WHEN is_pm = true THEN 1 END) as enrolled_count,
    COUNT(CASE WHEN is_pm = false OR is_pm IS NULL THEN 1 END) as not_enrolled_count
FROM equipment 
GROUP BY pm_class
ORDER BY pm_class;

-- =====================================================
-- 5. FIX MISSING ENROLLMENTS
-- =====================================================

-- Show what needs to be fixed
SELECT 
    'Equipment to Enroll in PM' as section,
    name,
    type,
    pm_class,
    pm_frequency_days,
    'UPDATE equipment SET is_pm = true WHERE name = ''' || name || '''' as fix_command
FROM equipment 
WHERE pm_class IS NOT NULL 
  AND pm_class != ''
  AND (is_pm = false OR is_pm IS NULL)
ORDER BY pm_class, name; 