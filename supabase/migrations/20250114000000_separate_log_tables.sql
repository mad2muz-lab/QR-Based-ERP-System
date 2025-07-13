-- Create separate log tables for different entity types

-- Employee Logs Table
CREATE TABLE IF NOT EXISTS employee_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  employee_name TEXT NOT NULL,
  department TEXT NOT NULL,
  site TEXT NOT NULL,
  action TEXT CHECK (action IN ('clock-in', 'clock-out')) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME NOT NULL DEFAULT CURRENT_TIME,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  location POINT
);

-- Equipment Logs Table
CREATE TABLE IF NOT EXISTS equipment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL,
  equipment_name TEXT NOT NULL,
  equipment_type TEXT NOT NULL,
  action TEXT CHECK (action IN ('start-use', 'stop-use')) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME NOT NULL DEFAULT CURRENT_TIME,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  site TEXT NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  location POINT
);

-- Material Logs Table
CREATE TABLE IF NOT EXISTS material_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL,
  material_name TEXT NOT NULL,
  material_type TEXT NOT NULL,
  action TEXT CHECK (action IN ('material-in', 'material-out')) NOT NULL,
  quantity INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME NOT NULL DEFAULT CURRENT_TIME,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  site TEXT NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  location POINT
);

-- Enable RLS on new tables
ALTER TABLE employee_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for employee_logs
CREATE POLICY "Allow all operations on employee_logs"
  ON employee_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Create RLS policies for equipment_logs
CREATE POLICY "Allow all operations on equipment_logs"
  ON equipment_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Create RLS policies for material_logs
CREATE POLICY "Allow all operations on material_logs"
  ON material_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_logs_employee_id ON employee_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_logs_date ON employee_logs(date);
CREATE INDEX IF NOT EXISTS idx_employee_logs_timestamp ON employee_logs(timestamp);

CREATE INDEX IF NOT EXISTS idx_equipment_logs_equipment_id ON equipment_logs(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_logs_date ON equipment_logs(date);
CREATE INDEX IF NOT EXISTS idx_equipment_logs_timestamp ON equipment_logs(timestamp);

CREATE INDEX IF NOT EXISTS idx_material_logs_material_id ON material_logs(material_id);
CREATE INDEX IF NOT EXISTS idx_material_logs_date ON material_logs(date);
CREATE INDEX IF NOT EXISTS idx_material_logs_timestamp ON material_logs(timestamp);