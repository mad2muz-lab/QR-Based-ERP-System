-- Check Equipment Maintenance Logs Table and RLS Status
-- Run this in your Supabase SQL Editor to diagnose the issue

-- 1. Check if the table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'equipment_maintenance_logs';

-- 2. Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'equipment_maintenance_logs'
ORDER BY ordinal_position;

-- 3. Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'equipment_maintenance_logs';

-- 4. Check existing RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'equipment_maintenance_logs'
ORDER BY policyname;

-- 5. Check current user authentication
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_user_role;

-- 6. Test if we can select from the table
SELECT COUNT(*) as record_count 
FROM equipment_maintenance_logs;

-- 7. Check if there are any constraints that might be blocking inserts
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'equipment_maintenance_logs'::regclass; 