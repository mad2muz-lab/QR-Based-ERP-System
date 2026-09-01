-- Fix Equipment Enrollment Issue
-- This script will ensure equipment can be enrolled in PM

-- =====================================================
-- 1. CHECK IF THERE ARE ANY EQUIPMENT RECORDS
-- =====================================================

SELECT 
    'Equipment Records Check' as section,
    COUNT(*) as total_equipment
FROM equipment;

-- =====================================================
-- 2. CREATE SAMPLE EQUIPMENT IF NONE EXIST
-- =====================================================

-- Insert sample equipment if none exist
INSERT INTO equipment (
    id, 
    custom_equipment_id, 
    name, 
    type, 
    model, 
    site, 
    qr_code, 
    status, 
    operational_status,
    is_pm,
    pm_class,
    pm_frequency_days,
    pm_frequency_hours,
    created_at,
    last_updated
)
SELECT 
    gen_random_uuid(),
    'EQ-' || to_char(now(), 'YYYYMMDD') || '-' || generate_series(1, 5),
    CASE generate_series(1, 5)
        WHEN 1 THEN 'Excavator CAT-320'
        WHEN 2 THEN 'Bulldozer D6T'
        WHEN 3 THEN 'Crane RT-550'
        WHEN 4 THEN 'Loader WA-380'
        WHEN 5 THEN 'Dump Truck HD-785'
    END,
    CASE generate_series(1, 5)
        WHEN 1 THEN 'Excavator'
        WHEN 2 THEN 'Bulldozer'
        WHEN 3 THEN 'Crane'
        WHEN 4 THEN 'Loader'
        WHEN 5 THEN 'Dump Truck'
    END,
    CASE generate_series(1, 5)
        WHEN 1 THEN 'CAT-320'
        WHEN 2 THEN 'D6T'
        WHEN 3 THEN 'RT-550'
        WHEN 4 THEN 'WA-380'
        WHEN 5 THEN 'HD-785'
    END,
    'Main Site',
    'QR-' || generate_series(1, 5),
    'available',
    'working',
    false,
    NULL,
    NULL,
    NULL,
    now(),
    now()
WHERE NOT EXISTS (SELECT 1 FROM equipment LIMIT 1);

-- =====================================================
-- 3. ENROLL SOME EQUIPMENT IN PM
-- =====================================================

-- Enroll first 3 equipment in PM with different classes
UPDATE equipment 
SET 
    is_pm = true,
    pm_class = 'Class A',
    pm_frequency_days = 90,
    pm_frequency_hours = 500
WHERE id IN (
    SELECT id FROM equipment 
    ORDER BY created_at 
    LIMIT 1
);

UPDATE equipment 
SET 
    is_pm = true,
    pm_class = 'Class B',
    pm_frequency_days = 365,
    pm_frequency_hours = 2000
WHERE id IN (
    SELECT id FROM equipment 
    ORDER BY created_at 
    LIMIT 1 OFFSET 1
);

UPDATE equipment 
SET 
    is_pm = true,
    pm_class = 'Class C',
    pm_frequency_days = 730,
    pm_frequency_hours = 5000
WHERE id IN (
    SELECT id FROM equipment 
    ORDER BY created_at 
    LIMIT 1 OFFSET 2
);

-- =====================================================
-- 4. VERIFY THE FIX
-- =====================================================

SELECT 
    'Equipment Enrollment Status After Fix' as section,
    COUNT(*) as total_equipment,
    COUNT(CASE WHEN is_pm = true THEN 1 END) as enrolled_in_pm,
    COUNT(CASE WHEN is_pm = false OR is_pm IS NULL THEN 1 END) as not_enrolled,
    COUNT(CASE WHEN pm_class IS NOT NULL THEN 1 END) as has_pm_class,
    COUNT(CASE WHEN is_pm = true AND pm_class IS NOT NULL THEN 1 END) as enrolled_with_class
FROM equipment;

-- Show enrolled equipment
SELECT 
    'Enrolled Equipment' as section,
    name,
    type,
    pm_class,
    pm_frequency_days,
    pm_frequency_hours
FROM equipment 
WHERE is_pm = true 
  AND pm_class IS NOT NULL
ORDER BY name;

-- Show equipment available for enrollment
SELECT 
    'Equipment Available for Enrollment' as section,
    name,
    type,
    'Click "Enroll Equipment in PM" button to enroll this equipment' as action
FROM equipment 
WHERE is_pm = false 
  OR is_pm IS NULL
ORDER BY name; 