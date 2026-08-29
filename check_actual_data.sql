-- Check Actual Data in Tables
-- This will show us what data we're working with

-- Check equipment table
SELECT 
  'Equipment Table' as table_name,
  COUNT(*) as total_records
FROM equipment;

-- Check materials table
SELECT 
  'Materials Table' as table_name,
  COUNT(*) as total_records
FROM materials;

-- Show sample equipment data
SELECT 
  'Sample Equipment' as section,
  id,
  name,
  type,
  pm_class,
  is_pm
FROM equipment 
LIMIT 3;

-- Show sample materials data
SELECT 
  'Sample Materials' as section,
  id,
  name,
  type,
  quantity
FROM materials 
LIMIT 3;

-- Check if tables are completely empty
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM equipment) = 0 THEN 'Equipment table is EMPTY'
    ELSE 'Equipment table has ' || (SELECT COUNT(*) FROM equipment) || ' records'
  END as equipment_status;

SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM materials) = 0 THEN 'Materials table is EMPTY'
    ELSE 'Materials table has ' || (SELECT COUNT(*) FROM materials) || ' records'
  END as materials_status; 