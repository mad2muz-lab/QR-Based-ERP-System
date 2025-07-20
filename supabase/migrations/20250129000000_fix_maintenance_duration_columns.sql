-- Fix Equipment Maintenance Logs Duration Columns
-- This migration changes estimated_duration_hours and actual_duration_hours from INTEGER to DECIMAL
-- to support decimal values like 1.5 hours

-- Check if the table exists and has the columns
DO $$
BEGIN
    -- Check if equipment_maintenance_logs table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'equipment_maintenance_logs') THEN
        
        -- Change estimated_duration_hours from INTEGER to DECIMAL(5,2)
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'equipment_maintenance_logs' 
                   AND column_name = 'estimated_duration_hours' 
                   AND data_type = 'integer') THEN
            ALTER TABLE equipment_maintenance_logs 
            ALTER COLUMN estimated_duration_hours TYPE DECIMAL(5,2);
        END IF;
        
        -- Change actual_duration_hours from INTEGER to DECIMAL(5,2)
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'equipment_maintenance_logs' 
                   AND column_name = 'actual_duration_hours' 
                   AND data_type = 'integer') THEN
            ALTER TABLE equipment_maintenance_logs 
            ALTER COLUMN actual_duration_hours TYPE DECIMAL(5,2);
        END IF;
        
        RAISE NOTICE 'Successfully updated duration columns to DECIMAL(5,2)';
    ELSE
        RAISE NOTICE 'equipment_maintenance_logs table does not exist';
    END IF;
END $$;

-- Verify the changes
SELECT 
    column_name,
    data_type,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'equipment_maintenance_logs' 
AND column_name IN ('estimated_duration_hours', 'actual_duration_hours')
ORDER BY column_name; 