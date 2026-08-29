-- Check Preventive Maintenance Logs Table Structure
-- This script will help us understand the required fields

-- =====================================================
-- 1. CHECK TABLE STRUCTURE
-- =====================================================

-- Get all column names and constraints from the preventive_maintenance_logs table
SELECT 
    'PM Logs Table Structure' as info,
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN is_nullable = 'NO' THEN 'Required'
        ELSE 'Optional'
    END as requirement
FROM information_schema.columns
WHERE table_name = 'preventive_maintenance_logs'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- 2. CHECK SAMPLE DATA
-- =====================================================

-- Show sample data to understand the structure
SELECT 
    'Sample PM Logs Data' as info,
    id,
    equipment_id,
    maintenance_class,
    maintenance_type,
    preventive_type_id,
    scheduled_date,
    performed_date,
    status,
    technician_id,
    notes
FROM preventive_maintenance_logs
LIMIT 5;

-- =====================================================
-- 3. CHECK PREVENTIVE TYPES TABLE
-- =====================================================

-- Check if there's a preventive_types table
SELECT 
    'Preventive Types Table Check' as info,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'preventive_types'
        ) THEN '✅ Table exists'
        ELSE '❌ Table does not exist'
    END as table_status;

-- If table exists, show its structure
SELECT 
    'Preventive Types Structure' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'preventive_types'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show sample preventive types
SELECT 
    'Sample Preventive Types' as info,
    id,
    name,
    description
FROM preventive_types
LIMIT 10;

-- =====================================================
-- 4. CHECK FOREIGN KEY RELATIONSHIPS
-- =====================================================

-- Check foreign key constraints
SELECT 
    'Foreign Key Constraints' as info,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'preventive_maintenance_logs';

-- =====================================================
-- 5. SUGGESTED INSERT STATEMENT
-- =====================================================

-- Show what a valid insert statement should look like
SELECT 
    'Suggested PM Log Insert' as info,
    'Based on table structure, here is what we need to provide:' as note;

-- Get the required fields
SELECT 
    'Required Fields for PM Log Insert' as info,
    column_name,
    data_type,
    'Required' as requirement
FROM information_schema.columns
WHERE table_name = 'preventive_maintenance_logs'
  AND table_schema = 'public'
  AND is_nullable = 'NO'
  AND column_default IS NULL
ORDER BY ordinal_position;
