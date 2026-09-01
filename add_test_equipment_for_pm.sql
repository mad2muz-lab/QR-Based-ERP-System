-- Add Test Equipment for PM Testing
-- This script adds sample equipment data to test PM enrollment functionality

-- 1. Insert test equipment data with PM-ready structure
INSERT INTO equipment (
  id,
  name,
  type,
  model,
  site,
  qr_code,
  status,
  pm_class,
  is_pm,
  pm_frequency_days,
  pm_cost_estimate,
  created_at,
  updated_at
) VALUES 
  ('test-eqp-001', 'Excavator CAT320', 'Excavator', 'CAT 320D', 'Riyadh Site', 'EXC-001', 'available', 'Class A', false, 30, 2500.00, NOW(), NOW()),
  ('test-eqp-002', 'Bulldozer CAT D6', 'Bulldozer', 'CAT D6T', 'Jeddah Site', 'BUL-001', 'available', 'Class B', false, 45, 1800.00, NOW(), NOW()),
  ('test-eqp-003', 'Crane Liebherr', 'Crane', 'LTM 1100', 'Dammam Site', 'CRA-001', 'available', 'Class C', false, 90, 3500.00, NOW(), NOW()),
  ('test-eqp-004', 'Loader CAT950', 'Loader', 'CAT 950K', 'Riyadh Site', 'LOA-001', 'available', 'Class A', false, 30, 2000.00, NOW(), NOW()),
  ('test-eqp-005', 'Asphalt Paver', 'Asphalt Paver', 'CAT AP655F', 'Jeddah Site', 'PAV-001', 'available', 'Class B', false, 60, 2200.00, NOW(), NOW()),
  ('test-eqp-006', 'Motor Grader', 'Motor Grader', 'CAT 140K', 'Dammam Site', 'GRD-001', 'available', 'Class A', false, 30, 1500.00, NOW(), NOW()),
  ('test-eqp-007', 'Roller Compactor', 'Roller', 'CAT CS533E', 'Riyadh Site', 'ROL-001', 'available', 'Class B', false, 45, 1200.00, NOW(), NOW()),
  ('test-eqp-008', 'Batch Plant', 'Batch Plant', 'BatchPlant_15', 'Jeddah Site', 'BAT-001', 'available', 'Class C', false, 90, 4000.00, NOW(), NOW());

-- 2. Verify the equipment was added
SELECT 
  'Equipment added successfully' as status,
  COUNT(*) as total_equipment,
  COUNT(CASE WHEN is_pm = true THEN 1 END) as enrolled_in_pm,
  COUNT(CASE WHEN is_pm = false THEN 1 END) as available_for_enrollment
FROM equipment 
WHERE id LIKE 'test-eqp-%';

-- 3. Show the added equipment
SELECT 
  id,
  name,
  type,
  site,
  pm_class,
  is_pm,
  pm_frequency_days,
  pm_cost_estimate
FROM equipment 
WHERE id LIKE 'test-eqp-%'
ORDER BY name; 