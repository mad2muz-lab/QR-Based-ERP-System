-- Fix Employee Deletion Constraint Issue
-- This script provides multiple solutions for handling employee deletion
-- when they are referenced in preventive_maintenance_logs

-- OPTION 1: Set CASCADE DELETE (Recommended for testing/development)
-- This will automatically delete PM logs when an employee is deleted
-- WARNING: This will permanently delete all PM logs associated with the employee

-- 1. Drop the existing foreign key constraint
ALTER TABLE preventive_maintenance_logs 
DROP CONSTRAINT IF EXISTS preventive_maintenance_logs_technician_id_fkey;

-- 2. Recreate the constraint with CASCADE DELETE
ALTER TABLE preventive_maintenance_logs 
ADD CONSTRAINT preventive_maintenance_logs_technician_id_fkey 
FOREIGN KEY (technician_id) REFERENCES employees(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- OPTION 2: Set NULL on DELETE (Alternative approach)
-- This will set technician_id to NULL when an employee is deleted
-- Keeps PM logs but removes technician reference

-- Uncomment the following lines if you prefer this approach:
-- ALTER TABLE preventive_maintenance_logs 
-- DROP CONSTRAINT IF EXISTS preventive_maintenance_logs_technician_id_fkey;
-- 
-- ALTER TABLE preventive_maintenance_logs 
-- ADD CONSTRAINT preventive_maintenance_logs_technician_id_fkey 
-- FOREIGN KEY (technician_id) REFERENCES employees(id) 
-- ON DELETE SET NULL ON UPDATE CASCADE;

-- OPTION 3: Manual cleanup before deletion (Safest approach)
-- This script helps you manually handle the deletion process

-- 3. Check which employees you want to delete and their PM log count
SELECT 
    'Employees with PM logs (check before deletion):' as info;
    
SELECT 
    e.id,
    e.name,
    e.custom_employee_id,
    COUNT(pml.id) as pm_logs_count,
    CASE 
        WHEN COUNT(pml.id) > 0 THEN '⚠️ Has PM logs - deletion will affect ' || COUNT(pml.id) || ' records'
        ELSE '✅ Safe to delete'
    END as deletion_status
FROM employees e
LEFT JOIN preventive_maintenance_logs pml ON e.id = pml.technician_id
GROUP BY e.id, e.name, e.custom_employee_id
ORDER BY pm_logs_count DESC;

-- 4. If you want to manually delete PM logs for a specific employee first:
-- Replace 'EMPLOYEE_ID_HERE' with the actual employee ID you want to delete
-- DELETE FROM preventive_maintenance_logs WHERE technician_id = 'EMPLOYEE_ID_HERE';

-- 5. Verify the constraint is properly set
SELECT 
    'Updated foreign key constraint:' as info;
    
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'preventive_maintenance_logs'
    AND kcu.column_name = 'technician_id'; 