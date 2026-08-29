-- Check if purchase_requests table exists
-- Run this script to verify the purchase_requests table exists

-- Check if the table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'purchase_requests'
) as table_exists;

-- If the table doesn't exist, run the migration:
-- supabase/migrations/20250128000000_add_departments_table.sql

-- Check if the table has the correct structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'purchase_requests'
ORDER BY ordinal_position;

-- Check if there are any existing purchase requests
SELECT COUNT(*) as existing_requests FROM purchase_requests;

-- Check if the departments table exists (required for foreign key)
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'departments'
) as departments_table_exists;

-- Check if the sites table exists (required for foreign key)
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'sites'
) as sites_table_exists;
