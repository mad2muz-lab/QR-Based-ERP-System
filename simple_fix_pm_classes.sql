-- Simple Fix for PM Classes
-- This script directly updates equipment to have Class B and C

-- =====================================================
-- 1. UPDATE BATCHPLANT_15 TO CLASS B
-- =====================================================

UPDATE equipment 
SET 
    pm_class = 'Class B',
    pm_frequency_days = 7,
    pm_frequency_hours = 480,
    pm_cost_estimate = 1500.00,
    next_pm_date = NOW()::date + INTERVAL '7 days'
WHERE name = 'BatchPlant_15';

-- =====================================================
-- 2. UPDATE SOME EQUIPMENT TO CLASS B
-- =====================================================

-- Update first 3 enrolled equipment to Class B
UPDATE equipment 
SET 
    pm_class = 'Class B',
    pm_frequency_days = 30,
    pm_frequency_hours = 240,
    pm_cost_estimate = 1500.00,
    next_pm_date = NOW()::date + INTERVAL '15 days'
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY name) as rn
        FROM equipment 
        WHERE is_pm = true 
          AND pm_class = 'Class A'
    ) ranked
    WHERE rn <= 3
);

-- =====================================================
-- 3. UPDATE SOME EQUIPMENT TO CLASS C
-- =====================================================

-- Update next 2 enrolled equipment to Class C
UPDATE equipment 
SET 
    pm_class = 'Class C',
    pm_frequency_days = 90,
    pm_frequency_hours = 720,
    pm_cost_estimate = 3000.00,
    next_pm_date = NOW()::date + INTERVAL '30 days'
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY name) as rn
        FROM equipment 
        WHERE is_pm = true 
          AND pm_class = 'Class A'
    ) ranked
    WHERE rn > 3 AND rn <= 5
);

-- =====================================================
-- 4. VERIFICATION
-- =====================================================

-- Check PM class distribution
SELECT 
    'PM Class Distribution After Fix' as section,
    pm_class,
    COUNT(*) as total_equipment,
    COUNT(CASE WHEN is_pm = true THEN 1 END) as enrolled_count
FROM equipment 
GROUP BY pm_class
ORDER BY pm_class;

-- Check BatchPlant_15
SELECT 
    'BatchPlant_15 Status' as section,
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

-- Show sample equipment by class
SELECT 
    'Sample Equipment by Class' as section,
    pm_class,
    name,
    type,
    pm_frequency_days,
    next_pm_date
FROM equipment 
WHERE is_pm = true 
  AND pm_class IN ('Class B', 'Class C')
ORDER BY pm_class, name; 