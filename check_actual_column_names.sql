-- Check Actual Equipment Table Column Names
-- This script will help us understand the current database structure

-- =====================================================
-- 1. CHECK CURRENT TABLE STRUCTURE
-- =====================================================

-- Get all column names from the equipment table
SELECT 
    'Current Equipment Table Columns' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'equipment'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- 2. CHECK SAMPLE DATA
-- =====================================================

-- Show sample data to understand the structure
SELECT 
    'Sample Equipment Data' as info,
    id,
    "Equipment Name" as equipment_name,
    "Equipment Type" as equipment_type,
    model,
    site,
    status,
    is_pm
FROM equipment
LIMIT 5;

-- =====================================================
-- 3. CHECK PM CONFIGURATION LINKING
-- =====================================================

-- Test PM configuration linking with actual column names
SELECT 
    'PM Configuration Linking Test' as info,
    e."Equipment Name" as equipment_name,
    e."Equipment Type" as equipment_type,
    pmc.equipment_type as pm_config_type,
    CASE
        WHEN e."Equipment Type" = pmc.equipment_type THEN '✅ Linked'
        ELSE '❌ Not Linked'
    END as linking_status
FROM equipment e
LEFT JOIN preventive_maintenance_configs pmc ON e."Equipment Type" = pmc.equipment_type
LIMIT 10;

-- =====================================================
-- 4. COUNT EQUIPMENT BY TYPE
-- =====================================================

-- Count equipment by type to understand distribution
SELECT 
    'Equipment Count by Type' as info,
    "Equipment Type" as equipment_type,
    COUNT(*) as count
FROM equipment
GROUP BY "Equipment Type"
ORDER BY count DESC;

-- =====================================================
-- 5. CHECK PM ENROLLMENT STATUS
-- =====================================================

-- Check current PM enrollment status
SELECT 
    'PM Enrollment Status' as info,
    COUNT(*) as total_equipment,
    COUNT(CASE WHEN is_pm = true THEN 1 END) as enrolled_in_pm,
    COUNT(CASE WHEN is_pm = false OR is_pm IS NULL THEN 1 END) as not_enrolled
FROM equipment;

-- =====================================================
-- 6. VERIFY COLUMN NAMES FOR MIGRATION
-- =====================================================

-- Check if we need to rename columns or if they already exist
SELECT 
    'Column Name Verification' as info,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'equipment' 
            AND column_name = 'Equipment Name'
        ) THEN '✅ "Equipment Name" exists'
        ELSE '❌ "Equipment Name" missing'
    END as equipment_name_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'equipment' 
            AND column_name = 'Equipment Type'
        ) THEN '✅ "Equipment Type" exists'
        ELSE '❌ "Equipment Type" missing'
    END as equipment_type_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'equipment' 
            AND column_name = 'equipment_name'
        ) THEN '✅ equipment_name exists (new format)'
        ELSE '❌ equipment_name missing (new format)'
    END as new_equipment_name_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'equipment' 
            AND column_name = 'equipment_type'
        ) THEN '✅ equipment_type exists (new format)'
        ELSE '❌ equipment_type missing (new format)'
    END as new_equipment_type_status;
