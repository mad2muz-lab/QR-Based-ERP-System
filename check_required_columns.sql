-- Check Required Columns for Equipment and Materials Tables
-- This script will show all NOT NULL columns that need to be included in INSERT statements

-- 1. Check Equipment table structure and NOT NULL constraints
SELECT 
  'EQUIPMENT TABLE' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'equipment' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check Materials table structure and NOT NULL constraints
SELECT 
  'MATERIALS TABLE' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'materials' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Show only NOT NULL columns for Equipment (required for INSERT)
SELECT 
  'EQUIPMENT - REQUIRED COLUMNS' as info,
  string_agg(column_name, ', ' ORDER BY ordinal_position) as required_columns
FROM information_schema.columns 
WHERE table_name = 'equipment' 
  AND table_schema = 'public'
  AND is_nullable = 'NO';

-- 4. Show only NOT NULL columns for Materials (required for INSERT)
SELECT 
  'MATERIALS - REQUIRED COLUMNS' as info,
  string_agg(column_name, ', ' ORDER BY ordinal_position) as required_columns
FROM information_schema.columns 
WHERE table_name = 'materials' 
  AND table_schema = 'public'
  AND is_nullable = 'NO';

-- 5. Show sample data structure for Equipment
SELECT 
  'EQUIPMENT SAMPLE DATA STRUCTURE' as info,
  column_name,
  data_type,
  CASE 
    WHEN data_type = 'character varying' THEN 'VARCHAR'
    WHEN data_type = 'timestamp with time zone' THEN 'TIMESTAMP'
    WHEN data_type = 'boolean' THEN 'BOOLEAN'
    WHEN data_type = 'numeric' THEN 'DECIMAL'
    ELSE data_type
  END as simplified_type
FROM information_schema.columns 
WHERE table_name = 'equipment' 
  AND table_schema = 'public'
  AND is_nullable = 'NO'
ORDER BY ordinal_position;

-- 6. Show sample data structure for Materials
SELECT 
  'MATERIALS SAMPLE DATA STRUCTURE' as info,
  column_name,
  data_type,
  CASE 
    WHEN data_type = 'character varying' THEN 'VARCHAR'
    WHEN data_type = 'timestamp with time zone' THEN 'TIMESTAMP'
    WHEN data_type = 'boolean' THEN 'BOOLEAN'
    WHEN data_type = 'numeric' THEN 'DECIMAL'
    ELSE data_type
  END as simplified_type
FROM information_schema.columns 
WHERE table_name = 'materials' 
  AND table_schema = 'public'
  AND is_nullable = 'NO'
ORDER BY ordinal_position;

-- 7. Check if tables exist and have data
SELECT 
  'TABLE STATUS' as info,
  'equipment' as table_name,
  COUNT(*) as record_count
FROM equipment
UNION ALL
SELECT 
  'TABLE STATUS' as info,
  'materials' as table_name,
  COUNT(*) as record_count
FROM materials; 