-- Delete All Employees for Fresh Start
-- This script will help you delete all employee records and related data
-- WARNING: This will permanently delete all employee data and related records

-- 1. First, let's see what tables reference employees
SELECT 
    'Tables that reference employees:' as info;
    
SELECT DISTINCT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column,
    rc.delete_rule
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
    AND ccu.table_name = 'employees'
ORDER BY tc.table_name;

-- 2. Check current employee count and related data
SELECT 
    'Current employee data summary:' as info;
    
SELECT 
    'Total Employees' as metric,
    COUNT(*) as count
FROM employees
UNION ALL
SELECT 
    'Employees with PM logs' as metric,
    COUNT(DISTINCT pml.technician_id) as count
FROM preventive_maintenance_logs pml
WHERE pml.technician_id IS NOT NULL
UNION ALL
SELECT 
    'Employees with equipment logs' as metric,
    COUNT(DISTINCT eml.completed_by) as count
FROM equipment_maintenance_logs eml
WHERE eml.completed_by IS NOT NULL
UNION ALL
SELECT 
    'Employees with maintenance schedules' as metric,
    COUNT(DISTINCT ems.assigned_technician) as count
FROM equipment_maintenance_schedules ems
WHERE ems.assigned_technician IS NOT NULL;

-- 3. OPTION 1: Quick Delete (CASCADE approach)
-- This will delete all employees and automatically handle related records
-- Uncomment the following lines to execute:

-- DELETE FROM employees;

-- 4. OPTION 2: Manual Cleanup (Safer approach)
-- This manually deletes related records first, then employees

-- Delete PM logs that reference employees
DELETE FROM preventive_maintenance_logs WHERE technician_id IS NOT NULL;

-- Delete equipment maintenance logs that reference employees
DELETE FROM equipment_maintenance_logs WHERE completed_by IS NOT NULL;

-- Delete equipment maintenance schedules that reference employees
DELETE FROM equipment_maintenance_schedules WHERE assigned_technician IS NOT NULL;

-- Delete any other employee-related records (add more as needed)
-- DELETE FROM other_table WHERE employee_id IS NOT NULL;

-- Finally delete all employees
DELETE FROM employees;

-- 5. Verify deletion
SELECT 
    'Verification after deletion:' as info;
    
SELECT 
    'Remaining Employees' as metric,
    COUNT(*) as count
FROM employees
UNION ALL
SELECT 
    'Remaining PM logs with technicians' as metric,
    COUNT(*) as count
FROM preventive_maintenance_logs
WHERE technician_id IS NOT NULL
UNION ALL
SELECT 
    'Remaining equipment logs with employees' as metric,
    COUNT(*) as count
FROM equipment_maintenance_logs
WHERE completed_by IS NOT NULL
UNION ALL
SELECT 
    'Remaining maintenance schedules with technicians' as metric,
    COUNT(*) as count
FROM equipment_maintenance_schedules
WHERE assigned_technician IS NOT NULL;

-- 6. Reset sequences if needed (for fresh IDs)
-- Uncomment if you want to reset auto-increment sequences:
-- ALTER SEQUENCE employees_id_seq RESTART WITH 1; 