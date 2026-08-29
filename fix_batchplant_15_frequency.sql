-- Fix BatchPlant_15 Frequency
-- This script corrects BatchPlant_15 to have 7-day frequency as intended

-- =====================================================
-- 1. FIX BATCHPLANT_15 TO 7-DAY FREQUENCY
-- =====================================================

UPDATE equipment 
SET 
    pm_frequency_days = 7,
    pm_frequency_hours = 480,
    next_pm_date = NOW()::date + INTERVAL '7 days'
WHERE name = 'BatchPlant_15';

-- =====================================================
-- 2. VERIFICATION
-- =====================================================

-- Check BatchPlant_15
SELECT 
    'BatchPlant_15 Fixed Status' as section,
    name,
    type,
    is_pm,
    pm_class,
    pm_frequency_days,
    pm_cost_estimate,
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