-- Check PM Classification System and Cost Sources
-- This script analyzes the current PM system to understand classifications and costs

-- =====================================================
-- 1. CHECK CURRENT EQUIPMENT PM CLASSIFICATIONS
-- =====================================================

-- Check what PM classes are currently assigned to equipment
SELECT 
    'Equipment PM Classifications' as section,
    pm_class,
    COUNT(*) as equipment_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM equipment 
WHERE is_pm = true 
GROUP BY pm_class
ORDER BY equipment_count DESC;

-- Show sample equipment with their PM classifications
SELECT 
    'Sample Equipment PM Data' as section,
    name,
    type,
    pm_class,
    pm_frequency_days,
    pm_frequency_hours,
    pm_cost_estimate,
    last_pm_date,
    next_pm_date,
    CASE 
        WHEN pm_class IS NULL THEN 'No PM Class'
        WHEN pm_class = 'Class A' THEN 'Basic Service'
        WHEN pm_class = 'Class B' THEN 'Standard Service'
        WHEN pm_class = 'Class C' THEN 'Major Service'
        ELSE 'Unknown Class'
    END as pm_class_description
FROM equipment 
WHERE is_pm = true 
ORDER BY name
LIMIT 10;

-- =====================================================
-- 2. CHECK PM CONFIGURATION TABLE
-- =====================================================

-- Check what PM configurations exist
SELECT 
    'PM Configurations Available' as section,
    equipment_type,
    class_a_hours,
    class_b_hours,
    class_c_hours,
    class_a_threshold_hours,
    class_b_threshold_hours,
    class_c_threshold_hours,
    interval_days,
    is_active
FROM preventive_maintenance_configs
ORDER BY equipment_type;

-- Check if there are cost estimates in PM configs
SELECT 
    'PM Config Cost Fields' as section,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'preventive_maintenance_configs'
ORDER BY ordinal_position;

-- =====================================================
-- 3. CHECK PM TYPES TABLE (if exists)
-- =====================================================

-- Check if preventive_maintenance_types table exists
SELECT 
    'PM Types Table Check' as section,
    table_name,
    CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'NOT FOUND' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'preventive_maintenance_types';

-- If PM types table exists, check its structure
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'preventive_maintenance_types') THEN
        RAISE NOTICE 'PM Types table exists - checking structure';
    ELSE
        RAISE NOTICE 'PM Types table does not exist';
    END IF;
END $$;

-- =====================================================
-- 4. ANALYZE COST SOURCES
-- =====================================================

-- Check where cost estimates are coming from
SELECT 
    'Cost Source Analysis' as section,
    'Equipment Table' as source,
    COUNT(CASE WHEN pm_cost_estimate IS NOT NULL THEN 1 END) as has_cost_estimate,
    COUNT(CASE WHEN pm_cost_estimate IS NULL THEN 1 END) as missing_cost_estimate,
    ROUND(AVG(pm_cost_estimate), 2) as avg_cost_estimate
FROM equipment 
WHERE is_pm = true;

-- Check cost estimates by PM class
SELECT 
    'Cost Estimates by PM Class' as section,
    pm_class,
    COUNT(*) as equipment_count,
    ROUND(AVG(pm_cost_estimate), 2) as avg_cost,
    MIN(pm_cost_estimate) as min_cost,
    MAX(pm_cost_estimate) as max_cost,
    CASE 
        WHEN pm_class = 'Class A' THEN 'Basic Service (Oil, Filters, Inspections)'
        WHEN pm_class = 'Class B' THEN 'Standard Service (Fluids, Belts, Minor Repairs)'
        WHEN pm_class = 'Class C' THEN 'Major Service (Overhaul, Major Components)'
        ELSE 'Unknown Service Level'
    END as service_description
FROM equipment 
WHERE is_pm = true AND pm_cost_estimate IS NOT NULL
GROUP BY pm_class
ORDER BY pm_class;

-- =====================================================
-- 5. IDENTIFY MISSING DATA
-- =====================================================

-- Equipment missing PM classifications
SELECT 
    'Missing PM Classifications' as section,
    COUNT(*) as equipment_count
FROM equipment 
WHERE is_pm = true AND (pm_class IS NULL OR pm_class = '');

-- Equipment missing cost estimates
SELECT 
    'Missing Cost Estimates' as section,
    COUNT(*) as equipment_count
FROM equipment 
WHERE is_pm = true AND pm_cost_estimate IS NULL;

-- Equipment missing frequency settings
SELECT 
    'Missing Frequency Settings' as section,
    COUNT(*) as equipment_count
FROM equipment 
WHERE is_pm = true AND (pm_frequency_days IS NULL AND pm_frequency_hours IS NULL);

-- =====================================================
-- 6. RECOMMENDATIONS
-- =====================================================

-- Summary of issues found
SELECT 
    'PM System Issues Summary' as section,
    'Missing PM Classifications' as issue,
    COUNT(*) as count
FROM equipment 
WHERE is_pm = true AND (pm_class IS NULL OR pm_class = '')
UNION ALL
SELECT 
    'PM System Issues Summary' as section,
    'Missing Cost Estimates' as issue,
    COUNT(*) as count
FROM equipment 
WHERE is_pm = true AND pm_cost_estimate IS NULL
UNION ALL
SELECT 
    'PM System Issues Summary' as section,
    'Missing Frequency Settings' as issue,
    COUNT(*) as count
FROM equipment 
WHERE is_pm = true AND (pm_frequency_days IS NULL AND pm_frequency_hours IS NULL);

-- =====================================================
-- 7. SUGGESTED FIXES
-- =====================================================

-- Show what needs to be fixed
SELECT 
    'Suggested Actions' as section,
    '1. Add PM classifications to equipment missing them' as action,
    '2. Set cost estimates based on PM class or equipment type' as action2,
    '3. Configure frequency settings for all PM equipment' as action3,
    '4. Create PM type definitions with standard costs' as action4; 