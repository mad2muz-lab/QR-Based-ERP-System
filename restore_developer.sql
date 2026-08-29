-- Create a test developer user for authentication
INSERT INTO users (id, username, role, name, email, site, created_at) 
VALUES (
  gen_random_uuid(), 
  'admin', 
  'admin', 
  'System Administrator', 
  'admin@system.local', 
  'Main Site', 
  now()
) ON CONFLICT (username) DO NOTHING;

-- Create a developer user as well
INSERT INTO users (id, username, role, name, email, site, created_at) 
VALUES (
  gen_random_uuid(), 
  'developer', 
  'developer', 
  'System Developer', 
  'developer@system.local', 
  'Main Site', 
  now()
) ON CONFLICT (username) DO NOTHING;
