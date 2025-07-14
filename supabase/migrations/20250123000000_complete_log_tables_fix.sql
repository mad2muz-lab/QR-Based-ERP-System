-- Complete Log Tables Fix Migration
-- This migration recreates all log tables with the complete schema expected by the application
-- Fixes the incomplete tables created by force_text_ids.sql migration

-- Drop existing incomplete log tables
DROP TABLE IF EXISTS employee_logs CASCADE;
DROP TABLE IF EXISTS equipment_logs CASCADE;
DROP TABLE IF EXISTS material_logs CASCADE;

-- Create Employee Logs Table with complete schema
CREATE TABLE employee_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT NOT NULL,
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

-- Create Equipment Logs Table with complete schema
CREATE TABLE equipment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id TEXT NOT NULL,
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

-- Create Material Logs Table with complete schema
CREATE TABLE material_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id TEXT NOT NULL,
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

-- Add foreign key constraints (using TEXT IDs as per force_text_ids migration)
ALTER TABLE employee_logs 
    ADD CONSTRAINT fk_employee_logs_employee_id 
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

ALTER TABLE equipment_logs 
    ADD CONSTRAINT fk_equipment_logs_equipment_id 
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE;

ALTER TABLE material_logs 
    ADD CONSTRAINT fk_material_logs_material_id 
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE;

-- Create indexes for performance
-- Employee logs indexes
CREATE INDEX idx_employee_logs_employee_id ON employee_logs(employee_id);
CREATE INDEX idx_employee_logs_date ON employee_logs(date);
CREATE INDEX idx_employee_logs_timestamp ON employee_logs(timestamp);
CREATE INDEX idx_employee_logs_action ON employee_logs(action);
CREATE INDEX idx_employee_logs_site ON employee_logs(site);

-- Equipment logs indexes
CREATE INDEX idx_equipment_logs_equipment_id ON equipment_logs(equipment_id);
CREATE INDEX idx_equipment_logs_date ON equipment_logs(date);
CREATE INDEX idx_equipment_logs_timestamp ON equipment_logs(timestamp);
CREATE INDEX idx_equipment_logs_action ON equipment_logs(action);
CREATE INDEX idx_equipment_logs_site ON equipment_logs(site);

-- Material logs indexes
CREATE INDEX idx_material_logs_material_id ON material_logs(material_id);
CREATE INDEX idx_material_logs_date ON material_logs(date);
CREATE INDEX idx_material_logs_timestamp ON material_logs(timestamp);
CREATE INDEX idx_material_logs_action ON material_logs(action);
CREATE INDEX idx_material_logs_site ON material_logs(site);

-- Enable Row Level Security
ALTER TABLE employee_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for employee_logs
CREATE POLICY "Users can view employee logs" ON employee_logs
    FOR SELECT USING (true);

CREATE POLICY "Users can insert employee logs" ON employee_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update employee logs" ON employee_logs
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete employee logs" ON employee_logs
    FOR DELETE USING (true);

-- Create RLS policies for equipment_logs
CREATE POLICY "Users can view equipment logs" ON equipment_logs
    FOR SELECT USING (true);

CREATE POLICY "Users can insert equipment logs" ON equipment_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update equipment logs" ON equipment_logs
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete equipment logs" ON equipment_logs
    FOR DELETE USING (true);

-- Create RLS policies for material_logs
CREATE POLICY "Users can view material logs" ON material_logs
    FOR SELECT USING (true);

CREATE POLICY "Users can insert material logs" ON material_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update material logs" ON material_logs
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete material logs" ON material_logs
    FOR DELETE USING (true);

-- Add comments for documentation
COMMENT ON TABLE employee_logs IS 'Stores employee clock-in/clock-out logs with complete employee information';
COMMENT ON TABLE equipment_logs IS 'Stores equipment start-use/stop-use logs with equipment details and status';
COMMENT ON TABLE material_logs IS 'Stores material in/out logs with quantity tracking and material information';

-- Verify tables are created correctly
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('employee_logs', 'equipment_logs', 'material_logs')
ORDER BY table_name, ordinal_position;