-- Test Equipment Foreign Key Constraint
-- This script checks if the equipment exists and tests the foreign key constraint

-- 1. Check if equipment table exists and has data
SELECT 
    'Equipment table exists' as check_type,
    COUNT(*) as record_count
FROM equipment;

-- 2. Show some sample equipment IDs
SELECT 
    'Sample equipment IDs' as check_type,
    id,
    name,
    type
FROM equipment 
LIMIT 5;

-- 3. Test if we can insert with a valid equipment_id
DO $$
DECLARE
    valid_equipment_id TEXT;
BEGIN
    -- Get a valid equipment ID
    SELECT id INTO valid_equipment_id FROM equipment LIMIT 1;
    
    IF valid_equipment_id IS NULL THEN
        RAISE NOTICE 'ERROR: No equipment found in equipment table';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found valid equipment ID: %', valid_equipment_id;
    
    -- Try to insert with valid equipment_id
    INSERT INTO equipment_maintenance_logs (
        id,
        equipment_id,
        maintenance_type,
        status,
        description,
        start_date,
        created_at,
        updated_at
    ) VALUES (
        'test-' || gen_random_uuid()::text,
        valid_equipment_id,
        'repair',
        'scheduled',
        'Test with valid equipment_id',
        NOW(),
        NOW(),
        NOW()
    );
    
    -- Clean up
    DELETE FROM equipment_maintenance_logs WHERE description = 'Test with valid equipment_id';
    
    RAISE NOTICE 'SUCCESS: Insert with valid equipment_id worked!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: Insert with valid equipment_id failed: %', SQLERRM;
END $$;

-- 4. Test if we can insert with invalid equipment_id (should fail with FK error, not RLS)
DO $$
BEGIN
    INSERT INTO equipment_maintenance_logs (
        id,
        equipment_id,
        maintenance_type,
        status,
        description,
        start_date,
        created_at,
        updated_at
    ) VALUES (
        'test-' || gen_random_uuid()::text,
        'invalid-equipment-id',
        'repair',
        'scheduled',
        'Test with invalid equipment_id',
        NOW(),
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'WARNING: Insert with invalid equipment_id succeeded (this might indicate FK constraint is not working)';
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'SUCCESS: Foreign key constraint is working - invalid equipment_id was rejected';
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: Unexpected error with invalid equipment_id: %', SQLERRM;
END $$; 