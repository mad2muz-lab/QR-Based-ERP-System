-- Comprehensive check of preventive_maintenance_types table structure and data
-- This will help us identify the correct column name for maintenance classes

-- 1. Check table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'preventive_maintenance_types'
ORDER BY ordinal_position;

-- 2. Check existing data in the table
SELECT * FROM preventive_maintenance_types LIMIT 10;

-- 3. Check if there are any PM types that match our maintenance classes
-- We'll try different possible column names
SELECT * FROM preventive_maintenance_types
WHERE id LIKE '%Class%' OR id LIKE '%A%' OR id LIKE '%B%' OR id LIKE '%C%';

-- 4. Check all columns for any values containing 'Class'
SELECT 
    id,
    CASE 
        WHEN id::text LIKE '%Class%' THEN 'id contains Class'
        ELSE 'id does not contain Class'
    END as id_check,
    CASE 
        WHEN type::text LIKE '%Class%' THEN 'type contains Class'
        ELSE 'type does not contain Class'
    END as type_check,
    CASE 
        WHEN maintenance_class::text LIKE '%Class%' THEN 'maintenance_class contains Class'
        ELSE 'maintenance_class does not contain Class'
    END as maintenance_class_check,
    CASE 
        WHEN name::text LIKE '%Class%' THEN 'name contains Class'
        ELSE 'name does not contain Class'
    END as name_check
FROM preventive_maintenance_types
LIMIT 5;

-- 5. Show all distinct values in each column to understand the data structure
SELECT 'id' as column_name, id as value FROM preventive_maintenance_types
UNION ALL
SELECT 'type' as column_name, type as value FROM preventive_maintenance_types
UNION ALL
SELECT 'maintenance_class' as column_name, maintenance_class as value FROM preventive_maintenance_types
UNION ALL
SELECT 'name' as column_name, name as value FROM preventive_maintenance_types
ORDER BY column_name, value;
