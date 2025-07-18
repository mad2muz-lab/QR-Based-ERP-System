-- Update Equipment Logs Actions Migration
-- This migration updates the equipment_logs table to allow new action types for standby and maintenance

-- Drop the existing constraint
ALTER TABLE equipment_logs DROP CONSTRAINT IF EXISTS equipment_logs_action_check;

-- Add the new constraint with all allowed action types
ALTER TABLE equipment_logs 
ADD CONSTRAINT equipment_logs_action_check 
CHECK (action IN ('start-use', 'stop-use', 'standby-start', 'standby-end', 'maintenance-start', 'maintenance-end'));

-- Verify the constraint was updated
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'equipment_logs'::regclass 
AND contype = 'c'; 