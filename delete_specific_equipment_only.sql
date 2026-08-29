-- Delete Specific Equipment Only
-- Delete only the equipment with ID 9c8f1f64-d1c5-480b-8073-d42b326f847e

-- Step 1: Check current equipment
SELECT 
    'Current equipment before deletion:' as info;
    
SELECT 
    id,
    name,
    type,
    site,
    status
FROM equipment
ORDER BY created_at;

-- Step 2: Temporarily disable foreign key constraints
SET session_replication_role = replica;

-- Step 3: Delete related records for this specific equipment
-- Delete from cm_material_request_items
DELETE FROM cm_material_request_items 
WHERE inventory_request_id IN (
    SELECT id FROM cm_inventory_material_requests 
    WHERE maintenance_request_id IN (
        SELECT id FROM corrective_maintenance_requests 
        WHERE equipment_id = '9c8f1f64-d1c5-480b-8073-d42b326f847e'
    )
);

-- Delete from cm_inventory_material_requests
DELETE FROM cm_inventory_material_requests 
WHERE maintenance_request_id IN (
    SELECT id FROM corrective_maintenance_requests 
    WHERE equipment_id = '9c8f1f64-d1c5-480b-8073-d42b326f847e'
);

-- Delete from corrective_maintenance_requests
DELETE FROM corrective_maintenance_requests 
WHERE equipment_id = '9c8f1f64-d1c5-480b-8073-d42b326f847e';

-- Delete from preventive_maintenance_logs
DELETE FROM preventive_maintenance_logs 
WHERE equipment_id = '9c8f1f64-d1c5-480b-8073-d42b326f847e';

-- Step 4: Delete only this specific equipment
DELETE FROM equipment 
WHERE id = '9c8f1f64-d1c5-480b-8073-d42b326f847e';

-- Step 5: Re-enable foreign key constraints
SET session_replication_role = DEFAULT;

-- Step 6: Verify the result
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