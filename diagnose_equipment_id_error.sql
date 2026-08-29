-- Diagnostic script to identify equipment ID format issues
-- This will help us understand why the 400 error is occurring

-- 1. Check equipment table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'equipment'
ORDER BY ordinal_position;

-- 2. Check the specific equipment that's causing the error
-- The error shows ID: 0218dd1f-fc1f-4b55-bf73-f541a3d0f127
SELECT
    id,
    custom_equipment_id,
    name,
    type,
    created_at
FROM equipment
WHERE id = '0218dd1f-fc1f-4b55-bf73-f541a3d0f127'
   OR custom_equipment_id = '0218dd1f-fc1f-4b55-bf73-f541a3d0f127';

-- 3. Check all equipment IDs to understand the format
SELECT
    id,
    custom_equipment_id,
    name,
    type,
    CASE
        WHEN id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        THEN 'UUID Format'
        ELSE 'Non-UUID Format'
    END as id_format,
    CASE
        WHEN custom_equipment_id ~ '^[A-Z0-9-]{1,10}$'
        THEN 'Valid Custom ID'
        ELSE 'Invalid Custom ID'
    END as custom_id_format
FROM equipment
LIMIT 10;

-- 4. Check for any equipment with missing or null IDs
SELECT
    COUNT(*) as total_equipment,
    COUNT(id) as equipment_with_id,
    COUNT(custom_equipment_id) as equipment_with_custom_id,
    COUNT(*) - COUNT(id) as missing_ids,
    COUNT(*) - COUNT(custom_equipment_id) as missing_custom_ids
FROM equipment;

-- 5. Check RLS policies on equipment table
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'equipment';

-- 6. Test a simple equipment query to see if it works
SELECT COUNT(*) as total_equipment FROM equipment;

-- 7. Check if the specific UUID exists in any format
SELECT
    'Found by ID' as search_type,
    id,
    custom_equipment_id,
    name
FROM equipment
WHERE id = '0218dd1f-fc1f-4b55-bf73-f541a3d0f127'

UNION ALL

SELECT
    'Found by Custom ID' as search_type,
    id,
    custom_equipment_id,
    name
FROM equipment
WHERE custom_equipment_id = '0218dd1f-fc1f-4b55-bf73-f541a3d0f127'; 