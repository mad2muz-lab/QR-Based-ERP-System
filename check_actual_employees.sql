-- Check Actual Employees in Database
-- This script will show you what employees actually exist in your employees table

-- 1. Check total employee count
SELECT 'Total Employees in Database:' as info;
SELECT COUNT(*) as total_employees FROM employees;

-- 2. Show all employees with their details
SELECT 'All Employees in Database:' as info;
SELECT 
  id,
  name,
  email,
  qr_code,
  department,
  position,
  phone,
  site,
  status,
  created_at
FROM employees 
ORDER BY created_at DESC;

-- 3. Show employees by position (which contains role information)
SELECT 'Employees by Position:' as info;
SELECT 
  name,
  position,
  qr_code,
  department
FROM employees 
ORDER BY name;

-- 4. Show unique positions in the system
SELECT 'Unique Positions in System:' as info;
SELECT DISTINCT position FROM employees ORDER BY position;

-- 6. Show unique departments
SELECT 'Unique Departments:' as info;
SELECT DISTINCT department FROM employees ORDER BY department; 