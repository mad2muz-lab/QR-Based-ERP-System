-- Check Foreign Key Constraints on preventive_maintenance_logs table
-- This script will help diagnose and fix the employee deletion issue

-- 1. Check current foreign key constraints
SELECT 
    'Current Foreign Key Constraints on preventive_maintenance_logs:' as info;
    
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
    AND tc.table_name = 'preventive_maintenance_logs';

-- 2. Check which employees are referenced in PM logs
SELECT 
    'Employees referenced in PM logs:' as info;
    
SELECT DISTINCT
    e.id as employee_id,
    e.name as employee_name,
    e.custom_employee_id,
    COUNT(pml.id) as pm_logs_count
FROM employees e
JOIN preventive_maintenance_logs pml ON e.id = pml.technician_id
GROUP BY e.id, e.name, e.custom_employee_id
ORDER BY pm_logs_count DESC;

-- 3. Show sample PM logs with technician references
SELECT 
    'Sample PM logs with technician references:' as info;
    
SELECT 
    pml.id,
    pml.equipment_id,
    pml.technician_id,
    e.name as technician_name,
    pml.maintenance_class,
    pml.scheduled_date,
    pml.status
FROM preventive_maintenance_logs pml
LEFT JOIN employees e ON pml.technician_id = e.id
WHERE pml.technician_id IS NOT NULL
ORDER BY pml.scheduled_date DESC
LIMIT 10; 