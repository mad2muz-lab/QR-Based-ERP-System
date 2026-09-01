-- Fix QR Scanner Employee IDs
-- This script will help identify what employee IDs exist in the database

-- Check if employees table exists and has data
SELECT 
  'Employees Table Status:' as info,
  COUNT(*) as total_employees,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_employees
FROM employees;

-- Show all employees with their actual IDs
SELECT 
  'All Employees:' as info,
  id,
  name,
  position,
  department,
  status,
  custom_id,
  qr_code
FROM employees 
ORDER BY name;

-- Show only active employees for QR testing
SELECT 
  'Active Employees for QR Testing:' as info,
  id,
  name,
  position,
  department,
  custom_id,
  qr_code
FROM employees 
WHERE status = 'active'
ORDER BY name;

-- Check if there are any employees with custom_id or qr_code
SELECT 
  'Employees with Custom IDs or QR Codes:' as info,
  COUNT(CASE WHEN custom_id IS NOT NULL THEN 1 END) as with_custom_id,
  COUNT(CASE WHEN qr_code IS NOT NULL THEN 1 END) as with_qr_code
FROM employees;

-- Show sample employee data for QR testing
SELECT 
  'Sample Employee for QR Testing:' as info,
  id as system_id,
  name,
  position,
  department,
  status
FROM employees 
WHERE status = 'active'
ORDER BY name
LIMIT 1; 