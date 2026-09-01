-- Debug BatchPlant_15 PM Status
-- This script checks why BatchPlant_15 isn't showing in the dashboard

-- =====================================================
-- 1. CHECK BATCHPLANT_15 CURRENT STATUS
-- =====================================================

SELECT 
    'BatchPlant_15 Current Status' as section,
    name,
    type,
    is_pm,
    pm_class,
    pm_frequency_days,
    pm_frequency_hours,
    last_pm_date,
    next_pm_date,
    created_at,
    CASE 
        WHEN is_pm = true THEN 'ENROLLED'
        ELSE 'NOT ENROLLED'
    END as enrollment_status
FROM equipment 
WHERE name = 'BatchPlant_15';

-- =====================================================
-- 2. CALCULATE NEXT PM DATE MANUALLY
-- =====================================================

WITH batchplant_data AS (
    SELECT 
        name,
        pm_class,
        pm_frequency_days,
        last_pm_date,
        next_pm_date,
        created_at,
        NOW() as current_date
    FROM equipment 
    WHERE name = 'BatchPlant_15'
)
SELECT 
    'Manual Next PM Date Calculation' as section,
    name,
    pm_class,
    pm_frequency_days,
    last_pm_date,
    next_pm_date as db_next_pm_date,
    current_date,
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
        ELSE (created_at + INTERVAL '30 days')::date
    END as calculated_next_pm_date,
    CASE 
        WHEN next_pm_date IS NOT NULL THEN 'Database'
        WHEN last_pm_date IS NOT NULL AND pm_frequency_days IS NOT NULL AND pm_frequency_days > 0 THEN 'Frequency-based'
        WHEN last_pm_date IS NOT NULL THEN 'Class-based'
        ELSE 'Default'
    END as calculation_method
FROM batchplant_data;

-- =====================================================
-- 3. CHECK FORECAST PERIODS
-- =====================================================

WITH calculated_dates AS (
    SELECT 
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
    WHERE name = 'BatchPlant_15'
)
SELECT 
    'Forecast Period Analysis' as section,
    name,
    pm_class,
    calculated_next_pm_date,
    NOW()::date as today,
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
    END as period_key,
    CASE 
        WHEN calculated_next_pm_date <= NOW()::date THEN 'SHOULD SHOW'
        WHEN calculated_next_pm_date <= (NOW() + INTERVAL '7 days')::date THEN 'SHOULD SHOW'
        WHEN calculated_next_pm_date <= (NOW() + INTERVAL '30 days')::date THEN 'SHOULD SHOW'
        WHEN calculated_next_pm_date <= (NOW() + INTERVAL '90 days')::date THEN 'SHOULD SHOW'
        WHEN calculated_next_pm_date <= (NOW() + INTERVAL '365 days')::date THEN 'SHOULD SHOW'
        ELSE 'WON\'T SHOW'
    END as dashboard_visibility
FROM calculated_dates;

-- =====================================================
-- 4. CHECK ALL BATCHPLANT EQUIPMENT
-- =====================================================

SELECT 
    'All BatchPlant Equipment' as section,
    name,
    type,
    is_pm,
    pm_class,
    pm_frequency_days,
    last_pm_date,
    next_pm_date,
    CASE 
        WHEN is_pm = true AND pm_class IS NOT NULL THEN 'Enrolled with PM Class'
        WHEN is_pm = true AND pm_class IS NULL THEN 'Enrolled but NO PM Class'
        WHEN is_pm = false THEN 'Not Enrolled'
        WHEN is_pm IS NULL THEN 'PM Status Unknown'
        ELSE 'Other'
    END as enrollment_status
FROM equipment 
WHERE name LIKE '%BatchPlant%'
ORDER BY name; 