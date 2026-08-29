-- Check PM Configs Table Structure
-- This script checks what columns actually exist in the PM configs table

-- =====================================================
-- 1. CHECK TABLE STRUCTURE
-- =====================================================

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'preventive_maintenance_configs'
ORDER BY ordinal_position;

-- =====================================================
-- 2. CHECK SAMPLE DATA
-- =====================================================

SELECT 
    'Sample PM Configs Data' as section,
    *
FROM preventive_maintenance_configs
LIMIT 5;

-- =====================================================
-- 3. CHECK ALL PM CONFIGS
-- =====================================================

SELECT 
    'All PM Configs' as section,
    *
FROM preventive_maintenance_configs
ORDER BY equipment_type;

-- =====================================================
-- 4. CHECK BATCHPLANT CONFIGS
-- =====================================================

SELECT 
    'BatchPlant PM Configs' as section,
    *
FROM preventive_maintenance_configs
WHERE equipment_type LIKE '%BatchPlant%'
ORDER BY equipment_type; 