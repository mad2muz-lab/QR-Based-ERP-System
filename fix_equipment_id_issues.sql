-- Fix equipment ID format issues
-- This script will resolve the 400 errors by ensuring proper ID formats

-- 1. First, let's check the current state
SELECT 'Current equipment count:' as info, COUNT(*) as count FROM equipment;

-- 2. Check for any equipment with problematic ID formats
SELECT
    id,
    custom_equipment_id,
    name,
    CASE
        WHEN id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        THEN 'Valid UUID'
        ELSE 'Invalid UUID'
    END as id_status
FROM equipment
WHERE id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
   OR id IS NULL;

-- 3. Fix equipment IDs that are not proper UUIDs
-- Generate new UUIDs for equipment with invalid IDs
UPDATE equipment
SET id = gen_random_uuid()::text
WHERE id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
   OR id IS NULL;

-- 4. Ensure custom_equipment_id is properly set
UPDATE equipment
SET custom_equipment_id = COALESCE(custom_equipment_id, 'EQP-' || SUBSTRING(id, 1, 8))
WHERE custom_equipment_id IS NULL OR custom_equipment_id = '';

-- 5. Add missing PM-related columns if they don't exist
DO $$
BEGIN
    -- Add is_pm column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'equipment' AND column_name = 'is_pm') THEN
        ALTER TABLE equipment ADD COLUMN is_pm BOOLEAN DEFAULT false;
    END IF;

    -- Add pm_class column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'equipment' AND column_name = 'pm_class') THEN
        ALTER TABLE equipment ADD COLUMN pm_class TEXT;
    END IF;

    -- Add pm_frequency_hours column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'equipment' AND column_name = 'pm_frequency_hours') THEN
        ALTER TABLE equipment ADD COLUMN pm_frequency_hours INTEGER;
    END IF;

    -- Add usage_duration column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'equipment' AND column_name = 'usage_duration') THEN
        ALTER TABLE equipment ADD COLUMN usage_duration NUMERIC DEFAULT 0;
    END IF;

    -- Add pm_checklist_items column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'equipment' AND column_name = 'pm_checklist_items') THEN
        ALTER TABLE equipment ADD COLUMN pm_checklist_items TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- 6. Set some sample PM data for testing
UPDATE equipment
SET
    is_pm = true,
    pm_class = 'Class A',
    pm_frequency_hours = 500,
    usage_duration = 450
WHERE id IN (
    SELECT id FROM equipment
    WHERE custom_equipment_id IN ('BatchPlant_2', 'MotorGrader_17', 'Loader_3')
    LIMIT 3
);

-- 7. Verify the fixes
SELECT
    'Equipment with valid UUIDs:' as check_type,
    COUNT(*) as count
FROM equipment
WHERE id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'

UNION ALL

SELECT
    'Equipment with custom IDs:' as check_type,
    COUNT(*) as count
FROM equipment
WHERE custom_equipment_id IS NOT NULL AND custom_equipment_id != ''

UNION ALL

SELECT
    'Equipment enrolled in PM:' as check_type,
    COUNT(*) as count
FROM equipment
WHERE is_pm = true;

-- 8. Show sample equipment data
SELECT
    id,
    custom_equipment_id,
    name,
    type,
    is_pm,
    pm_class,
    pm_frequency_hours,
    usage_duration
FROM equipment
WHERE is_pm = true
LIMIT 5;

-- 9. Test the specific equipment that was causing the error
SELECT
    'Testing specific equipment:' as test_info,
    id,
    custom_equipment_id,
    name
FROM equipment
WHERE id = '0218dd1f-fc1f-4b55-bf73-f541a3d0f127'
   OR custom_equipment_id = '0218dd1f-fc1f-4b55-bf73-f541a3d0f127'; 