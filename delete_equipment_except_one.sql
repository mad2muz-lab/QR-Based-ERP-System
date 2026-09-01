-- Delete All Equipment Except One
-- Delete all equipment records except the specified ID

-- Step 1: Check current equipment count
SELECT 
    'Current equipment count:' as info,
    COUNT(*) as total_equipment
FROM equipment;

-- Step 2: Show the equipment we want to keep
SELECT 
    'Equipment to keep:' as info;
    
SELECT 
    id,
    name,
    type,
    site,
    status
FROM equipment 
WHERE id = '9c8f1f64-d1c5-480b-8073-d42b326f847e';

-- Step 3: Remove references from PM logs
UPDATE preventive_maintenance_logs 
SET equipment_id = NULL 
WHERE equipment_id != '9c8f1f64-d1c5-480b-8073-d42b326f847e';

-- Step 4: Delete all equipment except the specified one
DELETE FROM equipment 
WHERE id != '9c8f1f64-d1c5-480b-8073-d42b326f847e';

-- Step 5: Verify the result
SELECT 
    'Equipment after deletion:' as info;
    
SELECT 
    id,
    name,
    type,
    site,
    status
FROM equipment
ORDER BY created_at; 