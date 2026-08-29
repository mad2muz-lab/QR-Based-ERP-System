-- Delete All Equipment Except One (Circular Dependency Fix)
-- Handle circular foreign key references

-- Step 1: First, let's see the exact foreign key relationships
SELECT 
    'Foreign key relationships for equipment:' as info;
    
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND (ccu.table_name = 'equipment' OR tc.table_name = 'equipment')
ORDER BY tc.table_name;

-- Step 2: Handle circular dependency by setting foreign keys to NULL where possible
-- First, update corrective_maintenance_requests to remove inventory_request_id references
UPDATE corrective_maintenance_requests 
SET inventory_request_id = NULL 
WHERE equipment_id != '9c8f1f64-d1c5-480b-8073-d42b326f847e';

-- Step 3: Now delete in the correct order
-- Delete from cm_material_request_items (deepest child)
DELETE FROM cm_material_request_items 
WHERE inventory_request_id IN (
    SELECT id FROM cm_inventory_material_requests 
    WHERE maintenance_request_id IN (
        SELECT id FROM corrective_maintenance_requests 
        WHERE equipment_id != '9c8f1f64-d1c5-480b-8073-d42b326f847e'
    )
);

-- Delete from cm_inventory_material_requests
DELETE FROM cm_inventory_material_requests 
WHERE maintenance_request_id IN (
    SELECT id FROM corrective_maintenance_requests 
    WHERE equipment_id != '9c8f1f64-d1c5-480b-8073-d42b326f847e'
);

-- Delete from corrective_maintenance_requests
DELETE FROM corrective_maintenance_requests 
WHERE equipment_id != '9c8f1f64-d1c5-480b-8073-d42b326f847e';

-- Delete from preventive_maintenance_logs
DELETE FROM preventive_maintenance_logs 
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