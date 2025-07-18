-- Fix Equipment Logs Status Constraint
-- Run this SQL directly in your Supabase SQL editor

-- Drop the existing status constraint
ALTER TABLE equipment_logs DROP CONSTRAINT IF EXISTS equipment_logs_status_check;

-- Add the new constraint with all allowed status values
ALTER TABLE equipment_logs 
ADD CONSTRAINT equipment_logs_status_check 
CHECK (status IN ('available', 'in-use', 'maintenance', 'standby', 'out-of-order'));

-- Verify the constraint was updated
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'equipment_logs'::regclass 
AND contype = 'c'; 