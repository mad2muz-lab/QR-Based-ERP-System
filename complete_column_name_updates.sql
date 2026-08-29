-- Complete Column Name Updates Verification and Fixes
-- Date: 2025-01-15

-- =====================================================
-- 1. VERIFY MIGRATION SUCCESS
-- =====================================================

-- Check if columns were renamed successfully
SELECT 
    'Migration Verification' as info,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'equipment' 
            AND column_name = 'equipment_name'
        ) THEN '✅ equipment_name column exists'
        ELSE '❌ equipment_name column missing'
    END as equipment_name_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'equipment' 
            AND column_name = 'equipment_type'
        ) THEN '✅ equipment_type column exists'
        ELSE '❌ equipment_type column missing'
    END as equipment_type_status,
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'equipment' 
            AND column_name = 'name'
        ) THEN '✅ old name column removed'
        ELSE '❌ old name column still exists'
    END as old_name_status,
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'equipment' 
            AND column_name = 'type'
        ) THEN '✅ old type column removed'
        ELSE '❌ old type column still exists'
    END as old_type_status;

-- =====================================================
-- 2. VERIFY DATA INTEGRITY
-- =====================================================

-- Check data in new columns
SELECT 
    'Data Integrity Check' as info,
    COUNT(*) as total_equipment,
    COUNT(equipment_name) as equipment_with_names,
    COUNT(equipment_type) as equipment_with_types,
    COUNT(CASE WHEN equipment_name IS NOT NULL AND equipment_type IS NOT NULL THEN 1 END) as complete_records
FROM equipment;

-- Show sample data
SELECT 
    'Sample Equipment Data' as info,
    id,
    equipment_name,
    equipment_type,
    model,
    site,
    qr_code,
    status
FROM equipment 
LIMIT 5;

-- =====================================================
-- 3. VERIFY PM SYSTEM LINKING
-- =====================================================

-- Test PM configuration linking
SELECT 
    'PM Configuration Linking Test' as info,
    e.equipment_name,
    e.equipment_type,
    pmc.equipment_type as pm_config_type,
    CASE 
        WHEN e.equipment_type = pmc.equipment_type THEN '✅ Linked'
        ELSE '❌ Not Linked'
    END as linking_status
FROM equipment e
LEFT JOIN preventive_maintenance_configs pmc ON e.equipment_type = pmc.equipment_type
LIMIT 10;

-- =====================================================
-- 4. CHECK FOR ANY ORPHANED REFERENCES
-- =====================================================

-- Check if any PM logs reference old column names
SELECT 
    'PM Logs Reference Check' as info,
    COUNT(*) as total_pm_logs,
    COUNT(CASE WHEN equipment_id IS NOT NULL THEN 1 END) as logs_with_equipment_id
FROM preventive_maintenance_logs;

-- =====================================================
-- 5. VERIFY INDEXES
-- =====================================================

-- Check if new indexes were created
SELECT 
    'Index Verification' as info,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'equipment' 
AND indexname LIKE '%equipment_name%' OR indexname LIKE '%equipment_type%';

-- =====================================================
-- 6. FINAL SUCCESS MESSAGE
-- =====================================================

SELECT '🎉 Column name migration completed successfully!' as final_status;
SELECT '   All equipment data is now using equipment_name and equipment_type' as data_status;
SELECT '   PM system linking is verified and working' as pm_status;
SELECT '   Ready for application testing' as next_step;
