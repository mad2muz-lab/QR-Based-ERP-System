-- Complete Materials Table Structure Check
-- This will show us all columns to fix the sample data script

-- Show ALL columns in materials table
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'materials'
ORDER BY ordinal_position;

-- Show sample data to understand the structure
SELECT * FROM materials LIMIT 3;

-- Check if there's a category or type column
SELECT 
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'materials' 
  AND (column_name ILIKE '%category%' OR column_name ILIKE '%type%' OR column_name ILIKE '%group%')
ORDER BY column_name; 