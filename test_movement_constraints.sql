-- Test Movement Constraints
-- This script will help identify the exact values allowed by CHECK constraints

-- Test request_type constraint
SELECT 
  'request_type' as constraint_name,
  'Testing valid values' as test_description;

-- Try to insert with different request_type values to see which ones work
-- This will help us understand the exact CHECK constraint values

-- Test 1: equipment
INSERT INTO resource_movement_requests (
  id, request_type, entity_id, entity_name, entity_type, 
  location_from, location_to, requested_by
) VALUES (
  'TEST-REQ-001', 'equipment', 'TEST-EQP-001', 'Test Equipment', 'equipment',
  'Site A', 'Site B', 'test_user'
) ON CONFLICT (id) DO NOTHING;

-- Test 2: employee
INSERT INTO resource_movement_requests (
  id, request_type, entity_id, entity_name, entity_type, 
  location_from, location_to, requested_by
) VALUES (
  'TEST-REQ-002', 'employee', 'TEST-EMP-001', 'Test Employee', 'employee',
  'Site A', 'Site B', 'test_user'
) ON CONFLICT (id) DO NOTHING;

-- Test 3: material
INSERT INTO resource_movement_requests (
  id, request_type, entity_id, entity_name, entity_type, 
  location_from, location_to, requested_by
) VALUES (
  'TEST-REQ-003', 'material', 'TEST-MAT-001', 'Test Material', 'material',
  'Site A', 'Site B', 'test_user'
) ON CONFLICT (id) DO NOTHING;

-- Test 4: fleet
INSERT INTO resource_movement_requests (
  id, request_type, entity_id, entity_name, entity_type, 
  location_from, location_to, requested_by
) VALUES (
  'TEST-REQ-004', 'fleet', 'TEST-FLEET-001', 'Test Fleet', 'fleet',
  'Site A', 'Site B', 'test_user'
) ON CONFLICT (id) DO NOTHING;

-- Check what was inserted successfully
SELECT 
  id, request_type, entity_type, status, priority
FROM resource_movement_requests 
WHERE id LIKE 'TEST-REQ-%'
ORDER BY id;

-- Clean up test data
DELETE FROM resource_movement_requests WHERE id LIKE 'TEST-REQ-%'; 