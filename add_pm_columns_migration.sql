-- Add PM-related columns to equipment table
-- This migration adds the necessary columns for preventive maintenance functionality

-- 1. Add is_pm column to equipment table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'equipment' AND column_name = 'is_pm'
    ) THEN
        ALTER TABLE equipment ADD COLUMN is_pm BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_pm column to equipment table';
    ELSE
        RAISE NOTICE 'is_pm column already exists in equipment table';
    END IF;
END $$;

-- 2. Add pm_configs column to equipment table (JSONB for storing PM configurations)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'equipment' AND column_name = 'pm_configs'
    ) THEN
        ALTER TABLE equipment ADD COLUMN pm_configs JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added pm_configs column to equipment table';
    ELSE
        RAISE NOTICE 'pm_configs column already exists in equipment table';
    END IF;
END $$;

-- 3. Add operational_status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'equipment' AND column_name = 'operational_status'
    ) THEN
        ALTER TABLE equipment ADD COLUMN operational_status TEXT DEFAULT 'working' 
        CHECK (operational_status IN ('working', 'not_working', 'in_use', 'standby', 'under_repair', 'under_service'));
        RAISE NOTICE 'Added operational_status column to equipment table';
    ELSE
        RAISE NOTICE 'operational_status column already exists in equipment table';
    END IF;
END $$;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_equipment_is_pm ON equipment(is_pm);
CREATE INDEX IF NOT EXISTS idx_equipment_operational_status ON equipment(operational_status);

-- 5. Update existing equipment to have default values
UPDATE equipment SET 
    is_pm = false,
    pm_configs = '[]'::jsonb,
    operational_status = 'working'
WHERE is_pm IS NULL 
   OR pm_configs IS NULL 
   OR operational_status IS NULL;

-- 6. Verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'equipment' 
AND column_name IN ('is_pm', 'pm_configs', 'operational_status')
ORDER BY column_name;

-- 7. Show sample data
SELECT 
    id,
    name,
    type,
    is_pm,
    operational_status,
    pm_configs
FROM equipment
LIMIT 5; 