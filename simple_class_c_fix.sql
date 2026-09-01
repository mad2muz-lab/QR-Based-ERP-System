-- Simple Class C Fix
-- This script manually converts specific equipment to Class C

-- =====================================================
-- 1. FIX BATCHPLANT_15 FREQUENCY FIRST
-- =====================================================

UPDATE equipment 
SET 
    pm_frequency_days = 7,
    pm_frequency_hours = 480,
    next_pm_date = NOW()::date + INTERVAL '7 days'
WHERE name = 'BatchPlant_15';

-- =====================================================
-- 2. CONVERT SPECIFIC EQUIPMENT TO CLASS C
-- =====================================================

-- Convert specific equipment to Class C (adjust names as needed)
UPDATE equipment 
SET 
    pm_class = 'Class C',
    pm_frequency_days = 90,
    pm_frequency_hours = 720,
    pm_cost_estimate = 3000.00,
    next_pm_date = NOW()::date + INTERVAL '30 days'
WHERE name = 'Excavator_1'
  AND is_pm = true;

UPDATE equipment 
SET 
    pm_class = 'Class C',
    pm_frequency_days = 90,
    pm_frequency_hours = 720,
    pm_cost_estimate = 3000.00,
    next_pm_date = NOW()::date + INTERVAL '30 days'
WHERE name = 'Bulldozer_1'
  AND is_pm = true;

-- =====================================================
-- 3. VERIFICATION
-- =====================================================

-- Check PM class distribution
SELECT 
    'Final PM Class Distribution' as section,
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