-- Test 1: Check what's in preventive_maintenance_types
SELECT 'preventive_maintenance_types' as table_name, COUNT(*) as count FROM preventive_maintenance_types;

-- Test 2: Show all maintenance types
SELECT 
  id,
  maintenance_type,
  description,
  checklist_items,
  spare_part
FROM preventive_maintenance_types
ORDER BY maintenance_type;

-- Test 3: Check what's in preventive_maintenance_configs
SELECT 'preventive_maintenance_configs' as table_name, COUNT(*) as count FROM preventive_maintenance_configs;

-- Test 4: Show all configs
SELECT 
  id,
  equipment_type,
  maintenance_type_id,
  frequency_days,
  frequency_hours
FROM preventive_maintenance_configs
ORDER BY equipment_type;

-- Test 5: Check if there are any linked records
SELECT 
  pmt.maintenance_type,
  pmc.equipment_type,
  pmc.frequency_days,
  pmc.frequency_hours
FROM preventive_maintenance_types pmt
JOIN preventive_maintenance_configs pmc ON pmt.id = pmc.maintenance_type_id
ORDER BY pmc.equipment_type, pmt.maintenance_type; 