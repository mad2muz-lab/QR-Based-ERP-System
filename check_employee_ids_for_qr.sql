-- Check available employee IDs for QR scanning testing
-- This will help identify what employee IDs can be used for testing the QR scanner

-- Check all employees with their IDs
SELECT 
  id,
  custom_id,
  qr_code,
  name,
  position,
  department,
  status,
  CASE 
    WHEN status = 'active' THEN '✅ Available for QR scan'
    ELSE '❌ Not available (inactive)'
  END as availability_status
FROM employees 
ORDER BY name;

-- Check employee ID formats for QR testing
SELECT 
  'Available Employee IDs for QR Testing:' as info,
  COUNT(*) as total_employees,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_employees
FROM employees;

-- Show sample employee IDs that can be used for QR testing
SELECT 
  'Sample Employee IDs for QR Testing:' as info,
  id as system_id,
  custom_id,
  qr_code,
  name,
  position
FROM employees 
WHERE status = 'active'
ORDER BY name
LIMIT 5;

-- Check if there are any employees with custom_id or qr_code fields
SELECT 
  'Employees with Custom IDs or QR Codes:' as info,
  COUNT(CASE WHEN custom_id IS NOT NULL THEN 1 END) as with_custom_id,
  COUNT(CASE WHEN qr_code IS NOT NULL THEN 1 END) as with_qr_code,
  COUNT(CASE WHEN custom_id IS NOT NULL OR qr_code IS NOT NULL THEN 1 END) as with_any_alt_id
FROM employees; 