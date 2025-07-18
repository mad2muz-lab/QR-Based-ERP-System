-- Equipment Maintenance System Migration
-- This migration adds comprehensive equipment maintenance tracking, role-based access, and notifications

-- 1. Update equipment table to add operational_status field
ALTER TABLE equipment 
ADD COLUMN IF NOT EXISTS operational_status TEXT CHECK (operational_status IN ('working', 'not_working', 'in_use', 'standby', 'under_repair', 'under_service')) DEFAULT 'working';

-- Update existing equipment to have 'working' status
UPDATE equipment SET operational_status = 'working' WHERE operational_status IS NULL;

-- 2. Create equipment_maintenance_logs table
CREATE TABLE IF NOT EXISTS equipment_maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  maintenance_type TEXT CHECK (maintenance_type IN ('repair', 'service')) NOT NULL,
  repair_type TEXT CHECK (repair_type IN ('on_site', 'yard_repair')),
  service_type TEXT CHECK (service_type IN ('type_a', 'type_b', 'type_c')),
  status TEXT CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
  description TEXT,
  technician_notes TEXT,
  parts_used TEXT,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completion_date TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES auth.users(id),
  estimated_duration_hours INTEGER,
  actual_duration_hours INTEGER,
  cost DECIMAL(10,2),
  next_maintenance_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create equipment_maintenance_schedules table
CREATE TABLE IF NOT EXISTS equipment_maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  schedule_type TEXT CHECK (schedule_type IN ('preventive', 'corrective', 'emergency')) NOT NULL,
  maintenance_type TEXT CHECK (maintenance_type IN ('repair', 'service')) NOT NULL,
  frequency_days INTEGER, -- For preventive maintenance
  last_maintenance_date TIMESTAMP WITH TIME ZONE,
  next_maintenance_date TIMESTAMP WITH TIME ZONE NOT NULL,
  assigned_technician UUID REFERENCES auth.users(id),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'warning', 'error', 'success', 'maintenance', 'schedule')) NOT NULL,
  entity_type TEXT CHECK (entity_type IN ('equipment', 'employee', 'material', 'site')),
  entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  action_url TEXT, -- URL to navigate to when notification is clicked
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- 5. Create user_roles table for role-based access control
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('technician', 'manager', 'admin', 'viewer')) NOT NULL,
  permissions JSONB DEFAULT '{}', -- Store specific permissions as JSON
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, role)
);

-- 6. Create page_access table for granular page/tab access control
CREATE TABLE IF NOT EXISTS page_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  page_name TEXT NOT NULL, -- e.g., 'equipment_scanner', 'maintenance_dashboard', 'admin_panel'
  can_access BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, page_name)
);

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_equipment_operational_status ON equipment(operational_status);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_logs_equipment ON equipment_maintenance_logs(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_logs_status ON equipment_maintenance_logs(status);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_logs_date ON equipment_maintenance_logs(start_date);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_schedules_equipment ON equipment_maintenance_schedules(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_schedules_next_date ON equipment_maintenance_schedules(next_maintenance_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_page_access_user ON page_access(user_id);

-- 8. Enable RLS on new tables
ALTER TABLE equipment_maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_access ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies for equipment_maintenance_logs
CREATE POLICY IF NOT EXISTS "Allow authenticated users to view maintenance logs"
  ON equipment_maintenance_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Allow technicians, managers, and admins to create maintenance logs"
  ON equipment_maintenance_logs FOR INSERT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('technician', 'manager', 'admin') 
      AND is_active = true
    )
  );

CREATE POLICY IF NOT EXISTS "Allow technicians, managers, and admins to update maintenance logs"
  ON equipment_maintenance_logs FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('technician', 'manager', 'admin') 
      AND is_active = true
    )
  );

-- 10. Create RLS policies for equipment_maintenance_schedules
CREATE POLICY IF NOT EXISTS "Allow authenticated users to view maintenance schedules"
  ON equipment_maintenance_schedules FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Allow managers and admins to manage maintenance schedules"
  ON equipment_maintenance_schedules FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('manager', 'admin') 
      AND is_active = true
    )
  );

-- 11. Create RLS policies for notifications
CREATE POLICY IF NOT EXISTS "Users can only view their own notifications"
  ON notifications FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can update their own notifications"
  ON notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "System can create notifications for users"
  ON notifications FOR INSERT TO authenticated USING (true);

-- 12. Create RLS policies for user_roles
CREATE POLICY IF NOT EXISTS "Allow admins to manage user roles"
  ON user_roles FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND is_active = true
    )
  );

-- 13. Create RLS policies for page_access
CREATE POLICY IF NOT EXISTS "Users can view their own page access"
  ON page_access FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Allow admins to manage page access"
  ON page_access FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND is_active = true
    )
  );

-- 14. Create functions for automatic status updates
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

-- 15. Create trigger for automatic status updates
DROP TRIGGER IF EXISTS equipment_maintenance_status_trigger ON equipment_maintenance_logs;
CREATE TRIGGER equipment_maintenance_status_trigger
  AFTER UPDATE ON equipment_maintenance_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_equipment_operational_status();

-- 16. Create function to check maintenance schedules and create notifications
CREATE OR REPLACE FUNCTION check_maintenance_schedules()
RETURNS void AS $$
DECLARE
  schedule_record RECORD;
BEGIN
  -- Check for upcoming maintenance (within 7 days)
  FOR schedule_record IN 
    SELECT 
      ems.id,
      ems.equipment_id,
      ems.next_maintenance_date,
      e.name as equipment_name,
      ems.maintenance_type,
      ems.assigned_technician
    FROM equipment_maintenance_schedules ems
    JOIN equipment e ON e.id = ems.equipment_id
    WHERE ems.is_active = true 
    AND ems.next_maintenance_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
    AND ems.next_maintenance_date > ems.last_maintenance_date
  LOOP
    -- Create notification for assigned technician
    IF schedule_record.assigned_technician IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, message, type, entity_type, entity_id, action_url)
      VALUES (
        schedule_record.assigned_technician,
        'Upcoming Maintenance Scheduled',
        format('Equipment %s requires %s maintenance on %s', 
               schedule_record.equipment_name, 
               schedule_record.maintenance_type,
               schedule_record.next_maintenance_date::date),
        'schedule',
        'equipment',
        schedule_record.equipment_id,
        '/maintenance/dashboard'
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 17. Create a cron job function (if using pg_cron extension)
-- Note: This requires the pg_cron extension to be enabled
-- SELECT cron.schedule('check-maintenance-schedules', '0 8 * * *', 'SELECT check_maintenance_schedules();');

-- 18. Insert default page access for common roles
INSERT INTO page_access (user_id, page_name, can_access, can_edit, can_delete) 
SELECT 
  ur.user_id,
  page_name,
  CASE 
    WHEN ur.role = 'admin' THEN true
    WHEN ur.role = 'manager' AND page_name NOT IN ('admin_panel', 'user_management') THEN true
    WHEN ur.role = 'technician' AND page_name IN ('equipment_scanner', 'maintenance_dashboard', 'reports') THEN true
    WHEN ur.role = 'viewer' AND page_name IN ('reports', 'equipment_scanner') THEN true
    ELSE false
  END,
  CASE 
    WHEN ur.role = 'admin' THEN true
    WHEN ur.role = 'manager' AND page_name NOT IN ('admin_panel', 'user_management') THEN true
    WHEN ur.role = 'technician' AND page_name IN ('maintenance_dashboard') THEN true
    ELSE false
  END,
  CASE 
    WHEN ur.role = 'admin' THEN true
    WHEN ur.role = 'manager' AND page_name NOT IN ('admin_panel', 'user_management') THEN true
    ELSE false
  END
FROM user_roles ur
CROSS JOIN (
  VALUES 
    ('equipment_scanner'),
    ('maintenance_dashboard'),
    ('reports'),
    ('admin_panel'),
    ('user_management'),
    ('registration_form'),
    ('map_view')
) AS pages(page_name)
ON CONFLICT (user_id, page_name) DO NOTHING; 