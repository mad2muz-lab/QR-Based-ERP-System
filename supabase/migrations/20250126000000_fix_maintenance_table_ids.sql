-- Fix maintenance table IDs to use TEXT instead of UUID
-- This aligns with the application's custom ID generation
-- Future-proof for role-based access control

-- 1. Drop existing tables if they exist
DROP TABLE IF EXISTS equipment_maintenance_logs CASCADE;
DROP TABLE IF EXISTS equipment_maintenance_schedules CASCADE;

-- 2. Recreate equipment_maintenance_logs table with TEXT id
CREATE TABLE IF NOT EXISTS equipment_maintenance_logs (
  id TEXT PRIMARY KEY DEFAULT ('ml-' || replace(gen_random_uuid()::text, '-', '')),
  equipment_id TEXT NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  maintenance_type TEXT CHECK (maintenance_type IN ('repair', 'service')) NOT NULL,
  repair_type TEXT CHECK (repair_type IN ('on_site', 'yard_repair')),
  service_type TEXT CHECK (service_type IN ('type_a', 'type_b', 'type_c')),
  status TEXT CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
  description TEXT,
  technician_notes TEXT,
  parts_used TEXT,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completion_date TIMESTAMP WITH TIME ZONE,
  completed_by TEXT, -- Changed from UUID to TEXT to match user IDs
  estimated_duration_hours INTEGER,
  actual_duration_hours INTEGER,
  cost DECIMAL(10,2),
  next_maintenance_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Recreate equipment_maintenance_schedules table with TEXT id
CREATE TABLE IF NOT EXISTS equipment_maintenance_schedules (
  id TEXT PRIMARY KEY DEFAULT ('ms-' || replace(gen_random_uuid()::text, '-', '')),
  equipment_id TEXT NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  schedule_type TEXT CHECK (schedule_type IN ('preventive', 'corrective', 'emergency')) NOT NULL,
  maintenance_type TEXT CHECK (maintenance_type IN ('repair', 'service')) NOT NULL,
  frequency_days INTEGER, -- For preventive maintenance
  last_maintenance_date TIMESTAMP WITH TIME ZONE,
  next_maintenance_date TIMESTAMP WITH TIME ZONE NOT NULL,
  assigned_technician TEXT, -- Changed from UUID to TEXT
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Recreate indexes
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_logs_equipment ON equipment_maintenance_logs(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_logs_status ON equipment_maintenance_logs(status);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_logs_date ON equipment_maintenance_logs(start_date);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_schedules_equipment ON equipment_maintenance_schedules(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_schedules_next_date ON equipment_maintenance_schedules(next_maintenance_date);

-- 5. Enable RLS
ALTER TABLE equipment_maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_maintenance_schedules ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to view maintenance logs" ON equipment_maintenance_logs;
DROP POLICY IF EXISTS "Allow authenticated users to create maintenance logs" ON equipment_maintenance_logs;
DROP POLICY IF EXISTS "Allow authenticated users to update maintenance logs" ON equipment_maintenance_logs;
DROP POLICY IF EXISTS "Allow authenticated users to view maintenance schedules" ON equipment_maintenance_schedules;
DROP POLICY IF EXISTS "Allow authenticated users to manage maintenance schedules" ON equipment_maintenance_schedules;

-- 7. Create RLS policies for equipment_maintenance_logs (future-proof for role-based access)
-- For now, allow all authenticated users. Later, these can be updated to check user roles
CREATE POLICY "Allow authenticated users to view maintenance logs"
  ON equipment_maintenance_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to create maintenance logs"
  ON equipment_maintenance_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update maintenance logs"
  ON equipment_maintenance_logs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 8. Create RLS policies for equipment_maintenance_schedules (future-proof for role-based access)
CREATE POLICY "Allow authenticated users to view maintenance schedules"
  ON equipment_maintenance_schedules FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to create maintenance schedules"
  ON equipment_maintenance_schedules FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update maintenance schedules"
  ON equipment_maintenance_schedules FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 9. Create function for automatic status updates
CREATE OR REPLACE FUNCTION update_equipment_operational_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update equipment operational_status based on maintenance log status
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE equipment 
    SET operational_status = 'working', 
        last_updated = NOW()
    WHERE id = NEW.equipment_id;
  ELSIF NEW.status = 'in_progress' AND OLD.status != 'in_progress' THEN
    UPDATE equipment 
    SET operational_status = CASE 
      WHEN NEW.maintenance_type = 'repair' THEN 'under_repair'
      WHEN NEW.maintenance_type = 'service' THEN 'under_service'
      ELSE 'not_working'
    END,
    last_updated = NOW()
    WHERE id = NEW.equipment_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger for automatic status updates
DROP TRIGGER IF EXISTS equipment_maintenance_status_trigger ON equipment_maintenance_logs;
CREATE TRIGGER equipment_maintenance_status_trigger
  AFTER UPDATE ON equipment_maintenance_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_equipment_operational_status();

-- 11. Create role-based access control tables (for future use)
-- These tables will be used when implementing role-based access control

-- User roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id TEXT PRIMARY KEY DEFAULT ('ur-' || replace(gen_random_uuid()::text, '-', '')),
  user_id TEXT NOT NULL,
  role TEXT CHECK (role IN ('technician', 'manager', 'admin', 'viewer')) NOT NULL,
  permissions JSONB DEFAULT '{}', -- Store specific permissions as JSON
  assigned_by TEXT,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, role)
);

-- Page access table for granular page/tab access control
CREATE TABLE IF NOT EXISTS page_access (
  id TEXT PRIMARY KEY DEFAULT ('pa-' || replace(gen_random_uuid()::text, '-', '')),
  user_id TEXT NOT NULL,
  page_name TEXT NOT NULL, -- e.g., 'equipment_scanner', 'maintenance_dashboard', 'admin_panel'
  can_access BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  assigned_by TEXT,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, page_name)
);

-- Create indexes for role-based access control
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_page_access_user ON page_access(user_id);

-- Enable RLS on role-based access control tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_access ENABLE ROW LEVEL SECURITY;

-- Create policies for role-based access control tables
DROP POLICY IF EXISTS "Allow authenticated users to view user roles" ON user_roles;
DROP POLICY IF EXISTS "Allow admins to manage user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own page access" ON page_access;
DROP POLICY IF EXISTS "Allow admins to manage page access" ON page_access;

CREATE POLICY "Allow authenticated users to view user roles"
  ON user_roles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admins to manage user roles"
  ON user_roles FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to view page access"
  ON page_access FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admins to manage page access"
  ON page_access FOR ALL TO authenticated USING (true);

-- 12. Create function to check user permissions (for future use)
CREATE OR REPLACE FUNCTION check_user_permission(
  p_user_id TEXT,
  p_page_name TEXT,
  p_permission TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  has_permission BOOLEAN := false;
BEGIN
  -- Get user's role
  SELECT role INTO user_role
  FROM user_roles
  WHERE user_id = p_user_id AND is_active = true
  ORDER BY 
    CASE role 
      WHEN 'admin' THEN 1
      WHEN 'manager' THEN 2
      WHEN 'technician' THEN 3
      WHEN 'viewer' THEN 4
      ELSE 5
    END
  LIMIT 1;

  -- Check page-specific permissions
  SELECT 
    CASE p_permission
      WHEN 'access' THEN can_access
      WHEN 'edit' THEN can_edit
      WHEN 'delete' THEN can_delete
      ELSE false
    END INTO has_permission
  FROM page_access
  WHERE user_id = p_user_id AND page_name = p_page_name;

  -- If no specific page permission found, use role-based defaults
  IF has_permission IS NULL THEN
    has_permission := 
      CASE user_role
        WHEN 'admin' THEN true
        WHEN 'manager' THEN p_permission IN ('access', 'edit')
        WHEN 'technician' THEN p_permission IN ('access', 'edit')
        WHEN 'viewer' THEN p_permission = 'access'
        ELSE false
      END;
  END IF;

  RETURN has_permission;
END;
$$ LANGUAGE plpgsql; 