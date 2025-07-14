-- Simple migration to add missing columns without recreating tables

-- Add serial_number to equipment if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = 'serial_number') THEN
        ALTER TABLE equipment ADD COLUMN serial_number TEXT;
    END IF;
END $$;

-- Add access_level to materials if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'access_level') THEN
        ALTER TABLE materials ADD COLUMN access_level TEXT DEFAULT 'basic' CHECK (access_level IN ('basic', 'restricted', 'admin'));
    END IF;
END $$;

-- Add qr_code to sites if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sites' AND column_name = 'qr_code') THEN
        ALTER TABLE sites ADD COLUMN qr_code TEXT UNIQUE;
    END IF;
END $$;

-- Change ID columns to TEXT if they are UUID
DO $$
BEGIN
    -- Check and change employees.id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'id' AND data_type = 'uuid') THEN
        ALTER TABLE employees ALTER COLUMN id TYPE TEXT;
    END IF;
    
    -- Check and change equipment.id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = 'id' AND data_type = 'uuid') THEN
        ALTER TABLE equipment ALTER COLUMN id TYPE TEXT;
    END IF;
    
    -- Check and change materials.id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'id' AND data_type = 'uuid') THEN
        ALTER TABLE materials ALTER COLUMN id TYPE TEXT;
    END IF;
    
    -- Check and change sites.id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sites' AND column_name = 'id' AND data_type = 'uuid') THEN
        ALTER TABLE sites ALTER COLUMN id TYPE TEXT;
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_materials_access_level ON materials(access_level);
CREATE INDEX IF NOT EXISTS idx_sites_qr_code ON sites(qr_code);

-- Update existing data to have proper prefixes if needed
UPDATE employees SET id = 'EMP-' || UPPER(SUBSTRING(MD5(RANDOM()::text), 1, 8)) WHERE id NOT LIKE 'EMP-%';
UPDATE equipment SET id = 'EQP-' || UPPER(SUBSTRING(MD5(RANDOM()::text), 1, 8)) WHERE id NOT LIKE 'EQP-%';
UPDATE materials SET id = 'MAT-' || UPPER(SUBSTRING(MD5(RANDOM()::text), 1, 8)) WHERE id NOT LIKE 'MAT-%';
UPDATE sites SET id = 'SITE-' || UPPER(SUBSTRING(MD5(RANDOM()::text), 1, 8)) WHERE id NOT LIKE 'SITE-%';

-- Update QR codes to match IDs
UPDATE employees SET qr_code = id WHERE qr_code IS NULL OR qr_code NOT LIKE 'EMP-%';
UPDATE equipment SET qr_code = id WHERE qr_code IS NULL OR qr_code NOT LIKE 'EQP-%';
UPDATE materials SET qr_code = id WHERE qr_code IS NULL OR qr_code NOT LIKE 'MAT-%';
UPDATE sites SET qr_code = id WHERE qr_code IS NULL OR qr_code NOT LIKE 'SITE-%';