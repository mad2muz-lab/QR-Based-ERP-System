-- Execute this SQL in Supabase SQL Editor to fix the schema issues
-- Go to: https://supabase.com/dashboard/project/lzbvyptjirohluliiitp/sql/new

-- IMPORTANT: This script also restores the users table for authentication
-- If you need user management, run restore_users_table.sql first or uncomment the users section below

-- 1. Check current table structure
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('employees', 'equipment', 'materials', 'sites') 
AND column_name IN ('id', 'serial_number', 'access_level', 'qr_code')
ORDER BY table_name, column_name;

-- 2. Add missing columns if they don't exist
-- Add serial_number to equipment
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS serial_number TEXT;

-- Add access_level to materials
ALTER TABLE materials ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'basic';

-- Add constraint only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'materials_access_level_check') THEN
        ALTER TABLE materials ADD CONSTRAINT materials_access_level_check 
          CHECK (access_level IN ('basic', 'restricted', 'admin'));
    END IF;
END $$;

-- Add qr_code to sites
ALTER TABLE sites ADD COLUMN IF NOT EXISTS qr_code TEXT;

-- 3. Change ID columns from UUID to TEXT (if they are UUID)
-- First alter column type, then update data
DO $$
DECLARE
    rec RECORD;
BEGIN
    -- Check employees table
    SELECT data_type INTO rec FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'id';
    
    IF rec.data_type = 'uuid' THEN
        -- First change column type to TEXT
        ALTER TABLE employees ALTER COLUMN id TYPE TEXT USING id::text;
        -- Then update data with proper prefixes
        UPDATE employees SET id = 'EMP-' || REPLACE(id, '-', '') WHERE id NOT LIKE 'EMP-%';
    END IF;
    
    -- Check equipment table
    SELECT data_type INTO rec FROM information_schema.columns 
    WHERE table_name = 'equipment' AND column_name = 'id';
    
    IF rec.data_type = 'uuid' THEN
        ALTER TABLE equipment ALTER COLUMN id TYPE TEXT USING id::text;
        UPDATE equipment SET id = 'EQP-' || REPLACE(id, '-', '') WHERE id NOT LIKE 'EQP-%';
    END IF;
    
    -- Check materials table
    SELECT data_type INTO rec FROM information_schema.columns 
    WHERE table_name = 'materials' AND column_name = 'id';
    
    IF rec.data_type = 'uuid' THEN
        ALTER TABLE materials ALTER COLUMN id TYPE TEXT USING id::text;
        UPDATE materials SET id = 'MAT-' || REPLACE(id, '-', '') WHERE id NOT LIKE 'MAT-%';
    END IF;
    
    -- Check sites table
    SELECT data_type INTO rec FROM information_schema.columns 
    WHERE table_name = 'sites' AND column_name = 'id';
    
    IF rec.data_type = 'uuid' THEN
        ALTER TABLE sites ALTER COLUMN id TYPE TEXT USING id::text;
        UPDATE sites SET id = 'SITE-' || REPLACE(id, '-', '') WHERE id NOT LIKE 'SITE-%';
    END IF;
END $$;

-- 4. Update QR codes to match IDs
UPDATE employees SET qr_code = id WHERE qr_code IS NULL OR qr_code != id;
UPDATE equipment SET qr_code = id WHERE qr_code IS NULL OR qr_code != id;
UPDATE materials SET qr_code = id WHERE qr_code IS NULL OR qr_code != id;
UPDATE sites SET qr_code = id WHERE qr_code IS NULL OR qr_code != id;

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_materials_access_level ON materials(access_level);
CREATE INDEX IF NOT EXISTS idx_sites_qr_code ON sites(qr_code);

-- 6. Verify the changes
SELECT 'After Fix:' as status;
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('employees', 'equipment', 'materials', 'sites') 
AND column_name IN ('id', 'serial_number', 'access_level', 'qr_code')
ORDER BY table_name, column_name;

-- 7. Show sample data
SELECT 'employees' as table_name, id, qr_code FROM employees LIMIT 3;
SELECT 'equipment' as table_name, id, qr_code, serial_number FROM equipment LIMIT 3;
SELECT 'materials' as table_name, id, qr_code, access_level FROM materials LIMIT 3;
SELECT 'sites' as table_name, id, qr_code FROM sites LIMIT 3;