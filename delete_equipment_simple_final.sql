-- Delete All Equipment Except One (Simple Final Approach)
-- Temporarily disable foreign key constraints to handle circular dependencies

-- Step 1: Temporarily disable foreign key constraints
SET session_replication_role = replica;

-- Step 2: Delete all related records
DELETE FROM cm_material_request_items 
WHERE inventory_request_id IN (
    SELECT id FROM cm_inventory_material_requests 
    WHERE maintenance_request_id IN (
        SELECT id FROM corrective_maintenance_requests 
        WHERE equipment_id != '9c8f1f64-d1c5-480b-8073-d42b326f847e'
    )
);

DELETE FROM cm_inventory_material_requests 
WHERE maintenance_request_id IN (
    SELECT id FROM corrective_maintenance_requests 
    WHERE equipment_id != '9c8f1f64-d1c5-480b-8073-d42b326f847e'
);

DELETE FROM corrective_maintenance_requests 
WHERE equipment_id != '9c8f1f64-d1c5-480b-8073-d42b326f847e';

DELETE FROM preventive_maintenance_logs 
WHERE equipment_id != '9c8f1f64-d1c5-480b-8073-d42b326f847e';

-- Step 3: Delete all equipment except the specified one
DELETE FROM equipment 
WHERE id != '9c8f1f64-d1c5-480b-8073-d42b326f847e';

-- Step 4: Re-enable foreign key constraints
SET session_replication_role = DEFAULT;

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