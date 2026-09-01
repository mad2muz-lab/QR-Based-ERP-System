-- Delete Last Remaining Employee
-- Delete the employee with ID 6bc3ec06-8aa3-48a4-9ef2-6cc68ad9acef

-- Step 1: Check current employees
SELECT 
    'Current employees before deletion:' as info;
    
SELECT 
    id,
    name,
    department,
    position
FROM employees
ORDER BY created_at;

-- Step 2: Remove references from PM logs
UPDATE preventive_maintenance_logs 
SET technician_id = NULL 
WHERE technician_id = '6bc3ec06-8aa3-48a4-9ef2-6cc68ad9acef';

-- Step 3: Delete the employee
DELETE FROM employees 
WHERE id = '6bc3ec06-8aa3-48a4-9ef2-6cc68ad9acef';

-- Step 4: Verify the result
SELECT 
    'Employees after deletion:' as info;
    
SELECT 
    id,
    name,
    department,
    position
FROM employees
ORDER BY created_at;

-- Step 5: Confirm all employees are deleted
SELECT 
    'Total employees remaining:' as info,
    COUNT(*) as employee_count
FROM employees; 