-- Apply only the log tables migration to avoid policy conflicts
-- This script creates the separate log tables with complete schemas

-- Drop existing incomplete log tables if they exist
DROP TABLE IF EXISTS employee_logs CASCADE;
DROP TABLE IF EXISTS equipment_logs CASCADE;
DROP TABLE IF EXISTS material_logs CASCADE;

-- Create employee_logs table with complete schema
CREATE TABLE employee_logs (
  id TEXT PRIMARY KEY DEFAULT ('emp-log-' || extract(epoch from now()) || '-' || substr(md5(random()::text), 1, 8)),
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  department TEXT NOT NULL,
  site TEXT NOT NULL,
  action TEXT CHECK (action IN ('clock-in', 'clock-out')) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME NOT NULL DEFAULT CURRENT_TIME,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  location POINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create equipment_logs table with complete schema
CREATE TABLE equipment_logs (
  id TEXT PRIMARY KEY DEFAULT ('eq-log-' || extract(epoch from now()) || '-' || substr(md5(random()::text), 1, 8)),
  equipment_id TEXT NOT NULL,
  equipment_name TEXT NOT NULL,
  equipment_type TEXT NOT NULL,
  action TEXT CHECK (action IN ('start-use', 'stop-use', 'maintenance', 'repair')) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME NOT NULL DEFAULT CURRENT_TIME,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  site TEXT NOT NULL,
  status TEXT CHECK (status IN ('in-use', 'available', 'maintenance', 'out-of-order')) NOT NULL,
  notes TEXT,
  location POINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create material_logs table with complete schema
CREATE TABLE material_logs (
  id TEXT PRIMARY KEY DEFAULT ('mat-log-' || extract(epoch from now()) || '-' || substr(md5(random()::text), 1, 8)),
  material_id TEXT NOT NULL,
  material_name TEXT NOT NULL,
  material_type TEXT NOT NULL,
  action TEXT CHECK (action IN ('material-in', 'material-out', 'transfer', 'adjustment')) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME NOT NULL DEFAULT CURRENT_TIME,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  site TEXT NOT NULL,
  status TEXT CHECK (status IN ('available', 'low-stock', 'out-of-stock', 'reserved')) NOT NULL,
  notes TEXT,
  location POINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_employee_logs_employee_id ON employee_logs(employee_id);
CREATE INDEX idx_employee_logs_timestamp ON employee_logs(timestamp);
CREATE INDEX idx_employee_logs_site ON employee_logs(site);
CREATE INDEX idx_employee_logs_action ON employee_logs(action);
CREATE INDEX idx_employee_logs_date ON employee_logs(date);

CREATE INDEX idx_equipment_logs_equipment_id ON equipment_logs(equipment_id);
CREATE INDEX idx_equipment_logs_timestamp ON equipment_logs(timestamp);
CREATE INDEX idx_equipment_logs_site ON equipment_logs(site);
CREATE INDEX idx_equipment_logs_action ON equipment_logs(action);
CREATE INDEX idx_equipment_logs_status ON equipment_logs(status);
CREATE INDEX idx_equipment_logs_date ON equipment_logs(date);

CREATE INDEX idx_material_logs_material_id ON material_logs(material_id);
CREATE INDEX idx_material_logs_timestamp ON material_logs(timestamp);
CREATE INDEX idx_material_logs_site ON material_logs(site);
CREATE INDEX idx_material_logs_action ON material_logs(action);
CREATE INDEX idx_material_logs_status ON material_logs(status);
CREATE INDEX idx_material_logs_date ON material_logs(date);

-- Enable Row Level Security
ALTER TABLE employee_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for anonymous and authenticated access
CREATE POLICY "Allow all operations on employee_logs"
  ON employee_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on equipment_logs"
  ON equipment_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on material_logs"
  ON material_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Create triggers to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_employee_logs_updated_at BEFORE UPDATE ON employee_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_logs_updated_at BEFORE UPDATE ON equipment_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_material_logs_updated_at BEFORE UPDATE ON material_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify tables were created successfully
SELECT 'employee_logs table created' as status WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employee_logs');
SELECT 'equipment_logs table created' as status WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'equipment_logs');
SELECT 'material_logs table created' as status WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'material_logs');

-- Show table structures
\d employee_logs;
\d equipment_logs;
\d material_logs;

SELECT 'Log tables migration completed successfully!' as final_status;