-- Delete All Equipment Except One (Comprehensive)
-- Handle all foreign key references before deletion

-- Step 1: Check what tables reference equipment
SELECT 
    'Tables that reference equipment:' as info;
    
SELECT DISTINCT
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'equipment'
ORDER BY tc.table_name;

-- Step 2: Delete from all referencing tables
-- Delete from preventive_maintenance_logs
DELETE FROM preventive_maintenance_logs 
WHERE equipment_id != '9c8f1f64-d1c5-480b-8073-d42b326f847e';

-- Delete from corrective_maintenance_requests
DELETE FROM corrective_maintenance_requests 
WHERE equipment_id != '9c8f1f64-d1c5-480b-8073-d42b326f847e';

-- Delete from any other tables that might reference equipment
-- (Add more DELETE statements here if needed based on Step 1 results)

-- Step 3: Delete all equipment except the specified one
DELETE FROM equipment 
WHERE id != '9c8f1f64-d1c5-480b-8073-d42b326f847e';

-- Step 4: Verify the result
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

-- Step 5: Check remaining records in related tables
SELECT 
    'Remaining PM logs:' as info,
    COUNT(*) as pm_logs_count
FROM preventive_maintenance_logs;

SELECT 
    'Remaining corrective maintenance requests:' as info,
    COUNT(*) as cmr_count
FROM corrective_maintenance_requests; 