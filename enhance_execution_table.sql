-- Enhance Resource Movement Executions Table
-- Add missing columns for complete execution tracking

-- Add new columns to resource_movement_executions table
ALTER TABLE resource_movement_executions 
ADD COLUMN IF NOT EXISTS assigned_executor_id TEXT,
ADD COLUMN IF NOT EXISTS actual_start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS actual_end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS current_location TEXT,
ADD COLUMN IF NOT EXISTS completion_notes TEXT,
ADD COLUMN IF NOT EXISTS final_cost_breakdown JSONB,
ADD COLUMN IF NOT EXISTS movement_progress_percentage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_updated_location TEXT,
ADD COLUMN IF NOT EXISTS estimated_completion_time TIMESTAMP WITH TIME ZONE;

-- Update the status enum to include new statuses
-- First, let's check current status values
SELECT DISTINCT status FROM resource_movement_executions;

-- Add new statuses if they don't exist
-- Note: We'll need to recreate the enum if new values are needed
-- For now, we'll use the existing statuses and add logic in the application

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_executions_assigned_executor ON resource_movement_executions(assigned_executor_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON resource_movement_executions(status);
CREATE INDEX IF NOT EXISTS idx_executions_start_time ON resource_movement_executions(actual_start_time);
CREATE INDEX IF NOT EXISTS idx_executions_progress ON resource_movement_executions(movement_progress_percentage);

-- Add foreign key constraint for assigned_executor_id (references employees table)
-- Note: This assumes you have an employees table with id column
-- ALTER TABLE resource_movement_executions 
-- ADD CONSTRAINT fk_executions_assigned_executor 
-- FOREIGN KEY (assigned_executor_id) REFERENCES employees(id);

-- Verify the enhanced table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'resource_movement_executions'
ORDER BY ordinal_position;

-- Insert sample execution data for testing (if table is empty)
INSERT INTO resource_movement_executions (
    id,
    request_id,
    execution_type,
    executed_by,
    status,
    notes,
    assigned_executor_id,
    movement_progress_percentage,
    current_location
) 
SELECT 
    'EXEC-SAMPLE-' || EXTRACT(EPOCH FROM NOW())::TEXT || '-' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 5),
    rmr.id,
    rmr.request_type,
    'current_user_id',
    'in_progress',
    'Sample execution for testing',
    'sample_executor_id',
    0,
    rmr.location_from
FROM resource_movement_requests rmr
WHERE rmr.status = 'approved'
LIMIT 1
ON CONFLICT (id) DO NOTHING; 