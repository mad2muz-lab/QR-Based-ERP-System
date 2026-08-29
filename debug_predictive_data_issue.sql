-- Debug Predictive Data Issue
-- This script will help us understand why the sample data isn't being created

-- 1. Check what equipment we have enrolled in PM
SELECT 
  'PM Equipment' as section,
  COUNT(*) as count,
  STRING_AGG(pm_class, ', ') as pm_classes
FROM equipment 
WHERE is_pm = true;

-- 2. Check what materials we have
SELECT 
  'Materials' as section,
  COUNT(*) as count,
  STRING_AGG(type, ', ') as types
FROM materials;

-- 3. Check if we have any materials with type 'Spare Parts'
SELECT 
  'Spare Parts Materials' as section,
  COUNT(*) as count,
  STRING_AGG(name, ', ') as names
FROM materials 
WHERE type = 'Spare Parts';

-- 4. Check the cross join result
SELECT 
  'Cross Join Test' as section,
  COUNT(*) as total_combinations,
  COUNT(CASE WHEN e.is_pm = true THEN 1 END) as pm_equipment,
  COUNT(CASE WHEN m.type = 'Spare Parts' THEN 1 END) as spare_parts_materials,
  COUNT(CASE WHEN e.is_pm = true AND m.type = 'Spare Parts' THEN 1 END) as valid_combinations
FROM equipment e
CROSS JOIN materials m;

-- 5. Show sample equipment and materials
SELECT 
  'Sample Equipment' as section,
  id,
  name,
  type,
  pm_class,
  is_pm
FROM equipment 
WHERE is_pm = true
LIMIT 5;

SELECT 
  'Sample Materials' as section,
  id,
  name,
  type,
  quantity
FROM materials 
LIMIT 5; 