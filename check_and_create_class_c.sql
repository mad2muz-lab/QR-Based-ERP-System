-- Check and Create Class C Equipment
-- This script first checks what equipment exist, then converts them to Class C

-- =====================================================
-- 1. CHECK WHAT EQUIPMENT ARE AVAILABLE
-- =====================================================

SELECT 
    'Available Equipment for Class C Conversion' as section,
    name,
    type,
    is_pm,
    pm_class,
    pm_frequency_days
FROM equipment 
WHERE is_pm = true 
  AND pm_class = 'Class A'
ORDER BY name;

-- =====================================================
-- 2. FIX BATCHPLANT_15 FREQUENCY
-- =====================================================

UPDATE equipment 
SET 
    pm_frequency_days = 7,
    pm_frequency_hours = 480,
    next_pm_date = NOW()::date + INTERVAL '7 days'
WHERE name = 'BatchPlant_15';

-- =====================================================
-- 3. CONVERT FIRST AVAILABLE EQUIPMENT TO CLASS C
-- =====================================================

-- Convert the first available equipment to Class C
UPDATE equipment 
SET 
    pm_class = 'Class C',
    pm_frequency_days = 90,
    pm_frequency_hours = 720,
    pm_cost_estimate = 3000.00,
    next_pm_date = NOW()::date + INTERVAL '30 days'
WHERE id = (
    SELECT id FROM equipment 
    WHERE is_pm = true 
      AND pm_class = 'Class A'
    ORDER BY name
    LIMIT 1
);

-- Convert the second available equipment to Class C
UPDATE equipment 
SET 
    pm_class = 'Class C',
    pm_frequency_days = 90,
    pm_frequency_hours = 720,
    pm_cost_estimate = 3000.00,
    next_pm_date = NOW()::date + INTERVAL '30 days'
WHERE id = (
    SELECT id FROM equipment 
    WHERE is_pm = true 
      AND pm_class = 'Class A'
    ORDER BY name
    LIMIT 1
);

-- =====================================================
-- 4. VERIFICATION
-- =====================================================

-- Check PM class distribution
SELECT 
    'PM Class Distribution After Class C Creation' as section,
    pm_class,
    COUNT(*) as total_equipment,
    COUNT(CASE WHEN is_pm = true THEN 1 END) as enrolled_count
FROM equipment 
GROUP BY pm_class
ORDER BY pm_class;

-- Show all Class B and C equipment
SELECT 
    'All Class B and C Equipment' as section,
    pm_class,
    name,
    type,
    pm_frequency_days,
    next_pm_date,
    CASE 
        WHEN next_pm_date <= NOW()::date THEN 'OVERDUE'
        WHEN next_pm_date <= (NOW() + INTERVAL '7 days')::date THEN 'This Week'
        WHEN next_pm_date <= (NOW() + INTERVAL '30 days')::date THEN 'This Month'
        WHEN next_pm_date <= (NOW() + INTERVAL '90 days')::date THEN 'This Quarter'
        ELSE 'Future'
    END as forecast_period
FROM equipment 
WHERE is_pm = true 
  AND pm_class IN ('Class B', 'Class C')
ORDER BY pm_class, name;

-- Check BatchPlant_15
SELECT 
    'BatchPlant_15 Status' as section,
    name,
    type,
    is_pm,
    pm_class,
    pm_frequency_days,
    pm_cost_estimate,
    next_pm_date
FROM equipment 
WHERE name = 'BatchPlant_15'; 