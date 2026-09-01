-- Add sample maintenance types if table is empty
INSERT INTO preventive_maintenance_types (id, maintenance_type, description, checklist_items, spare_part, created_at, updated_at)
SELECT 
  'pmt-' || gen_random_uuid()::text,
  'Routine',
  'Regular maintenance tasks performed frequently',
  ARRAY['Check oil level', 'Inspect belts', 'Clean air filter', 'Check tire pressure'],
  'Oil Filter, Air Filter, Drive Belt',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM preventive_maintenance_types WHERE maintenance_type = 'Routine');

INSERT INTO preventive_maintenance_types (id, maintenance_type, description, checklist_items, spare_part, created_at, updated_at)
SELECT 
  'pmt-' || gen_random_uuid()::text,
  'Class A',
  'Minor maintenance with parts replacement',
  ARRAY['Replace oil filter', 'Lubricate pivot points', 'Check hydraulic fluid', 'Inspect electrical connections'],
  'Oil Filter, Hydraulic Fluid, Grease',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM preventive_maintenance_types WHERE maintenance_type = 'Class A');

INSERT INTO preventive_maintenance_types (id, maintenance_type, description, checklist_items, spare_part, created_at, updated_at)
SELECT 
  'pmt-' || gen_random_uuid()::text,
  'Class B',
  'Major maintenance with significant parts replacement',
  ARRAY['Replace hydraulic hoses', 'Check engine components', 'Inspect transmission', 'Test safety systems'],
  'Hydraulic Hoses, Engine Parts, Transmission Fluid',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM preventive_maintenance_types WHERE maintenance_type = 'Class B');

INSERT INTO preventive_maintenance_types (id, maintenance_type, description, checklist_items, spare_part, created_at, updated_at)
SELECT 
  'pmt-' || gen_random_uuid()::text,
  'Class C',
  'Complete overhaul and major repairs',
  ARRAY['Engine overhaul', 'Transmission rebuild', 'Complete system inspection', 'Safety certification'],
  'Engine Parts, Transmission Parts, Safety Equipment',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM preventive_maintenance_types WHERE maintenance_type = 'Class C');

-- Add sample configs for common equipment types
INSERT INTO preventive_maintenance_configs (id, equipment_type, maintenance_type_id, frequency_days, frequency_hours, created_at, updated_at)
SELECT 
  'pmc-' || gen_random_uuid()::text,
  'Excavator',
  pmt.id,
  CASE 
    WHEN pmt.maintenance_type = 'Routine' THEN 7
    WHEN pmt.maintenance_type = 'Class A' THEN 30
    WHEN pmt.maintenance_type = 'Class B' THEN 90
    WHEN pmt.maintenance_type = 'Class C' THEN 365
  END,
  CASE 
    WHEN pmt.maintenance_type = 'Routine' THEN 50
    WHEN pmt.maintenance_type = 'Class A' THEN 250
    WHEN pmt.maintenance_type = 'Class B' THEN 1000
    WHEN pmt.maintenance_type = 'Class C' THEN 5000
  END,
  NOW(),
  NOW()
FROM preventive_maintenance_types pmt
WHERE NOT EXISTS (
  SELECT 1 FROM preventive_maintenance_configs 
  WHERE equipment_type = 'Excavator' AND maintenance_type_id = pmt.id
);

INSERT INTO preventive_maintenance_configs (id, equipment_type, maintenance_type_id, frequency_days, frequency_hours, created_at, updated_at)
SELECT 
  'pmc-' || gen_random_uuid()::text,
  'Bulldozer',
  pmt.id,
  CASE 
    WHEN pmt.maintenance_type = 'Routine' THEN 7
    WHEN pmt.maintenance_type = 'Class A' THEN 30
    WHEN pmt.maintenance_type = 'Class B' THEN 90
    WHEN pmt.maintenance_type = 'Class C' THEN 365
  END,
  CASE 
    WHEN pmt.maintenance_type = 'Routine' THEN 50
    WHEN pmt.maintenance_type = 'Class A' THEN 250
    WHEN pmt.maintenance_type = 'Class B' THEN 1000
    WHEN pmt.maintenance_type = 'Class C' THEN 5000
  END,
  NOW(),
  NOW()
FROM preventive_maintenance_types pmt
WHERE NOT EXISTS (
  SELECT 1 FROM preventive_maintenance_configs 
  WHERE equipment_type = 'Bulldozer' AND maintenance_type_id = pmt.id
); 