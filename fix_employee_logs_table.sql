-- Fix employee_logs table by recreating it with the correct structure
-- This script ensures the employee_logs table matches the application's expectations

-- Drop the existing incomplete employee_logs table
DROP TABLE IF EXISTS employee_logs CASCADE;

-- Create employee_logs table with correct structure
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
CREATE INDEX IF NOT EXISTS idx_employee_logs_employee_id ON employee_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_logs_date ON employee_logs(date);
CREATE INDEX IF NOT EXISTS idx_employee_logs_timestamp ON employee_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_employee_logs_action ON employee_logs(action);

-- Enable RLS
ALTER TABLE employee_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view employee logs" ON employee_logs;
CREATE POLICY "Users can view employee logs" ON employee_logs
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert employee logs" ON employee_logs;
CREATE POLICY "Users can insert employee logs" ON employee_logs
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update employee logs" ON employee_logs;
CREATE POLICY "Users can update employee logs" ON employee_logs
    FOR UPDATE USING (true);

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'employee_logs' 
ORDER BY ordinal_position;

-- Show table constraints
SELECT 
    constraint_name, 
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'employee_logs';