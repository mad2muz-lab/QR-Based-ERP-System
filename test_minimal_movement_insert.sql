-- Test Minimal Movement Insert
-- This will help identify the exact schema issue

-- Try inserting a minimal movement request with only required fields
INSERT INTO resource_movement_requests (
  id,
  request_type,
  entity_id,
  entity_name,
  entity_type,
  location_from,
  location_to,
  requested_by
) VALUES (
  'TEST-MINIMAL-' || EXTRACT(EPOCH FROM NOW())::TEXT,
  'equipment',
  'TEST-EQP-001',
  'Test Equipment',
  'equipment',
  'Site A',
  'Site B',
  'test_user'
) RETURNING *; 