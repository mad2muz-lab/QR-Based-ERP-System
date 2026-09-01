-- Delete Specific Employee Only
-- Delete only the employee with ID 6bc3ec06-8aa3-48a4-9ef2-6cc68ad9acef

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

-- Step 2: Remove references from PM logs for this specific employee
UPDATE preventive_maintenance_logs 
SET technician_id = NULL 
WHERE technician_id = '6bc3ec06-8aa3-48a4-9ef2-6cc68ad9acef';

-- Step 3: Delete only this specific employee
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