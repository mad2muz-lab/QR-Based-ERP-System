-- Check what employee IDs actually exist in the database
-- This will help us use real employee IDs for QR testing

-- Show all employees with their IDs
SELECT 
  id,
  name,
  position,
  department,
  status,
  custom_id,
  qr_code
FROM employees 
ORDER BY name;

-- Count total employees
SELECT 
  'Total Employees:' as info,
  COUNT(*) as count
FROM employees;

-- Count active employees
SELECT 
  'Active Employees:' as info,
  COUNT(*) as count
FROM employees 
WHERE status = 'active';

-- Show first 5 active employees for testing
SELECT 
  'Sample Active Employees for QR Testing:' as info,
  id,
  name,
  position,
  department
FROM employees 
WHERE status = 'active'
ORDER BY name
LIMIT 5; 