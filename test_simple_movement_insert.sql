-- Test Simple Movement Insert
-- This will help identify the exact schema issue

-- Try inserting a minimal movement request based on actual schema
INSERT INTO resource_movement_requests (
  id,
  request_type,
  entity_id,
  entity_name,
  entity_type,
  quantity,
  unit,
  location_from,
  location_to,
  requested_by,
  priority,
  status,
  estimated_duration,
  estimated_cost,
  notes,
  reference_id
) VALUES (
  'TEST-' || EXTRACT(EPOCH FROM NOW())::TEXT,
  'equipment',
  'EQP-TEST-001',
  'Test Equipment',
  'equipment',
  1,
  'unit',
  'Site A',
  'Site B',
  'test_user',
  'medium',
  'pending',
  60,
  100.00,
  'Test movement request',
  'REF-TEST-001'
) RETURNING *; 