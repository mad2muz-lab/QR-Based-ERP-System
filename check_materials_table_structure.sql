-- Check Materials Table Structure
-- This script will show us what columns actually exist in the materials table

-- Show all columns in materials table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'materials'
ORDER BY ordinal_position;

-- Show sample data from materials table
SELECT * FROM materials LIMIT 5;

-- Check if there's a quantity or stock related column
SELECT 
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'materials' 
  AND (column_name ILIKE '%quantity%' OR column_name ILIKE '%stock%' OR column_name ILIKE '%amount%')
ORDER BY column_name; 