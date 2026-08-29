-- Delete Specific Employees - Keep One (Fixed)
-- This script deletes only the two unwanted employees while keeping the specified one
-- Only handles tables that actually exist in the database

-- 1. First, let's see the current employees
SELECT 
    'Current employees before deletion:' as info;
    
SELECT 
    id,
    name,
    department,
    position,
    created_at
FROM employees
ORDER BY created_at;

-- 2. Check what tables actually exist that reference employees
SELECT 
    'Tables that reference employees:' as info;
    
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
    AND ccu.table_name = 'employees'
ORDER BY tc.table_name;

-- 3. Handle foreign key constraints for tables that exist
-- Only update tables that actually exist

-- Handle preventive_maintenance_logs (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'preventive_maintenance_logs') THEN
        UPDATE preventive_maintenance_logs 
        SET technician_id = NULL 
        WHERE technician_id IN ('0bafc39e-07af-474c-b69c-a26b94dd4e26', 'EMP-24949X33');
    END IF;
END $$;

-- Handle equipment_maintenance_logs (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'equipment_maintenance_logs') THEN
        UPDATE equipment_maintenance_logs 
        SET completed_by = NULL 
        WHERE completed_by IN ('0bafc39e-07af-474c-b69c-a26b94dd4e26', 'EMP-24949X33');
    END IF;
END $$;

-- Handle equipment_maintenance_schedules (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'equipment_maintenance_schedules') THEN
        UPDATE equipment_maintenance_schedules 
        SET assigned_technician = NULL 
        WHERE assigned_technician IN ('0bafc39e-07af-474c-b69c-a26b94dd4e26', 'EMP-24949X33');
    END IF;
END $$;

-- 4. Now delete the specific employees
DELETE FROM employees 
WHERE id IN ('0bafc39e-07af-474c-b69c-a26b94dd4e26', 'EMP-24949X33');

-- 5. Verify the deletion
SELECT 
    'Employees after deletion:' as info;
    
SELECT 
    id,
    name,
    department,
    position,
    created_at
FROM employees
ORDER BY created_at;

-- 6. Confirm the target employee is still there
SELECT 
    'Target employee verification:' as info;
    
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Target employee found: ' || name
        ELSE '❌ Target employee not found!'
    END as status
FROM employees 
WHERE id = '6bc3ec06-8aa3-48a4-9ef2-6cc68ad9acef'; 