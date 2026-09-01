-- Check and Fix Employees for PM System
-- This script will help resolve the technician_id foreign key issue

-- 1. Check current employees
SELECT 
    'Current employees in database:' as info;
    
SELECT 
    id,
    name,
    email,
    position,
    department,
    created_at
FROM employees 
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check if there are any employees at all
SELECT 
    'Total employee count:' as info;
    
SELECT COUNT(*) as total_employees FROM employees;

-- 3. If no employees exist, create a test employee for PM testing
-- (Uncomment and modify the email below if you need to create a test employee)
/*
INSERT INTO employees (id, name, email, position, department, phone, address, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'Test Technician',
    'your-email@example.com',  -- Replace with your actual email
    'Maintenance Technician',
    'Maintenance',
    '+966-50-123-4567',
    'Test Address, Riyadh, Saudi Arabia',
    NOW(),
    NOW()
);
*/

-- 4. Check the employees table structure
SELECT 
    'Employees table structure:' as info;
    
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'employees' 
ORDER BY ordinal_position;

-- 5. Check recent PM logs to see what technician_id values are being used
SELECT 
    'Recent PM logs with technician_id:' as info;
    
SELECT 
    id,
    equipment_id,
    technician_id,
    maintenance_class,
    safety_checks_passed,
    completed_date
FROM preventive_maintenance_logs 
WHERE checklist_completed = true
ORDER BY completed_date DESC
LIMIT 5;

-- 6. Check if any technician_id values in PM logs don't exist in employees table
SELECT 
    'PM logs with invalid technician_id:' as info;
    
SELECT DISTINCT
    pml.technician_id,
    pml.completed_date
FROM preventive_maintenance_logs pml
LEFT JOIN employees e ON pml.technician_id = e.id
WHERE pml.checklist_completed = true 
  AND e.id IS NULL
  AND pml.technician_id != 'unknown-technician'
ORDER BY pml.completed_date DESC; 