-- Delete All Equipment Except One (All Nested Constraints)
-- Handle all levels of nested foreign key references before deletion

-- Step 1: Delete in hierarchical order (deepest child tables first)

-- Delete from cm_material_request_items (references cm_inventory_material_requests)
DELETE FROM cm_material_request_items 
WHERE inventory_request_id IN (
    SELECT id FROM cm_inventory_material_requests 
    WHERE maintenance_request_id IN (
        SELECT id FROM corrective_maintenance_requests 
        WHERE equipment_id != '9c8f1f64-d1c5-480b-8073-d42b326f847e'
    )
);

-- Delete from cm_inventory_material_requests (references corrective_maintenance_requests)
DELETE FROM cm_inventory_material_requests 
WHERE maintenance_request_id IN (
    SELECT id FROM corrective_maintenance_requests 
    WHERE equipment_id != '9c8f1f64-d1c5-480b-8073-d42b326f847e'
);

-- Delete from corrective_maintenance_requests (references equipment)
DELETE FROM corrective_maintenance_requests 
WHERE equipment_id != '9c8f1f64-d1c5-480b-8073-d42b326f847e';

-- Delete from preventive_maintenance_logs (references equipment)
DELETE FROM preventive_maintenance_logs 
WHERE equipment_id != '9c8f1f64-d1c5-480b-8073-d42b326f847e';

-- Step 2: Now delete all equipment except the specified one
DELETE FROM equipment 
WHERE id != '9c8f1f64-d1c5-480b-8073-d42b326f847e';

-- Step 3: Verify the result
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

-- Step 4: Check remaining records in all related tables
SELECT 
    'Remaining PM logs:' as info,
    COUNT(*) as pm_logs_count
FROM preventive_maintenance_logs;

SELECT 
    'Remaining corrective maintenance requests:' as info,
    COUNT(*) as cmr_count
FROM corrective_maintenance_requests;

SELECT 
    'Remaining inventory material requests:' as info,
    COUNT(*) as imr_count
FROM cm_inventory_material_requests;

SELECT 
    'Remaining material request items:' as info,
    COUNT(*) as mri_count
FROM cm_material_request_items; 