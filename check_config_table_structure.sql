-- Check the actual column names in preventive_maintenance_configs table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'preventive_maintenance_configs'
ORDER BY ordinal_position;

-- Show sample data to understand the structure
SELECT * FROM preventive_maintenance_configs LIMIT 3; 