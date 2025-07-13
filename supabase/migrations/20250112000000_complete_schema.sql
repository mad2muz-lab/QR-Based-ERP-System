-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT,
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  blood_group TEXT,
  site TEXT NOT NULL,
  qr_code TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  photo TEXT,
  email TEXT,
  phone TEXT
);

-- Create equipment table
CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  model TEXT NOT NULL,
  site TEXT NOT NULL,
  qr_code TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('available', 'in-use', 'maintenance', 'down')) DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  serial_number TEXT
);

-- Create materials table
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  unit TEXT NOT NULL,
  site TEXT NOT NULL,
  qr_code TEXT UNIQUE NOT NULL,
  quantity INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('available', 'low-stock', 'out-of-stock')) DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  use TEXT
);

-- Create sites table
CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  province TEXT NOT NULL,
  coordinates POINT,
  address TEXT NOT NULL,
  manager TEXT NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  type TEXT
);

-- Create time_logs table (for login/logout and other tracking)
CREATE TABLE IF NOT EXISTS time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL,
  entity_type TEXT CHECK (entity_type IN ('employee', 'equipment', 'material', 'site')) NOT NULL,
  action TEXT CHECK (action IN ('clock-in', 'clock-out', 'start-use', 'stop-use', 'material-in', 'material-out', 'site-checkin')) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  site TEXT NOT NULL,
  notes TEXT,
  location POINT,
  quantity INTEGER
);

-- Enable RLS on all tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for employees
CREATE POLICY "Authenticated users can read employees"
  ON employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert employees"
  ON employees FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update employees"
  ON employees FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete employees"
  ON employees FOR DELETE TO authenticated USING (true);

-- Create RLS policies for equipment
CREATE POLICY "Authenticated users can read equipment"
  ON equipment FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert equipment"
  ON equipment FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update equipment"
  ON equipment FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete equipment"
  ON equipment FOR DELETE TO authenticated USING (true);

-- Create RLS policies for materials
CREATE POLICY "Authenticated users can read materials"
  ON materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert materials"
  ON materials FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update materials"
  ON materials FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete materials"
  ON materials FOR DELETE TO authenticated USING (true);

-- Create RLS policies for sites
CREATE POLICY "Authenticated users can read sites"
  ON sites FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert sites"
  ON sites FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update sites"
  ON sites FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete sites"
  ON sites FOR DELETE TO authenticated USING (true);

-- Create RLS policies for time_logs
CREATE POLICY "Authenticated users can read time_logs"
  ON time_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert time_logs"
  ON time_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update time_logs"
  ON time_logs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete time_logs"
  ON time_logs FOR DELETE TO authenticated USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_qr_code ON employees(qr_code);
CREATE INDEX IF NOT EXISTS idx_employees_site ON employees(site);
CREATE INDEX IF NOT EXISTS idx_equipment_qr_code ON equipment(qr_code);
CREATE INDEX IF NOT EXISTS idx_equipment_site ON equipment(site);
CREATE INDEX IF NOT EXISTS idx_materials_qr_code ON materials(qr_code);
CREATE INDEX IF NOT EXISTS idx_materials_site ON materials(site);
CREATE INDEX IF NOT EXISTS idx_time_logs_entity ON time_logs(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_time_logs_timestamp ON time_logs(timestamp);