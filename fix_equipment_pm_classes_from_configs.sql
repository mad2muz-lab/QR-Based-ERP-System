-- Fix Equipment PM Classes from Configurations
-- This script updates equipment to use the correct PM classes from their PM configs

-- =====================================================
-- 1. CHECK CURRENT PM CONFIGS FOR BATCHPLANT EQUIPMENT
-- =====================================================

SELECT 
    'Current PM Configs for BatchPlant Equipment' as section,
    pmc.equipment_type,
    pmc.pm_class,
    pmc.frequency_days,
    pmc.frequency_hours,
    pmc.description
FROM preventive_maintenance_configs pmc
WHERE pmc.equipment_type LIKE '%BatchPlant%'
ORDER BY pmc.equipment_type, pmc.pm_class;

-- =====================================================
-- 2. SHOW EQUIPMENT THAT SHOULD HAVE MULTIPLE PM CLASSES
-- =====================================================

SELECT 
    'Equipment with Multiple PM Configs' as section,
    e.name,
    e.type,
    e.pm_class as current_pm_class,
    e.is_pm,
    COUNT(pmc.pm_class) as configured_pm_classes,
    STRING_AGG(pmc.pm_class, ', ' ORDER BY pmc.pm_class) as available_pm_classes
FROM equipment e
LEFT JOIN preventive_maintenance_configs pmc ON e.type = pmc.equipment_type
WHERE pmc.pm_class IS NOT NULL
GROUP BY e.name, e.type, e.pm_class, e.is_pm
HAVING COUNT(pmc.pm_class) > 1
ORDER BY e.name;

-- =====================================================
-- 3. UPDATE BATCHPLANT_15 TO USE CLASS B (MOST FREQUENT)
-- =====================================================

-- Update BatchPlant_15 to use Class B (7-day frequency)
UPDATE equipment 
SET 
    pm_class = 'Class B',
    pm_frequency_days = 7,
    pm_frequency_hours = 480,
    pm_cost_estimate = 1500.00
WHERE name = 'BatchPlant_15';

-- =====================================================
-- 4. UPDATE OTHER BATCHPLANT EQUIPMENT TO USE APPROPRIATE CLASSES
-- =====================================================

-- Update BatchPlant equipment to use Class B (most frequent maintenance)
UPDATE equipment 
SET 
    pm_class = 'Class B',
    pm_frequency_days = 7,
    pm_frequency_hours = 480,
    pm_cost_estimate = 1500.00
WHERE name LIKE '%BatchPlant%' 
  AND name != 'BatchPlant_15'
  AND is_pm = true;

-- =====================================================
-- 5. UPDATE OTHER EQUIPMENT TYPES BASED ON THEIR CONFIGS
-- =====================================================

-- Update Asphalt Paver to use Class A (90-day frequency)
UPDATE equipment 
SET 
    pm_class = 'Class A',
    pm_frequency_days = 90,
    pm_frequency_hours = 720,
    pm_cost_estimate = 500.00
WHERE type = 'Asphalt Paver' 
  AND is_pm = true;

-- Update other equipment types to use their most frequent PM class
UPDATE equipment 
SET 
    pm_class = 'Class A',
    pm_frequency_days = 30,
    pm_frequency_hours = 240,
    pm_cost_estimate = 500.00
WHERE type NOT IN ('BatchPlant', 'Asphalt Paver')
  AND is_pm = true
  AND (pm_class IS NULL OR pm_class = '');

-- =====================================================
-- 6. CALCULATE NEXT PM DATES FOR UPDATED EQUIPMENT
-- =====================================================

-- Calculate next PM dates for equipment that were updated
UPDATE equipment 
SET next_pm_date = 
    CASE 
        WHEN last_pm_date IS NOT NULL THEN 
            last_pm_date + INTERVAL '1 day' * pm_frequency_days
        ELSE 
            created_at + INTERVAL '1 day' * pm_frequency_days
    END
WHERE is_pm = true 
  AND pm_frequency_days IS NOT NULL 
  AND pm_frequency_days > 0;

-- =====================================================
-- 7. VERIFICATION QUERIES
-- =====================================================

-- Check updated PM class distribution
SELECT 
    'Updated PM Class Summary' as section,
    pm_class,
    COUNT(*) as total_equipment,
    COUNT(CASE WHEN is_pm = true THEN 1 END) as enrolled_count,
    COUNT(CASE WHEN is_pm = false OR is_pm IS NULL THEN 1 END) as not_enrolled_count
FROM equipment 
GROUP BY pm_class
ORDER BY pm_class;

-- Check BatchPlant_15 specifically
SELECT 
    'BatchPlant_15 After Update' as section,
    name,
    type,
    is_pm,
    pm_class,
    pm_frequency_days,
    pm_frequency_hours,
    pm_cost_estimate,
    last_pm_date,
    next_pm_date,
    CASE 
        WHEN next_pm_date <= NOW()::date THEN 'OVERDUE'
        WHEN next_pm_date <= (NOW() + INTERVAL '7 days')::date THEN 'This Week'
        WHEN next_pm_date <= (NOW() + INTERVAL '30 days')::date THEN 'This Month'
        WHEN next_pm_date <= (NOW() + INTERVAL '90 days')::date THEN 'This Quarter'
        ELSE 'Future'
    END as forecast_period
FROM equipment 
WHERE name = 'BatchPlant_15';

-- Show all BatchPlant equipment
SELECT 
    'All BatchPlant Equipment After Update' as section,
    name,
    type,
    is_pm,
    pm_class,
    pm_frequency_days,
    pm_cost_estimate,
    last_pm_date,
    next_pm_date
FROM equipment 
WHERE name LIKE '%BatchPlant%'
ORDER BY name; 