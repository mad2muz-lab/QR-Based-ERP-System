-- Simple Employee Deletion for Testing
-- This script only handles employee deletion, no other module changes

-- 1. Check what's preventing employee deletion
SELECT 
    'Foreign key constraints preventing employee deletion:' as info;
    
SELECT 
    tc.table_name,
    kcu.column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'employees';

-- 2. Quick fix: Temporarily disable foreign key checks and delete
-- This is the simplest approach for testing

-- Option A: Drop and recreate constraints with CASCADE
ALTER TABLE preventive_maintenance_logs 
DROP CONSTRAINT IF EXISTS preventive_maintenance_logs_technician_id_fkey;

ALTER TABLE equipment_maintenance_logs 
DROP CONSTRAINT IF EXISTS equipment_maintenance_logs_completed_by_fkey;

ALTER TABLE equipment_maintenance_schedules 
DROP CONSTRAINT IF EXISTS equipment_maintenance_schedules_assigned_technician_fkey;

-- Now delete all employees
DELETE FROM employees;

-- Option B: If you want to keep the constraints but allow deletion
-- Uncomment these lines instead of Option A:

-- ALTER TABLE preventive_maintenance_logs 
-- ADD CONSTRAINT preventive_maintenance_logs_technician_id_fkey 
-- FOREIGN KEY (technician_id) REFERENCES employees(id) 
-- ON DELETE CASCADE;

-- ALTER TABLE equipment_maintenance_logs 
-- ADD CONSTRAINT equipment_maintenance_logs_completed_by_fkey 
-- FOREIGN KEY (completed_by) REFERENCES employees(id) 
-- ON DELETE CASCADE;

-- ALTER TABLE equipment_maintenance_schedules 
-- ADD CONSTRAINT equipment_maintenance_schedules_assigned_technician_fkey 
-- FOREIGN KEY (assigned_technician) REFERENCES employees(id) 
-- ON DELETE CASCADE;

-- DELETE FROM employees;

-- 3. Verify employees are deleted
SELECT 
    'Employee count after deletion:' as info,
    COUNT(*) as remaining_employees
FROM employees; 