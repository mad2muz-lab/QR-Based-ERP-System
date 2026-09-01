-- Add PM configurations for ALL equipment types that don't have them yet
-- Using the correct column names from your table structure

-- First, let's see what equipment types exist in your equipment table
SELECT DISTINCT type as equipment_type FROM equipment ORDER BY type;

-- Now add configurations for ALL equipment types that don't have PM configs yet
INSERT INTO preventive_maintenance_configs (
  id, 
  equipment_type, 
  maintenance_type_id, 
  class_a_hours,
  class_b_hours,
  class_c_hours,
  class_a_threshold_hours,
  class_b_threshold_hours,
  class_c_threshold_hours,
  interval_days,
  interval_hours,
  interval_km,
  description,
  checklist_items,
  spare_parts,
  estimated_quantities,
  uom,
  is_active,
  created_at, 
  updated_at
)
SELECT 
  'pmc-' || gen_random_uuid()::text,
  eq_type.type,
  pmt.id,
  CASE 
    WHEN pmt.maintenance_type = 'Routine' THEN 50
    WHEN pmt.maintenance_type = 'Class A' THEN 250
    WHEN pmt.maintenance_type = 'Class B' THEN 1000
    WHEN pmt.maintenance_type = 'Class C' THEN 5000
  END as class_a_hours,
  CASE 
    WHEN pmt.maintenance_type = 'Routine' THEN 100
    WHEN pmt.maintenance_type = 'Class A' THEN 500
    WHEN pmt.maintenance_type = 'Class B' THEN 2000
    WHEN pmt.maintenance_type = 'Class C' THEN 10000
  END as class_b_hours,
  CASE 
    WHEN pmt.maintenance_type = 'Routine' THEN 200
    WHEN pmt.maintenance_type = 'Class A' THEN 1000
    WHEN pmt.maintenance_type = 'Class B' THEN 5000
    WHEN pmt.maintenance_type = 'Class C' THEN 20000
  END as class_c_hours,
  CASE 
    WHEN pmt.maintenance_type = 'Routine' THEN 40
    WHEN pmt.maintenance_type = 'Class A' THEN 200
    WHEN pmt.maintenance_type = 'Class B' THEN 800
    WHEN pmt.maintenance_type = 'Class C' THEN 4000
  END as class_a_threshold_hours,
  CASE 
    WHEN pmt.maintenance_type = 'Routine' THEN 80
    WHEN pmt.maintenance_type = 'Class A' THEN 400
    WHEN pmt.maintenance_type = 'Class B' THEN 1600
    WHEN pmt.maintenance_type = 'Class C' THEN 8000
  END as class_b_threshold_hours,
  CASE 
    WHEN pmt.maintenance_type = 'Routine' THEN 160
    WHEN pmt.maintenance_type = 'Class A' THEN 800
    WHEN pmt.maintenance_type = 'Class B' THEN 4000
    WHEN pmt.maintenance_type = 'Class C' THEN 16000
  END as class_c_threshold_hours,
  CASE 
    WHEN pmt.maintenance_type = 'Routine' THEN 7
    WHEN pmt.maintenance_type = 'Class A' THEN 30
    WHEN pmt.maintenance_type = 'Class B' THEN 90
    WHEN pmt.maintenance_type = 'Class C' THEN 365
  END as interval_days,
  CASE 
    WHEN pmt.maintenance_type = 'Routine' THEN 50
    WHEN pmt.maintenance_type = 'Class A' THEN 250
    WHEN pmt.maintenance_type = 'Class B' THEN 1000
    WHEN pmt.maintenance_type = 'Class C' THEN 5000
  END as interval_hours,
  1000 as interval_km,
  pmt.description,
  CASE 
    WHEN pmt.maintenance_type = 'Routine' THEN ARRAY['Check oil level', 'Inspect belts', 'Clean air filter', 'Check tire pressure']
    WHEN pmt.maintenance_type = 'Class A' THEN ARRAY['Replace oil filter', 'Lubricate pivot points', 'Check hydraulic fluid', 'Inspect electrical connections']
    WHEN pmt.maintenance_type = 'Class B' THEN ARRAY['Replace hydraulic hoses', 'Check engine components', 'Inspect transmission', 'Test safety systems']
    WHEN pmt.maintenance_type = 'Class C' THEN ARRAY['Engine overhaul', 'Transmission rebuild', 'Complete system inspection', 'Safety certification']
  END as checklist_items,
  CASE 
    WHEN pmt.maintenance_type = 'Routine' THEN ARRAY['Oil Filter', 'Air Filter', 'Drive Belt']
    WHEN pmt.maintenance_type = 'Class A' THEN ARRAY['Oil Filter', 'Hydraulic Fluid', 'Grease']
    WHEN pmt.maintenance_type = 'Class B' THEN ARRAY['Hydraulic Hoses', 'Engine Parts', 'Transmission Fluid']
    WHEN pmt.maintenance_type = 'Class C' THEN ARRAY['Engine Parts', 'Transmission Parts', 'Safety Equipment']
  END as spare_parts,
  CASE 
    WHEN pmt.maintenance_type = 'Routine' THEN ARRAY[1.0, 1.0, 1.0]
    WHEN pmt.maintenance_type = 'Class A' THEN ARRAY[1.0, 2.0, 1.0]
    WHEN pmt.maintenance_type = 'Class B' THEN ARRAY[2.0, 1.0, 1.0]
    WHEN pmt.maintenance_type = 'Class C' THEN ARRAY[1.0, 1.0, 1.0]
  END as estimated_quantities,
  'pcs' as uom,
  true as is_active,
  NOW(),
  NOW()
FROM preventive_maintenance_types pmt
CROSS JOIN (SELECT DISTINCT type FROM equipment) eq_type
WHERE NOT EXISTS (
  SELECT 1 FROM preventive_maintenance_configs 
  WHERE equipment_type = eq_type.type AND maintenance_type_id = pmt.id
);

-- Also add configurations for common equipment types that might not be in the equipment table yet
INSERT INTO preventive_maintenance_configs (
  id, 
  equipment_type, 
  maintenance_type_id, 
  class_a_hours,
  class_b_hours,
  class_c_hours,
  class_a_threshold_hours,
  class_b_threshold_hours,
  class_c_threshold_hours,
  interval_days,
  interval_hours,
  interval_km,
  description,
  checklist_items,
  spare_parts,
  estimated_quantities,
  uom,
  is_active,
  created_at, 
  updated_at
)
SELECT 
  'pmc-' || gen_random_uuid()::text,
  common_type.equipment_type,
  pmt.id,
  CASE 
    WHEN pmt.maintenance_type = 'Routine' THEN 50
    WHEN pmt.maintenance_type = 'Class A' THEN 250
    WHEN pmt.maintenance_type = 'Class B' THEN 1000
    WHEN pmt.maintenance_type = 'Class C' THEN 5000
  END as class_a_hours,
  CASE 
    WHEN pmt.maintenance_type = 'Routine' THEN 100
    WHEN pmt.maintenance_type = 'Class A' THEN 500
    WHEN pmt.maintenance_type = 'Class B' THEN 2000
    WHEN pmt.maintenance_type = 'Class C' THEN 10000
  END as class_b_hours,
  CASE 
    WHEN pmt.maintenance_type = 'Routine' THEN 200
    WHEN pmt.maintenance_type = 'Class A' THEN 1000
    WHEN pmt.maintenance_type = 'Class B' THEN 5000
    WHEN pmt.maintenance_type = 'Class C' THEN 20000
  END as class_c_hours,
  CASE 
    WHEN pmt.maintenance_type = 'Routine' THEN 40
    WHEN pmt.maintenance_type = 'Class A' THEN 200
    WHEN pmt.maintenance_type = 'Class B' THEN 800
    WHEN pmt.maintenance_type = 'Class C' THEN 4000
  END as class_a_threshold_hours,
  CASE 
    WHEN pmt.maintenance_type = 'Routine' THEN 80
    WHEN pmt.maintenance_type = 'Class A' THEN 400
    WHEN pmt.maintenance_type = 'Class B' THEN 1600
    WHEN pmt.maintenance_type = 'Class C' THEN 8000
  END as class_b_threshold_hours,
  CASE 
    WHEN pmt.maintenance_type = 'Routine' THEN 160
    WHEN pmt.maintenance_type = 'Class A' THEN 800
    WHEN pmt.maintenance_type = 'Class B' THEN 4000
    WHEN pmt.maintenance_type = 'Class C' THEN 16000
  END as class_c_threshold_hours,
  CASE 
    WHEN pmt.maintenance_type = 'Routine' THEN 7
    WHEN pmt.maintenance_type = 'Class A' THEN 30
    WHEN pmt.maintenance_type = 'Class B' THEN 90
    WHEN pmt.maintenance_type = 'Class C' THEN 365
  END as interval_days,
  CASE 
    WHEN pmt.maintenance_type = 'Routine' THEN 50
    WHEN pmt.maintenance_type = 'Class A' THEN 250
    WHEN pmt.maintenance_type = 'Class B' THEN 1000
    WHEN pmt.maintenance_type = 'Class C' THEN 5000
  END as interval_hours,
  1000 as interval_km,
  pmt.description,
  CASE 
    WHEN pmt.maintenance_type = 'Routine' THEN ARRAY['Check oil level', 'Inspect belts', 'Clean air filter', 'Check tire pressure']
    WHEN pmt.maintenance_type = 'Class A' THEN ARRAY['Replace oil filter', 'Lubricate pivot points', 'Check hydraulic fluid', 'Inspect electrical connections']
    WHEN pmt.maintenance_type = 'Class B' THEN ARRAY['Replace hydraulic hoses', 'Check engine components', 'Inspect transmission', 'Test safety systems']
    WHEN pmt.maintenance_type = 'Class C' THEN ARRAY['Engine overhaul', 'Transmission rebuild', 'Complete system inspection', 'Safety certification']
  END as checklist_items,
  CASE 
    WHEN pmt.maintenance_type = 'Routine' THEN ARRAY['Oil Filter', 'Air Filter', 'Drive Belt']
    WHEN pmt.maintenance_type = 'Class A' THEN ARRAY['Oil Filter', 'Hydraulic Fluid', 'Grease']
    WHEN pmt.maintenance_type = 'Class B' THEN ARRAY['Hydraulic Hoses', 'Engine Parts', 'Transmission Fluid']
    WHEN pmt.maintenance_type = 'Class C' THEN ARRAY['Engine Parts', 'Transmission Parts', 'Safety Equipment']
  END as spare_parts,
  CASE 
    WHEN pmt.maintenance_type = 'Routine' THEN ARRAY[1.0, 1.0, 1.0]
    WHEN pmt.maintenance_type = 'Class A' THEN ARRAY[1.0, 2.0, 1.0]
    WHEN pmt.maintenance_type = 'Class B' THEN ARRAY[2.0, 1.0, 1.0]
    WHEN pmt.maintenance_type = 'Class C' THEN ARRAY[1.0, 1.0, 1.0]
  END as estimated_quantities,
  'pcs' as uom,
  true as is_active,
  NOW(),
  NOW()
FROM preventive_maintenance_types pmt
CROSS JOIN (
  VALUES 
    ('Excavator'),
    ('Bulldozer'),
    ('Telehandler'),
    ('Motor Grader'),
    ('Crane'),
    ('Forklift'),
    ('Loader'),
    ('Dump Truck'),
    ('Compactor'),
    ('Paver'),
    ('Roller'),
    ('Scraper'),
    ('Tractor'),
    ('Backhoe'),
    ('Skid Steer'),
    ('Wheel Loader'),
    ('Track Loader'),
    ('Articulated Truck'),
    ('Rigid Truck'),
    ('Water Truck')
) AS common_type(equipment_type)
WHERE NOT EXISTS (
  SELECT 1 FROM preventive_maintenance_configs 
  WHERE equipment_type = common_type.equipment_type AND maintenance_type_id = pmt.id
); 