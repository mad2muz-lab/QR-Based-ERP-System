-- Create Missing Maintenance Tables
-- Run this in your Supabase SQL Editor to fix the 404 errors

-- 1. First, let's check what tables exist
SELECT '=== CHECKING EXISTING TABLES ===' as info;

SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN ('equipment_maintenance_logs', 'equipment_maintenance_schedules')
ORDER BY table_name;

-- 2. Create equipment_maintenance_schedules table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'equipment_maintenance_schedules') THEN
        
        CREATE TABLE equipment_maintenance_schedules (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            equipment_id TEXT NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
            maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('preventive', 'corrective', 'emergency')),
            frequency_days INTEGER,
            frequency_hours INTEGER,
            last_maintenance_date TIMESTAMP WITH TIME ZONE,
            next_maintenance_date TIMESTAMP WITH TIME ZONE,
            estimated_duration_hours DECIMAL(5,2),
            estimated_cost DECIMAL(10,2),
            assigned_technician TEXT,
            priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
            status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'overdue')),
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_schedules_equipment ON equipment_maintenance_schedules(equipment_id);
        CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_schedules_next_date ON equipment_maintenance_schedules(next_maintenance_date);
        CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_schedules_status ON equipment_maintenance_schedules(status);
        CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_schedules_type ON equipment_maintenance_schedules(maintenance_type);
        
        RAISE NOTICE 'equipment_maintenance_schedules table created successfully';
    ELSE
        RAISE NOTICE 'equipment_maintenance_schedules table already exists';
    END IF;
END $$;

-- 3. Create equipment_maintenance_logs table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'equipment_maintenance_logs') THEN
        
        CREATE TABLE equipment_maintenance_logs (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            equipment_id TEXT NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
            description TEXT NOT NULL,
            maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('preventive', 'corrective', 'emergency')),
            status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
            start_date TIMESTAMP WITH TIME ZONE,
            end_date TIMESTAMP WITH TIME ZONE,
            duration_hours DECIMAL(5,2),
            technician_id TEXT,
            cost DECIMAL(10,2),
            parts_used TEXT[],
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_logs_equipment ON equipment_maintenance_logs(equipment_id);
        CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_logs_status ON equipment_maintenance_logs(status);
        CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_logs_date ON equipment_maintenance_logs(start_date);
        
        RAISE NOTICE 'equipment_maintenance_logs table created successfully';
    ELSE
        RAISE NOTICE 'equipment_maintenance_logs table already exists';
    END IF;
END $$;

-- 4. Set up RLS policies for both tables
DO $$
BEGIN
    -- Disable RLS temporarily
    ALTER TABLE equipment_maintenance_schedules DISABLE ROW LEVEL SECURITY;
    ALTER TABLE equipment_maintenance_logs DISABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "Allow authenticated users to view maintenance schedules" ON equipment_maintenance_schedules;
    DROP POLICY IF EXISTS "Allow managers and admins to manage maintenance schedules" ON equipment_maintenance_schedules;
    DROP POLICY IF EXISTS "Allow authenticated users to create maintenance schedules" ON equipment_maintenance_schedules;
    DROP POLICY IF EXISTS "Allow authenticated users to update maintenance schedules" ON equipment_maintenance_schedules;
    DROP POLICY IF EXISTS "Allow authenticated users to delete maintenance schedules" ON equipment_maintenance_schedules;
    DROP POLICY IF EXISTS "equipment_maintenance_schedules_all_operations" ON equipment_maintenance_schedules;
    
    DROP POLICY IF EXISTS "Allow authenticated users to view maintenance logs" ON equipment_maintenance_logs;
    DROP POLICY IF EXISTS "Allow technicians, managers, and admins to create maintenance logs" ON equipment_maintenance_logs;
    DROP POLICY IF EXISTS "Allow technicians, managers, and admins to update maintenance logs" ON equipment_maintenance_logs;
    DROP POLICY IF EXISTS "Allow authenticated users to create maintenance logs" ON equipment_maintenance_logs;
    DROP POLICY IF EXISTS "Allow authenticated users to update maintenance logs" ON equipment_maintenance_logs;
    DROP POLICY IF EXISTS "Allow authenticated users to delete maintenance logs" ON equipment_maintenance_logs;
    DROP POLICY IF EXISTS "Allow all operations on maintenance logs" ON equipment_maintenance_logs;
    DROP POLICY IF EXISTS "equipment_maintenance_logs_all_operations" ON equipment_maintenance_logs;
    DROP POLICY IF EXISTS "maintenance_logs_all_ops" ON equipment_maintenance_logs;
    
    -- Create simple, permissive policies
    CREATE POLICY "maintenance_schedules_test_policy"
    ON equipment_maintenance_schedules
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
    
    CREATE POLICY "maintenance_logs_test_policy"
    ON equipment_maintenance_logs
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
    
    -- Re-enable RLS
    ALTER TABLE equipment_maintenance_schedules ENABLE ROW LEVEL SECURITY;
    ALTER TABLE equipment_maintenance_logs ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'RLS policies have been set up for both tables';
END $$;

-- 5. Insert sample data if tables are empty
DO $$
BEGIN
    -- Insert sample maintenance schedule if table is empty
    IF (SELECT COUNT(*) FROM equipment_maintenance_schedules) = 0 AND EXISTS (SELECT 1 FROM equipment LIMIT 1) THEN
        INSERT INTO equipment_maintenance_schedules (
            id,
            equipment_id,
            maintenance_type,
            frequency_days,
            frequency_hours,
            last_maintenance_date,
            next_maintenance_date,
            estimated_duration_hours,
            estimated_cost,
            assigned_technician,
            priority,
            status,
            notes
        ) VALUES (
            'test-schedule-' || gen_random_uuid()::text,
            (SELECT id FROM equipment LIMIT 1),
            'preventive',
            30,
            240,
            NOW() - INTERVAL '15 days',
            NOW() + INTERVAL '15 days',
            4.0,
            500.00,
            'test-technician',
            'medium',
            'scheduled',
            'Sample maintenance schedule for testing'
        );
        
        RAISE NOTICE 'Sample maintenance schedule inserted';
    END IF;
    
    -- Insert sample maintenance log if table is empty
    IF (SELECT COUNT(*) FROM equipment_maintenance_logs) = 0 AND EXISTS (SELECT 1 FROM equipment LIMIT 1) THEN
        INSERT INTO equipment_maintenance_logs (
            id,
            equipment_id,
            description,
            maintenance_type,
            status,
            start_date,
            end_date,
            duration_hours,
            technician_id,
            cost,
            parts_used,
            notes
        ) VALUES (
            'test-log-' || gen_random_uuid()::text,
            (SELECT id FROM equipment LIMIT 1),
            'Sample maintenance log for testing',
            'preventive',
            'completed',
            NOW() - INTERVAL '1 day',
            NOW(),
            3.5,
            'test-technician',
            450.00,
            ARRAY['Oil filter', 'Air filter'],
            'Sample maintenance log for testing'
        );
        
        RAISE NOTICE 'Sample maintenance log inserted';
    END IF;
END $$;

-- 6. Final verification
SELECT '=== FINAL VERIFICATION ===' as info;

-- Check both tables exist
SELECT 
    table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name)
        THEN '✅ Exists'
        ELSE '❌ Missing'
    END as status
FROM (VALUES ('equipment_maintenance_logs'), ('equipment_maintenance_schedules')) AS t(table_name);

-- Check record counts
SELECT 'equipment_maintenance_logs' as table_name, COUNT(*) as record_count FROM equipment_maintenance_logs
UNION ALL
SELECT 'equipment_maintenance_schedules' as table_name, COUNT(*) as record_count FROM equipment_maintenance_schedules;

-- Test if we can read from both tables
SELECT 
    'equipment_maintenance_logs' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM equipment_maintenance_logs LIMIT 1)
        THEN '✅ Readable'
        ELSE '❌ Not readable'
    END as read_test
UNION ALL
SELECT 
    'equipment_maintenance_schedules' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM equipment_maintenance_schedules LIMIT 1)
        THEN '✅ Readable'
        ELSE '❌ Not readable'
    END as read_test;

-- Show table structures
SELECT '=== TABLE STRUCTURES ===' as info;

SELECT 
    'equipment_maintenance_logs' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'equipment_maintenance_logs'
ORDER BY ordinal_position;

SELECT 
    'equipment_maintenance_schedules' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'equipment_maintenance_schedules'
ORDER BY ordinal_position; 