-- Create Preventive Maintenance Tables Migration
-- This migration creates all the necessary tables for the PM system

-- 1. Create preventive_maintenance_configs table
CREATE TABLE IF NOT EXISTS preventive_maintenance_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_type TEXT NOT NULL,
  maintenance_class TEXT NOT NULL CHECK (maintenance_class IN ('Class A', 'Class B', 'Class C')),
  class_a_hours INTEGER DEFAULT 0,
  class_b_hours INTEGER DEFAULT 0,
  class_c_hours INTEGER DEFAULT 0,
  class_a_threshold_hours INTEGER DEFAULT 0,
  class_b_threshold_hours INTEGER DEFAULT 0,
  class_c_threshold_hours INTEGER DEFAULT 0,
  interval_days INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(equipment_type, maintenance_class)
);

-- 2. Create preventive_maintenance_logs table
CREATE TABLE IF NOT EXISTS preventive_maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id TEXT NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  maintenance_class TEXT NOT NULL CHECK (maintenance_class IN ('Class A', 'Class B', 'Class C')),
  maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('preventive', 'corrective')),
  scheduled_date DATE NOT NULL,
  performed_date DATE,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'in_progress', 'completed', 'overdue', 'cancelled')) DEFAULT 'scheduled',
  technician_id TEXT,
  checklist_completed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pm_configs_equipment_type ON preventive_maintenance_configs(equipment_type);
CREATE INDEX IF NOT EXISTS idx_pm_configs_maintenance_class ON preventive_maintenance_configs(maintenance_class);
CREATE INDEX IF NOT EXISTS idx_pm_logs_equipment_id ON preventive_maintenance_logs(equipment_id);
CREATE INDEX IF NOT EXISTS idx_pm_logs_scheduled_date ON preventive_maintenance_logs(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_pm_logs_status ON preventive_maintenance_logs(status);

-- 4. Insert sample PM configurations for common equipment types
INSERT INTO preventive_maintenance_configs (equipment_type, maintenance_class, class_a_hours, class_b_hours, class_c_hours, class_a_threshold_hours, class_b_threshold_hours, class_c_threshold_hours, interval_days) VALUES
  ('Excavator', 'Class A', 500, 1000, 2000, 400, 800, 1600, 30),
  ('Excavator', 'Class B', 250, 500, 1000, 200, 400, 800, 60),
  ('Excavator', 'Class C', 100, 250, 500, 80, 200, 400, 90),
  ('Bulldozer', 'Class A', 400, 800, 1600, 320, 640, 1280, 30),
  ('Bulldozer', 'Class B', 200, 400, 800, 160, 320, 640, 60),
  ('Bulldozer', 'Class C', 80, 200, 400, 64, 160, 320, 90),
  ('Crane', 'Class A', 300, 600, 1200, 240, 480, 960, 30),
  ('Crane', 'Class B', 150, 300, 600, 120, 240, 480, 60),
  ('Crane', 'Class C', 60, 150, 300, 48, 120, 240, 90),
  ('Truck', 'Class A', 200, 400, 800, 160, 320, 640, 30),
  ('Truck', 'Class B', 100, 200, 400, 80, 160, 320, 60),
  ('Truck', 'Class C', 40, 100, 200, 32, 80, 160, 90)
ON CONFLICT (equipment_type, maintenance_class) DO NOTHING;

-- 5. Enable RLS on new tables
ALTER TABLE preventive_maintenance_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE preventive_maintenance_logs ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies
CREATE POLICY "Allow all operations on preventive_maintenance_configs"
  ON preventive_maintenance_configs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on preventive_maintenance_logs"
  ON preventive_maintenance_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 7. Verify tables were created
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('preventive_maintenance_configs', 'preventive_maintenance_logs')
ORDER BY table_name, ordinal_position;

-- 8. Show sample data
SELECT 
  equipment_type,
  maintenance_class,
  class_a_threshold_hours,
  class_b_threshold_hours,
  class_c_threshold_hours,
  interval_days,
  is_active
FROM preventive_maintenance_configs
ORDER BY equipment_type, maintenance_class;

-- 9. Check if tables exist
SELECT 
  table_name,
  CASE WHEN table_name IN ('equipment', 'equipment_logs', 'preventive_maintenance_configs', 'preventive_maintenance_logs') 
       THEN 'Required' 
       ELSE 'Optional' 
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('equipment', 'equipment_logs', 'preventive_maintenance_configs', 'preventive_maintenance_logs'); 