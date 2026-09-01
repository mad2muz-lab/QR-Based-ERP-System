-- Fix the status constraint in preventive_maintenance_logs table
-- The current constraint doesn't allow 'assigned' status, which is needed for PM task assignment

-- First, let's check the current constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'preventive_maintenance_logs'::regclass 
AND contype = 'c';

-- Drop the existing constraint (we'll need to identify it first)
-- This will be done after checking the constraint name above

-- Add the new constraint that includes 'assigned' status
ALTER TABLE preventive_maintenance_logs 
DROP CONSTRAINT IF EXISTS preventive_maintenance_logs_status_check;

ALTER TABLE preventive_maintenance_logs 
ADD CONSTRAINT preventive_maintenance_logs_status_check 
CHECK (status IN ('scheduled', 'assigned', 'in_progress', 'completed', 'cancelled'));

-- Verify the new constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'preventive_maintenance_logs'::regclass 
AND contype = 'c';

-- Test the constraint by trying to insert a record with 'assigned' status
-- (This will be commented out to avoid actually inserting test data)
/*
INSERT INTO preventive_maintenance_logs (
    id, equipment_id, preventive_type_id, scheduled_date, 
    status, assigned_to, assigned_date, completed_date, 
    notes, checklist_items, spare_parts_used, duration_minutes, 
    cost, created_at, updated_at
) VALUES (
    'test-assigned-001', 
    (SELECT id FROM equipment WHERE "Equipment Name" = 'Asphalt Paver' LIMIT 1),
    (SELECT id FROM preventive_maintenance_types WHERE name = 'Class C' LIMIT 1),
    CURRENT_DATE,
    'assigned',
    'test-employee-id',
    CURRENT_TIMESTAMP,
    NULL,
    'Test assignment',
    '[]',
    '[]',
    0,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
*/
