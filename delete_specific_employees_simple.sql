-- Simple Employee Deletion - Corrected
-- This script deletes only the two unwanted employees while keeping the specified one

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

-- 2. Remove references from PM logs (this is what's blocking deletion)
UPDATE preventive_maintenance_logs 
SET technician_id = NULL 
WHERE technician_id IN ('0bafc39e-07af-474c-b69c-a26b94dd4e26', 'EMP-24949X33');

-- 3. Now delete the specific employees
DELETE FROM employees 
WHERE id IN ('0bafc39e-07af-474c-b69c-a26b94dd4e26', 'EMP-24949X33');

-- 4. Verify the deletion
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

-- 5. Confirm the target employee is still there
SELECT 
    'Target employee verification:' as info;
    
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Target employee found: ' || MAX(name)
        ELSE '❌ Target employee not found!'
    END as status
FROM employees 
WHERE id = '6bc3ec06-8aa3-48a4-9ef2-6cc68ad9acef'; 