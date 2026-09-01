-- Delete Specific Employees - Keep One
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

-- 2. Delete the two specific employees
-- Employee 1: 0bafc39e-07af-474c-b69c-a26b94dd4e26 (Test Subject)
-- Employee 2: EMP-24949X33 (Mohammed)

-- First, handle any foreign key constraints by setting references to NULL
UPDATE preventive_maintenance_logs 
SET technician_id = NULL 
WHERE technician_id IN ('0bafc39e-07af-474c-b69c-a26b94dd4e26', 'EMP-24949X33');

UPDATE equipment_maintenance_logs 
SET completed_by = NULL 
WHERE completed_by IN ('0bafc39e-07af-474c-b69c-a26b94dd4e26', 'EMP-24949X33');

UPDATE equipment_maintenance_schedules 
SET assigned_technician = NULL 
WHERE assigned_technician IN ('0bafc39e-07af-474c-b69c-a26b94dd4e26', 'EMP-24949X33');

-- Now delete the specific employees
DELETE FROM employees 
WHERE id IN ('0bafc39e-07af-474c-b69c-a26b94dd4e26', 'EMP-24949X33');

-- 3. Verify the deletion
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

-- 4. Confirm the target employee is still there
SELECT 
    'Target employee verification:' as info;
    
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Target employee found: ' || name
        ELSE '❌ Target employee not found!'
    END as status
FROM employees 
WHERE id = '6bc3ec06-8aa3-48a4-9ef2-6cc68ad9acef'; 