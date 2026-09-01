-- Check Movement Table Schema
-- This script will help identify the exact schema mismatch

-- 1. Check if the table exists and get column details
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'resource_movement_requests'
ORDER BY ordinal_position;

-- 2. Check table constraints
SELECT
  tc.constraint_name,
  tc.constraint_type,
  ccu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'resource_movement_requests';

-- 3. Check if there are any sample records to understand the structure
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'resource_movement_requests'
  AND column_name IN ('crew_members', 'equipment_list', 'materials_list', 'vehicles_list'); 