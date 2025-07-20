-- Add Sample Maintenance Data for Testing
-- This script adds sample maintenance records if the database is empty

-- First, check if we have any equipment to work with
DO $$
DECLARE
    equipment_count INTEGER;
    maintenance_count INTEGER;
    sample_equipment_id TEXT;
BEGIN
    -- Check current counts
    SELECT COUNT(*) INTO equipment_count FROM equipment;
    SELECT COUNT(*) INTO maintenance_count FROM equipment_maintenance_logs;
    
    RAISE NOTICE 'Current equipment count: %, maintenance count: %', equipment_count, maintenance_count;
    
    -- If we have equipment but no maintenance logs, add some sample data
    IF equipment_count > 0 AND maintenance_count = 0 THEN
        -- Get the first equipment ID
        SELECT id INTO sample_equipment_id FROM equipment LIMIT 1;
        
        RAISE NOTICE 'Adding sample maintenance data for equipment: %', sample_equipment_id;
        
        -- Add sample maintenance logs
        INSERT INTO equipment_maintenance_logs (
            id,
            equipment_id,
            maintenance_type,
            status,
            description,
            start_date,
            estimated_duration_hours,
            priority,
            assigned_technician,
            workflow_step,
            created_at,
            updated_at
        ) VALUES 
        (
            'ml-' || replace(gen_random_uuid()::text, '-', ''),
            sample_equipment_id,
            'repair',
            'scheduled',
            'Routine maintenance check and calibration',
            NOW() + INTERVAL '1 day',
            4,
            'medium',
            'tech-001',
            'marked',
            NOW(),
            NOW()
        ),
        (
            'ml-' || replace(gen_random_uuid()::text, '-', ''),
            sample_equipment_id,
            'service',
            'in_progress',
            'Emergency repair - hydraulic system malfunction',
            NOW() - INTERVAL '2 hours',
            8,
            'high',
            'tech-002',
            'in_progress',
            NOW() - INTERVAL '2 hours',
            NOW()
        ),
        (
            'ml-' || replace(gen_random_uuid()::text, '-', ''),
            sample_equipment_id,
            'repair',
            'completed',
            'Completed: Electrical system upgrade',
            NOW() - INTERVAL '3 days',
            12,
            'high',
            'tech-003',
            'completed',
            NOW() - INTERVAL '3 days',
            NOW() - INTERVAL '1 day'
        );
        
        RAISE NOTICE 'Added 3 sample maintenance records';
        
    ELSIF equipment_count = 0 THEN
        RAISE NOTICE 'No equipment found. Please add equipment first.';
    ELSE
        RAISE NOTICE 'Maintenance data already exists. No sample data added.';
    END IF;
END $$;

-- Verify the data was added
SELECT 'Verification - Maintenance logs after sample data:' as check_name;
SELECT 
    id,
    equipment_id,
    maintenance_type,
    status,
    description,
    created_at
FROM equipment_maintenance_logs 
ORDER BY created_at DESC;

-- Show equipment status
SELECT 'Equipment status after maintenance data:' as check_name;
SELECT 
    id,
    name,
    operational_status,
    type
FROM equipment 
ORDER BY name; 