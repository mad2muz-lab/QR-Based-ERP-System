-- Fix Equipment Maintenance Logs RLS Policies
-- This migration updates the RLS policies to allow all authenticated users to work with maintenance logs
-- without requiring specific role assignments

-- Drop existing policies for equipment_maintenance_logs
DROP POLICY IF EXISTS "Allow authenticated users to view maintenance logs" ON equipment_maintenance_logs;
DROP POLICY IF EXISTS "Allow technicians, managers, and admins to create maintenance logs" ON equipment_maintenance_logs;
DROP POLICY IF EXISTS "Allow technicians, managers, and admins to update maintenance logs" ON equipment_maintenance_logs;
DROP POLICY IF EXISTS "Allow authenticated users to create maintenance logs" ON equipment_maintenance_logs;
DROP POLICY IF EXISTS "Allow authenticated users to update maintenance logs" ON equipment_maintenance_logs;

-- Create new policies that allow all authenticated users
CREATE POLICY "Allow authenticated users to view maintenance logs"
  ON equipment_maintenance_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to create maintenance logs"
  ON equipment_maintenance_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update maintenance logs"
  ON equipment_maintenance_logs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete maintenance logs"
  ON equipment_maintenance_logs FOR DELETE TO authenticated USING (true);

-- Also fix equipment_maintenance_schedules policies
DROP POLICY IF EXISTS "Allow authenticated users to view maintenance schedules" ON equipment_maintenance_schedules;
DROP POLICY IF EXISTS "Allow managers and admins to manage maintenance schedules" ON equipment_maintenance_schedules;
DROP POLICY IF EXISTS "Allow authenticated users to create maintenance schedules" ON equipment_maintenance_schedules;
DROP POLICY IF EXISTS "Allow authenticated users to update maintenance schedules" ON equipment_maintenance_schedules;

CREATE POLICY "Allow authenticated users to view maintenance schedules"
  ON equipment_maintenance_schedules FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to create maintenance schedules"
  ON equipment_maintenance_schedules FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update maintenance schedules"
  ON equipment_maintenance_schedules FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete maintenance schedules"
  ON equipment_maintenance_schedules FOR DELETE TO authenticated USING (true);

-- Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('equipment_maintenance_logs', 'equipment_maintenance_schedules')
ORDER BY tablename, policyname; 