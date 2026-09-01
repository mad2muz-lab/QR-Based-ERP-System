-- Clean Employee Deletion Script
-- Delete only the two unwanted employees while keeping the specified one

-- Step 1: Remove references from PM logs
UPDATE preventive_maintenance_logs 
SET technician_id = NULL 
WHERE technician_id IN ('0bafc39e-07af-474c-b69c-a26b94dd4e26', 'EMP-24949X33');

-- Step 2: Delete the specific employees
DELETE FROM employees 
WHERE id IN ('0bafc39e-07af-474c-b69c-a26b94dd4e26', 'EMP-24949X33');

-- Step 3: Verify the result
SELECT 
    id,
    name,
    department,
    position
FROM employees
ORDER BY created_at; 