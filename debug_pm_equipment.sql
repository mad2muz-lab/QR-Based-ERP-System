-- Debug PM Equipment Data
-- This script helps identify why Class B and Class C equipment aren't showing in forecasts

-- =====================================================
-- 1. CHECK ENROLLED EQUIPMENT BY PM CLASS
-- =====================================================

SELECT 
    'PM Class Distribution' as section,
    pm_class,
    COUNT(*) as equipment_count
FROM equipment 
WHERE is_pm = true 
GROUP BY pm_class
ORDER BY pm_class;

-- =====================================================
-- 2. CHECK EQUIPMENT WITH PM FREQUENCY SETTINGS
-- =====================================================

SELECT 
    'Equipment with PM Frequency Settings' as section,
    name,
    type,
    pm_class,
    pm_frequency_days,
    pm_frequency_hours,
    last_pm_date,
    next_pm_date,
    CASE 
        WHEN pm_frequency_days IS NULL THEN 'No frequency set'
        WHEN pm_frequency_days = 0 THEN 'Zero frequency'
        ELSE 'Has frequency'
    END as frequency_status
FROM equipment 
WHERE is_pm = true 
  AND (pm_class = 'Class B' OR pm_class = 'Class C')
ORDER BY pm_class, name;

-- =====================================================
-- 3. CALCULATE NEXT PM DATES MANUALLY
-- =====================================================

SELECT 
    'Manual Next PM Date Calculation' as section,
    name,
    pm_class,
    pm_frequency_days,
    last_pm_date,
    next_pm_date as db_next_pm_date,
    CASE 
        WHEN next_pm_date IS NOT NULL THEN next_pm_date
        WHEN last_pm_date IS NOT NULL AND pm_frequency_days IS NOT NULL AND pm_frequency_days > 0 THEN
            (last_pm_date + INTERVAL '1 day' * pm_frequency_days)::date
        WHEN last_pm_date IS NOT NULL THEN
            CASE 
                WHEN pm_class = 'Class A' THEN (last_pm_date + INTERVAL '90 days')::date
                WHEN pm_class = 'Class B' THEN (last_pm_date + INTERVAL '365 days')::date
                WHEN pm_class = 'Class C' THEN (last_pm_date + INTERVAL '730 days')::date
                ELSE (last_pm_date + INTERVAL '30 days')::date
            END
        ELSE (NOW() + INTERVAL '30 days')::date
    END as calculated_next_pm_date,
    CASE 
        WHEN next_pm_date IS NOT NULL THEN 'Database'
        WHEN last_pm_date IS NOT NULL AND pm_frequency_days IS NOT NULL AND pm_frequency_days > 0 THEN 'Frequency-based'
        WHEN last_pm_date IS NOT NULL THEN 'Class-based'
        ELSE 'Default'
    END as calculation_method
FROM equipment 
WHERE is_pm = true 
  AND (pm_class = 'Class B' OR pm_class = 'Class C')
ORDER BY pm_class, name;

-- =====================================================
-- 4. CHECK WHICH EQUIPMENT WOULD SHOW IN FORECASTS
-- =====================================================

WITH calculated_dates AS (
    SELECT 
        id,
        name,
        pm_class,
        pm_frequency_days,
        last_pm_date,
        next_pm_date as db_next_pm_date,
        CASE 
            WHEN next_pm_date IS NOT NULL THEN next_pm_date
            WHEN last_pm_date IS NOT NULL AND pm_frequency_days IS NOT NULL AND pm_frequency_days > 0 THEN
                (last_pm_date + INTERVAL '1 day' * pm_frequency_days)::date
            WHEN last_pm_date IS NOT NULL THEN
                CASE 
                    WHEN pm_class = 'Class A' THEN (last_pm_date + INTERVAL '90 days')::date
                    WHEN pm_class = 'Class B' THEN (last_pm_date + INTERVAL '365 days')::date
                    WHEN pm_class = 'Class C' THEN (last_pm_date + INTERVAL '730 days')::date
                    ELSE (last_pm_date + INTERVAL '30 days')::date
                END
            ELSE (NOW() + INTERVAL '30 days')::date
        END as calculated_next_pm_date
    FROM equipment 
    WHERE is_pm = true
)
SELECT 
    'Forecast Period Analysis' as section,
    name,
    pm_class,
    calculated_next_pm_date,
    CASE 
        WHEN calculated_next_pm_date <= NOW()::date THEN 'OVERDUE'
        WHEN calculated_next_pm_date <= (NOW() + INTERVAL '7 days')::date THEN 'This Week'
        WHEN calculated_next_pm_date <= (NOW() + INTERVAL '30 days')::date THEN 'This Month'
        WHEN calculated_next_pm_date <= (NOW() + INTERVAL '90 days')::date THEN 'This Quarter'
        WHEN calculated_next_pm_date <= (NOW() + INTERVAL '365 days')::date THEN 'This Year'
        ELSE 'Future'
    END as forecast_period,
    CASE 
        WHEN calculated_next_pm_date <= NOW()::date THEN 'OVERDUE'
        WHEN calculated_next_pm_date <= (NOW() + INTERVAL '7 days')::date THEN 'Week'
        WHEN calculated_next_pm_date <= (NOW() + INTERVAL '30 days')::date THEN 'Month'
        WHEN calculated_next_pm_date <= (NOW() + INTERVAL '90 days')::date THEN 'Quarter'
        WHEN calculated_next_pm_date <= (NOW() + INTERVAL '365 days')::date THEN 'Year'
        ELSE 'Future'
    END as period_key
FROM calculated_dates
WHERE pm_class IN ('Class B', 'Class C')
ORDER BY pm_class, calculated_next_pm_date;

-- =====================================================
-- 5. SUMMARY OF ISSUES
-- =====================================================

SELECT 
    'Potential Issues Summary' as section,
    'Equipment without last_pm_date' as issue,
    COUNT(*) as count
FROM equipment 
WHERE is_pm = true AND last_pm_date IS NULL
UNION ALL
SELECT 
    'Potential Issues Summary' as section,
    'Equipment without next_pm_date' as issue,
    COUNT(*) as count
FROM equipment 
WHERE is_pm = true AND next_pm_date IS NULL
UNION ALL
SELECT 
    'Potential Issues Summary' as section,
    'Equipment with zero frequency_days' as issue,
    COUNT(*) as count
FROM equipment 
WHERE is_pm = true AND pm_frequency_days = 0
UNION ALL
SELECT 
    'Potential Issues Summary' as section,
    'Equipment with null frequency_days' as issue,
    COUNT(*) as count
FROM equipment 
WHERE is_pm = true AND pm_frequency_days IS NULL; 