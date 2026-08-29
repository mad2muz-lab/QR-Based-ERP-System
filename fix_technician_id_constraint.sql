-- Fix Technician ID Foreign Key Constraint Issue
-- This script will temporarily allow null technician_id values

-- 1. Check current constraint
SELECT 
    'Current technician_id constraint:' as info;
    
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'preventive_maintenance_logs'
    AND kcu.column_name = 'technician_id';

-- 2. Drop the foreign key constraint temporarily
ALTER TABLE preventive_maintenance_logs 
DROP CONSTRAINT IF EXISTS preventive_maintenance_logs_technician_id_fkey;

-- 3. Make technician_id nullable (if not already)
ALTER TABLE preventive_maintenance_logs 
ALTER COLUMN technician_id DROP NOT NULL;

-- 4. Verify the change
SELECT 
    'Updated technician_id column:' as info;
    
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'preventive_maintenance_logs' 
    AND column_name = 'technician_id';

-- 5. Test insert with null technician_id
-- (This will help verify the fix works)
INSERT INTO preventive_maintenance_logs (
    equipment_id,
    preventive_type_id,
    maintenance_class,
    technician_id,
    scheduled_date,
    completed_date,
    quality_score,
    checklist_completed,
    safety_checks_passed,
    total_items,
    completed_items,
    required_items_completed
) VALUES (
    'test-equipment-id',
    'test_preventive_type',
    'Class A',
    NULL,  -- This should now work
    NOW(),
    NOW(),
    85,
    true,
    true,
    5,
    5,
    3
) ON CONFLICT DO NOTHING;

-- 6. Clean up test data
DELETE FROM preventive_maintenance_logs 
WHERE equipment_id = 'test-equipment-id';

-- 7. Show current PM logs
SELECT 
    'Current PM logs:' as info;
    
SELECT 
    id,
    equipment_id,
    technician_id,
    maintenance_class,
    safety_checks_passed,
    completed_date
FROM preventive_maintenance_logs 
WHERE checklist_completed = true
ORDER BY completed_date DESC
LIMIT 5; 