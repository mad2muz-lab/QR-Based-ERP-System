-- Set Defaults for All Enrolled Equipment
-- This script ensures all equipment listed under enrollment have proper default values

-- =====================================================
-- 1. ENSURE ALL ENROLLED EQUIPMENT HAVE PM CLASS
-- =====================================================

-- Set default PM class for equipment that are enrolled but don't have a PM class
UPDATE equipment 
SET pm_class = 'Class A'
WHERE is_pm = true 
  AND (pm_class IS NULL OR pm_class = '');

-- =====================================================
-- 2. SET FREQUENCY DAYS FOR ALL ENROLLED EQUIPMENT
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
-- 3. SET COST ESTIMATES FOR ALL ENROLLED EQUIPMENT
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
-- 4. SET COST MULTIPLIER FOR ALL ENROLLED EQUIPMENT
-- =====================================================

-- Note: pm_cost_multiplier column doesn't exist in current database schema
-- This section has been removed to avoid errors

-- =====================================================
-- 5. SET LAST PM DATE FOR EQUIPMENT WITHOUT IT
-- =====================================================

-- Set last PM date to creation date for equipment that don't have it
UPDATE equipment 
SET last_pm_date = created_at
WHERE is_pm = true 
  AND last_pm_date IS NULL;

-- =====================================================
-- 6. CALCULATE NEXT PM DATES FOR ALL ENROLLED EQUIPMENT
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
-- 7. SET FREQUENCY HOURS FOR ALL ENROLLED EQUIPMENT
-- =====================================================

-- Set frequency hours based on PM class for equipment that don't have them
UPDATE equipment 
SET pm_frequency_hours = 
    CASE 
        WHEN pm_class = 'Class A' THEN 720  -- 30 days * 24 hours
        WHEN pm_class = 'Class B' THEN 8760 -- 365 days * 24 hours
        WHEN pm_class = 'Class C' THEN 17520 -- 730 days * 24 hours
        ELSE 720
    END
WHERE is_pm = true 
  AND (pm_frequency_hours IS NULL OR pm_frequency_hours = 0);

-- =====================================================
-- 8. SET DEFAULT CHECKLIST ITEMS FOR ALL ENROLLED EQUIPMENT
-- =====================================================

-- Set default checklist items for equipment that don't have them
UPDATE equipment 
SET pm_checklist_items = ARRAY[
    'Inspect general condition',
    'Check fluid levels',
    'Test safety systems',
    'Clean equipment',
    'Document findings'
]
WHERE is_pm = true 
  AND (pm_checklist_items IS NULL OR array_length(pm_checklist_items, 1) = 0);

-- =====================================================
-- 9. SET DEFAULT SPARE PARTS FOR ALL ENROLLED EQUIPMENT
-- =====================================================

-- Set default spare parts for equipment that don't have them
UPDATE equipment 
SET pm_spare_parts = ARRAY[
    'Oil filter',
    'Air filter',
    'Hydraulic fluid',
    'Grease'
]
WHERE is_pm = true 
  AND (pm_spare_parts IS NULL OR array_length(pm_spare_parts, 1) = 0);

-- =====================================================
-- 10. VERIFICATION QUERIES
-- =====================================================

-- Check enrollment status and defaults
SELECT 
    'Enrollment Status Summary' as section,
    COUNT(*) as total_equipment,
    COUNT(CASE WHEN is_pm = true THEN 1 END) as enrolled_count,
    COUNT(CASE WHEN is_pm = false OR is_pm IS NULL THEN 1 END) as not_enrolled_count
FROM equipment;

-- Check PM class distribution
SELECT 
    'PM Class Distribution' as section,
    pm_class,
    COUNT(*) as equipment_count
FROM equipment 
WHERE is_pm = true
GROUP BY pm_class
ORDER BY pm_class;

-- Check for equipment still missing defaults
SELECT 
    'Equipment Missing Defaults' as section,
    name,
    type,
    pm_class,
    pm_frequency_days,
    pm_cost_estimate,
    last_pm_date,
    next_pm_date
FROM equipment 
WHERE is_pm = true 
  AND (
    pm_class IS NULL OR 
    pm_frequency_days IS NULL OR 
    pm_cost_estimate IS NULL OR 
    last_pm_date IS NULL OR 
    next_pm_date IS NULL
  )
ORDER BY name;

-- Sample of equipment with complete defaults
SELECT 
    'Sample Equipment with Defaults' as section,
    name,
    type,
    pm_class,
    pm_frequency_days,
    pm_cost_estimate,
    last_pm_date,
    next_pm_date
FROM equipment 
WHERE is_pm = true 
  AND pm_class IS NOT NULL 
  AND pm_frequency_days IS NOT NULL 
  AND pm_cost_estimate IS NOT NULL 
  AND last_pm_date IS NOT NULL 
  AND next_pm_date IS NOT NULL
ORDER BY name
LIMIT 5; 