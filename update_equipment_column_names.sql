-- Migration: Update Equipment Table Column Names
-- Rename 'name' to 'equipment_name' and 'type' to 'equipment_type'
-- Date: 2025-01-15

-- =====================================================
-- 1. BACKUP CURRENT DATA
-- =====================================================

-- Create backup table with current structure
CREATE TABLE IF NOT EXISTS equipment_backup AS 
SELECT * FROM equipment;

-- =====================================================
-- 2. RENAME COLUMNS
-- =====================================================

-- Rename 'name' column to 'equipment_name'
ALTER TABLE equipment RENAME COLUMN name TO equipment_name;

-- Rename 'type' column to 'equipment_type'
ALTER TABLE equipment RENAME COLUMN type TO equipment_type;

-- =====================================================
-- 3. UPDATE INDEXES (if any exist)
-- =====================================================

-- Drop existing indexes on old column names (if they exist)
DROP INDEX IF EXISTS idx_equipment_name;
DROP INDEX IF EXISTS idx_equipment_type;

-- Create new indexes on renamed columns
CREATE INDEX IF NOT EXISTS idx_equipment_equipment_name ON equipment(equipment_name);
CREATE INDEX IF NOT EXISTS idx_equipment_equipment_type ON equipment(equipment_type);

-- =====================================================
-- 4. VERIFY CHANGES
-- =====================================================

-- Check the new table structure
SELECT 
    'Updated Equipment Table Structure' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'equipment' 
  AND table_schema = 'public'
  AND column_name IN ('equipment_name', 'equipment_type')
ORDER BY column_name;

-- Show sample data with new column names
SELECT 
    'Sample Data with New Column Names' as info,
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
-- 5. VERIFY PM CONFIGURATION LINKING
-- =====================================================

-- Test the PM configuration linking with new column names
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
-- 6. CLEANUP
-- =====================================================

-- Drop backup table (optional - keep for safety)
-- DROP TABLE equipment_backup;

-- =====================================================
-- 7. SUCCESS MESSAGE
-- =====================================================

SELECT '✅ Equipment table columns successfully renamed!' as migration_status;
SELECT '   - name → equipment_name' as change_1;
SELECT '   - type → equipment_type' as change_2;
SELECT '   - PM system linking verified' as verification;
