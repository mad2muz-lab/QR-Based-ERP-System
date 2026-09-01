-- Diagnose PM Configurations
-- This script checks what PM configs exist and how they relate to equipment

-- =====================================================
-- 1. CHECK ALL PM CONFIGS
-- =====================================================

SELECT 
    'All PM Configs' as section,
    equipment_type,
    pm_class,
    frequency_days,
    frequency_hours,
    description
FROM preventive_maintenance_configs
ORDER BY equipment_type, pm_class;

-- =====================================================
-- 2. CHECK EQUIPMENT TYPES
-- =====================================================

SELECT 
    'Equipment Types' as section,
    type,
    COUNT(*) as equipment_count,
    COUNT(CASE WHEN is_pm = true THEN 1 END) as enrolled_count
FROM equipment
GROUP BY type
ORDER BY type;

-- =====================================================
-- 3. CHECK EQUIPMENT TYPE MATCHING
-- =====================================================

SELECT 
    'Equipment Type Matching' as section,
    e.type as equipment_type,
    pmc.equipment_type as config_type,
    pmc.pm_class,
    COUNT(e.id) as equipment_count,
    COUNT(CASE WHEN e.is_pm = true THEN 1 END) as enrolled_count
FROM equipment e
LEFT JOIN preventive_maintenance_configs pmc ON e.type = pmc.equipment_type
GROUP BY e.type, pmc.equipment_type, pmc.pm_class
ORDER BY e.type, pmc.pm_class;

-- =====================================================
-- 4. CHECK BATCHPLANT SPECIFICALLY
-- =====================================================

SELECT 
    'BatchPlant Equipment Details' as section,
    name,
    type,
    is_pm,
    pm_class,
    pm_frequency_days,
    pm_cost_estimate
FROM equipment
WHERE name LIKE '%BatchPlant%'
ORDER BY name;

-- =====================================================
-- 5. CHECK BATCHPLANT PM CONFIGS
-- =====================================================

SELECT 
    'BatchPlant PM Configs' as section,
    equipment_type,
    pm_class,
    frequency_days,
    frequency_hours,
    description
FROM preventive_maintenance_configs
WHERE equipment_type LIKE '%BatchPlant%'
ORDER BY pm_class; 