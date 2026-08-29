-- Check the actual schema of preventive_maintenance_configs table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'preventive_maintenance_configs' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if table exists and has data
SELECT 
    'Table exists' as check_type,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'preventive_maintenance_configs'
        AND table_schema = 'public'
    ) as table_exists;

-- Count records
SELECT 
    'Record count' as check_type,
    COUNT(*) as count
FROM preventive_maintenance_configs;

-- Show sample data
SELECT 
    'Sample data' as check_type,
    id,
    equipment_type,
    maintenance_class,
    maintenance_type,
    interval_hours,
    interval_days,
    description
FROM preventive_maintenance_configs 
LIMIT 3; 