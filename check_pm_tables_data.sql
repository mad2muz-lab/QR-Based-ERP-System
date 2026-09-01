-- Check preventive_maintenance_types table
SELECT 'preventive_maintenance_types' as table_name, COUNT(*) as row_count FROM preventive_maintenance_types;

-- Show all maintenance types
SELECT 
  id,
  name,
  description,
  maintenance_type,
  checklist_items,
  spare_part,
  created_at
FROM preventive_maintenance_types
ORDER BY name;

-- Check preventive_maintenance_configs table
SELECT 'preventive_maintenance_configs' as table_name, COUNT(*) as row_count FROM preventive_maintenance_configs;

-- Show all maintenance configs
SELECT 
  id,
  equipment_type,
  maintenance_type_id,
  frequency_days,
  frequency_hours,
  created_at
FROM preventive_maintenance_configs
ORDER BY equipment_type;

-- Check if there are any linked records
SELECT 
  pmt.name as maintenance_type_name,
  pmc.equipment_type,
  pmc.frequency_days,
  pmc.frequency_hours
FROM preventive_maintenance_types pmt
JOIN preventive_maintenance_configs pmc ON pmt.id = pmc.maintenance_type_id
ORDER BY pmc.equipment_type, pmt.name; 