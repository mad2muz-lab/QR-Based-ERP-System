-- Migration: Add roles and role_page_access tables for hierarchical, role-based access control

-- 1. Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  parent_role_id UUID REFERENCES roles(id) ON DELETE SET NULL
);

-- 2. Create role_page_access table
CREATE TABLE IF NOT EXISTS role_page_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  page_name TEXT NOT NULL,
  can_access BOOLEAN DEFAULT false,
  UNIQUE(role_id, page_name)
);

-- 3. Seed roles (admin > manager > technician > viewer)
INSERT INTO roles (name, description, parent_role_id) VALUES
  ('admin', 'Full system access including user management and system configuration', NULL),
  ('manager', 'Can manage maintenance schedules, assign technicians, and view all reports', (SELECT id FROM roles WHERE name = 'admin')),
  ('technician', 'Can perform maintenance tasks, complete repairs, and view maintenance logs', (SELECT id FROM roles WHERE name = 'manager')),
  ('viewer', 'Can view reports and equipment status, no editing capabilities', (SELECT id FROM roles WHERE name = 'technician'))
ON CONFLICT (name) DO NOTHING;

-- 4. Seed example page permissions for each role
-- (Adjust page names as needed to match your app)
INSERT INTO role_page_access (role_id, page_name, can_access)
SELECT r.id, p.page_name, p.can_access
FROM roles r
JOIN (
  VALUES
    ('admin', 'admin_panel', true),
    ('admin', 'user_management', true),
    ('admin', 'equipment_scanner', true),
    ('admin', 'maintenance_dashboard', true),
    ('admin', 'reports', true),
    ('admin', 'registration_form', true),
    ('admin', 'map_view', true),
    ('manager', 'equipment_scanner', true),
    ('manager', 'maintenance_dashboard', true),
    ('manager', 'reports', true),
    ('manager', 'registration_form', true),
    ('manager', 'map_view', true),
    ('technician', 'equipment_scanner', true),
    ('technician', 'maintenance_dashboard', true),
    ('technician', 'reports', true),
    ('viewer', 'equipment_scanner', true),
    ('viewer', 'reports', true)
) AS p(role_name, page_name, can_access)
ON CONFLICT (role_id, page_name) DO NOTHING
WHERE r.name = p.role_name;

-- 5. (Optional) Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_role_page_access_role ON role_page_access(role_id);
CREATE INDEX IF NOT EXISTS idx_role_page_access_page ON role_page_access(page_name); 