-- Check Employees Table Structure
-- This will show the exact column names and data types

-- Check column names and data types
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'employees'
ORDER BY ordinal_position;

-- Check if specific columns exist
SELECT 
  'Column Check:' as info,
  COUNT(CASE WHEN column_name = 'id' THEN 1 END) as has_id,
  COUNT(CASE WHEN column_name = 'custom_id' THEN 1 END) as has_custom_id,
  COUNT(CASE WHEN column_name = 'qr_code' THEN 1 END) as has_qr_code,
  COUNT(CASE WHEN column_name = 'name' THEN 1 END) as has_name,
  COUNT(CASE WHEN column_name = 'position' THEN 1 END) as has_position,
  COUNT(CASE WHEN column_name = 'department' THEN 1 END) as has_department,
  COUNT(CASE WHEN column_name = 'status' THEN 1 END) as has_status
FROM information_schema.columns 
WHERE table_name = 'employees';

-- Show sample employee data to understand the ID format
SELECT 
  'Sample Employee Data:' as info,
  id,
  name,
  position,
  department,
  status
FROM employees 
LIMIT 3; 