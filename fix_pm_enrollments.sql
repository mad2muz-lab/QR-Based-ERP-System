-- Fix PM Enrollments
-- This script enrolls equipment that have PM classes but aren't enrolled

-- =====================================================
-- 1. ENROLL EQUIPMENT WITH PM CLASSES
-- =====================================================

-- Enroll equipment that have PM classes but aren't enrolled
UPDATE equipment 
SET is_pm = true
WHERE pm_class IS NOT NULL 
  AND pm_class != ''
  AND (is_pm = false OR is_pm IS NULL);

-- =====================================================
-- 2. SET DEFAULT PM CLASS FOR ENROLLED EQUIPMENT WITHOUT CLASS
-- =====================================================

-- Set default PM class for equipment that are enrolled but don't have a PM class
UPDATE equipment 
SET pm_class = 'Class A'
WHERE is_pm = true 
  AND (pm_class IS NULL OR pm_class = '');

-- =====================================================
-- 3. SET FREQUENCY DAYS FOR EQUIPMENT WITHOUT THEM
-- =====================================================

-- Set frequency days based on PM class for equipment that don't have them
UPDATE equipment 
SET pm_frequency_days = 
    CASE 
        WHEN pm_class = 'Class A' THEN 90
        WHEN pm_class = 'Class B' THEN 365
        WHEN pm_class = 'Class C' THEN 730
        ELSE 30
    END
WHERE is_pm = true 
  AND (pm_frequency_days IS NULL OR pm_frequency_days = 0);

-- =====================================================
-- 4. SET COST ESTIMATES FOR EQUIPMENT WITHOUT THEM
-- =====================================================

-- Set cost estimates based on PM class for equipment that don't have them
UPDATE equipment 
SET pm_cost_estimate = 
    CASE 
        WHEN pm_class = 'Class A' THEN 500.00
        WHEN pm_class = 'Class B' THEN 1500.00
        WHEN pm_class = 'Class C' THEN 3000.00
        ELSE 800.00
    END
WHERE is_pm = true 
  AND pm_cost_estimate IS NULL;

-- =====================================================
-- 5. CALCULATE NEXT PM DATES FOR EQUIPMENT WITHOUT THEM
-- =====================================================

-- Calculate next PM dates for equipment that don't have them
UPDATE equipment 
SET next_pm_date = 
    CASE 
        WHEN last_pm_date IS NOT NULL THEN 
            last_pm_date + INTERVAL '1 day' * pm_frequency_days
        ELSE 
            created_at + INTERVAL '1 day' * pm_frequency_days
    END
WHERE is_pm = true 
  AND next_pm_date IS NULL 
  AND pm_frequency_days IS NOT NULL;

-- =====================================================
-- 6. VERIFICATION QUERIES
-- =====================================================

-- Check the results
SELECT 
    'PM Enrollment Status After Fix' as section,
    pm_class,
    COUNT(*) as total_equipment,
    COUNT(CASE WHEN is_pm = true THEN 1 END) as enrolled_count,
    COUNT(CASE WHEN is_pm = false OR is_pm IS NULL THEN 1 END) as not_enrolled_count
FROM equipment 
GROUP BY pm_class
ORDER BY pm_class;

-- Show sample enrolled equipment
SELECT 
    'Sample Enrolled Equipment' as section,
    name,
    type,
    pm_class,
    pm_frequency_days,
    pm_cost_estimate,
    last_pm_date,
    next_pm_date
FROM equipment 
WHERE is_pm = true 
ORDER BY pm_class, name
LIMIT 10; 