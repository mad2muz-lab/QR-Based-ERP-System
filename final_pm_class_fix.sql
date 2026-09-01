-- Final PM Class Fix
-- This script fixes BatchPlant_15 frequency and checks for Class C equipment

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
-- 2. CHECK FOR CLASS C EQUIPMENT
-- =====================================================

-- Check if Class C equipment exist
SELECT 
    'Class C Equipment Check' as section,
    name,
    type,
    is_pm,
    pm_class,
    pm_frequency_days,
    next_pm_date
FROM equipment 
WHERE pm_class = 'Class C'
ORDER BY name;

-- =====================================================
-- 3. CREATE CLASS C EQUIPMENT IF MISSING
-- =====================================================

-- Update some equipment to Class C if they don't exist
UPDATE equipment 
SET 
    pm_class = 'Class C',
    pm_frequency_days = 90,
    pm_frequency_hours = 720,
    pm_cost_estimate = 3000.00,
    next_pm_date = NOW()::date + INTERVAL '30 days'
WHERE name IN ('Excavator_1', 'Bulldozer_1', 'Crane_1', 'Loader_1', 'Truck_1')
  AND is_pm = true
  AND pm_class = 'Class A';

-- =====================================================
-- 4. VERIFICATION
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

-- Check BatchPlant_15 specifically
SELECT 
    'BatchPlant_15 Final Status' as section,
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