-- Check Actual Equipment Data
-- This script will show the current state of equipment records

-- =====================================================
-- 1. CHECK ALL EQUIPMENT RECORDS
-- =====================================================

SELECT 
    'All Equipment Records' as section,
    id,
    name,
    type,
    is_pm,
    pm_class,
    pm_frequency_days,
    pm_frequency_hours,
    created_at,
    last_updated
FROM equipment 
ORDER BY name;

-- =====================================================
-- 2. CHECK EQUIPMENT PM STATUS
-- =====================================================

SELECT 
    'Equipment PM Status Summary' as section,
    COUNT(*) as total_equipment,
    COUNT(CASE WHEN is_pm = true THEN 1 END) as is_pm_true,
    COUNT(CASE WHEN is_pm = false THEN 1 END) as is_pm_false,
    COUNT(CASE WHEN is_pm IS NULL THEN 1 END) as is_pm_null,
    COUNT(CASE WHEN pm_class IS NOT NULL THEN 1 END) as has_pm_class,
    COUNT(CASE WHEN pm_class IS NULL THEN 1 END) as pm_class_null,
    COUNT(CASE WHEN is_pm = true AND pm_class IS NOT NULL THEN 1 END) as enrolled_with_class
FROM equipment;

-- =====================================================
-- 3. CHECK WHAT THE UI QUERY WOULD RETURN
-- =====================================================

-- This is what the UI is querying for:
SELECT 
    'UI Query Results (is_pm = true AND pm_class IS NOT NULL)' as section,
    id,
    name,
    type,
    is_pm,
    pm_class
FROM equipment 
WHERE is_pm = true 
  AND pm_class IS NOT NULL
ORDER BY name;

-- =====================================================
-- 4. CHECK EQUIPMENT THAT COULD BE ENROLLED
-- =====================================================

SELECT 
    'Equipment Available for Enrollment' as section,
    id,
    name,
    type,
    is_pm,
    pm_class,
    'UPDATE equipment SET is_pm = true, pm_class = ''Class A'' WHERE id = ''' || id || '''' as enrollment_command
FROM equipment 
WHERE is_pm = false 
   OR is_pm IS NULL
   OR pm_class IS NULL
ORDER BY name;

-- =====================================================
-- 5. CHECK DATABASE COLUMNS
-- =====================================================

SELECT 
    'Equipment Table Columns' as section,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'equipment' 
  AND (column_name LIKE '%pm%' OR column_name IN ('id', 'name', 'type'))
ORDER BY ordinal_position; 