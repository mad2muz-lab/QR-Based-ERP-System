-- Create Due PM Task for Testing
-- This script will update the asphalt paver to have a PM due yesterday

-- =====================================================
-- 1. UPDATE EQUIPMENT WITH PAST DUE DATE
-- =====================================================

-- First, let's see the current equipment data
SELECT 
    'Current Equipment Data' as info,
    id,
    "Equipment Name",
    "Equipment type",
    is_pm,
    pm_class,
    last_pm_date,
    next_pm_date
FROM equipment 
WHERE "Equipment Name" LIKE '%asphalt%' OR "Equipment Name" LIKE '%paver%'
LIMIT 5;

-- Update the equipment to have a past due PM date
UPDATE equipment 
SET 
    is_pm = true,
    pm_class = 'Class C',
    last_pm_date = '2024-12-15', -- Last PM was 2 months ago
    next_pm_date = '2025-01-14'  -- Next PM was due yesterday
WHERE "Equipment Name" LIKE '%asphalt%' OR "Equipment Name" LIKE '%paver%';

-- =====================================================
-- 2. VERIFY THE UPDATE
-- =====================================================

-- Check the updated equipment data
SELECT 
    'Updated Equipment Data' as info,
    id,
    "Equipment Name",
    "Equipment type",
    is_pm,
    pm_class,
    last_pm_date,
    next_pm_date,
    CASE 
        WHEN next_pm_date < CURRENT_DATE THEN 'OVERDUE'
        WHEN next_pm_date = CURRENT_DATE THEN 'DUE TODAY'
        ELSE 'FUTURE'
    END as pm_status
FROM equipment 
WHERE "Equipment Name" LIKE '%asphalt%' OR "Equipment Name" LIKE '%paver%';

-- =====================================================
-- 3. TEST PM CONFIGURATION LINKING
-- =====================================================

-- Check if PM configuration exists for this equipment type
SELECT 
    'PM Configuration Check' as info,
    e."Equipment Name",
    e."Equipment type",
    e.pm_class,
    pmc.equipment_type as pm_config_type,
    CASE
        WHEN e."Equipment type" = pmc.equipment_type THEN '✅ Linked'
        ELSE '❌ Not Linked'
    END as linking_status
FROM equipment e
LEFT JOIN preventive_maintenance_configs pmc ON e."Equipment type" = pmc.equipment_type
WHERE e."Equipment Name" LIKE '%asphalt%' OR e."Equipment Name" LIKE '%paver%';

-- =====================================================
-- 4. SUCCESS MESSAGE
-- =====================================================

SELECT '✅ Equipment updated with past due PM date!' as status;
SELECT '   - PM Class: Class C' as details_1;
SELECT '   - Last PM: 2024-12-15' as details_2;
SELECT '   - Next PM: 2025-01-14 (OVERDUE)' as details_3;
SELECT '   - Ready for testing PM workflow' as next_step;
