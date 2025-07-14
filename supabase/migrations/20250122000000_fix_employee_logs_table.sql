-- Fix employee_logs table structure
-- This migration ensures employee_logs table has the correct structure expected by the application

-- Drop the existing incomplete employee_logs table
DROP TABLE IF EXISTS employee_logs CASCADE;

-- Create employee_logs table with correct structure matching the application's EmployeeLog interface
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

-- Add foreign key constraint to employees table
ALTER TABLE employee_logs ADD CONSTRAINT employee_logs_employee_id_fkey 
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_employee_logs_employee_id ON employee_logs(employee_id);
CREATE INDEX idx_employee_logs_date ON employee_logs(date);
CREATE INDEX idx_employee_logs_timestamp ON employee_logs(timestamp);
CREATE INDEX idx_employee_logs_action ON employee_logs(action);
CREATE INDEX idx_employee_logs_site ON employee_logs(site);

-- Enable RLS
ALTER TABLE employee_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view employee logs" ON employee_logs
    FOR SELECT USING (true);

CREATE POLICY "Users can insert employee logs" ON employee_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update employee logs" ON employee_logs
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete employee logs" ON employee_logs
    FOR DELETE USING (true);

-- Verify the table structure
SELECT 
    'employee_logs table structure:' as info,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'employee_logs' 
ORDER BY ordinal_position;