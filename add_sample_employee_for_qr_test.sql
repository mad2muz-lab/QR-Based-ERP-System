-- Add Sample Employee for QR Testing
-- This script will add a test employee if the table is empty

-- First check if we have any employees
SELECT 
  'Current Employee Count:' as info,
  COUNT(*) as total_employees
FROM employees;

-- If no employees exist, add a sample one for QR testing
INSERT INTO employees (
  id,
  name,
  position,
  department,
  status,
  custom_id,
  qr_code,
  site,
  created_at,
  updated_at
) 
SELECT 
  'test-employee-001',
  'Test Driver',
  'Driver',
  'Logistics',
  'active',
  'EMP-001',
  'QR-001',
  'Main Site',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM employees WHERE status = 'active'
);

-- Show the added employee
SELECT 
  'Sample Employee Added:' as info,
  id,
  name,
  position,
  department,
  status,
  custom_id,
  qr_code
FROM employees 
WHERE id = 'test-employee-001';

-- Show all active employees for QR testing
SELECT 
  'All Active Employees for QR Testing:' as info,
  id,
  name,
  position,
  department,
  custom_id,
  qr_code
FROM employees 
WHERE status = 'active'
ORDER BY name; 