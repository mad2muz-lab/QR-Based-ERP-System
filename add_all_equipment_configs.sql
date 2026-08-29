-- Add PM configurations for ALL equipment types that don't have them yet
-- This will create configurations for any equipment type that exists in your system

-- First, let's see what equipment types exist in your equipment table
SELECT DISTINCT type as equipment_type FROM equipment ORDER BY type;

-- Now add configurations for ALL equipment types that don't have PM configs yet
INSERT INTO preventive_maintenance_configs (id, equipment_type, maintenance_type_id, frequency_days, frequency_hours, created_at, updated_at)
SELECT 
  'pmc-' || gen_random_uuid()::text,
  eq_type.type,
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
CROSS JOIN (SELECT DISTINCT type FROM equipment) eq_type
WHERE NOT EXISTS (
  SELECT 1 FROM preventive_maintenance_configs 
  WHERE equipment_type = eq_type.type AND maintenance_type_id = pmt.id
);

-- Also add configurations for common equipment types that might not be in the equipment table yet
INSERT INTO preventive_maintenance_configs (id, equipment_type, maintenance_type_id, frequency_days, frequency_hours, created_at, updated_at)
SELECT 
  'pmc-' || gen_random_uuid()::text,
  common_type.equipment_type,
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