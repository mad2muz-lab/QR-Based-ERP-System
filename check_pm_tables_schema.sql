-- Check PM Tables Schema
-- This script will show you the current structure of all PM-related tables

-- 1. Check equipment table schema (main equipment table)
SELECT 
    'equipment' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'equipment' 
ORDER BY ordinal_position;

-- 2. Check preventive_maintenance_configs table schema
SELECT 
    'preventive_maintenance_configs' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'preventive_maintenance_configs' 
ORDER BY ordinal_position;

-- 3. Check preventive_maintenance_logs table schema
SELECT 
    'preventive_maintenance_logs' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'preventive_maintenance_logs' 
ORDER BY ordinal_position;

-- 4. Check if any other PM-related tables exist
SELECT 
    table_name,
    'PM-related table found' as status
FROM information_schema.tables 
WHERE table_name LIKE '%pm%' 
   OR table_name LIKE '%maintenance%'
   OR table_name LIKE '%preventive%'
ORDER BY table_name;

-- 5. Check sample data from each table (first 3 rows)
SELECT 'equipment' as table_name, 'Sample data:' as info;
SELECT id, name, type, is_pm, pm_class, pm_frequency_hours, usage_duration 
FROM equipment 
WHERE is_pm = true 
LIMIT 3;

SELECT 'preventive_maintenance_configs' as table_name, 'Sample data:' as info;
SELECT * FROM preventive_maintenance_configs LIMIT 3;

SELECT 'preventive_maintenance_logs' as table_name, 'Sample data:' as info;
SELECT * FROM preventive_maintenance_logs LIMIT 3; 