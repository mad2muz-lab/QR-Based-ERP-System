-- Fix missing columns in the schema
-- Add missing columns that the application expects

-- Add qr_code column to sites table
ALTER TABLE sites ADD COLUMN IF NOT EXISTS qr_code TEXT UNIQUE;

-- Add accessLevel column to materials table
ALTER TABLE materials ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'basic';

-- Add coordinates and manager columns to sites table (from TypeScript interface)
ALTER TABLE sites ADD COLUMN IF NOT EXISTS coordinates POINT;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS manager TEXT;

-- Update existing sites to have QR codes if they don't have them
UPDATE sites SET qr_code = 'SITE-' || id WHERE qr_code IS NULL;

-- Update existing materials to have access level if they don't have it
UPDATE materials SET access_level = 'basic' WHERE access_level IS NULL;

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_sites_qr_code ON sites(qr_code);
CREATE INDEX IF NOT EXISTS idx_materials_access_level ON materials(access_level);

-- Add check constraint for access_level
ALTER TABLE materials ADD CONSTRAINT IF NOT EXISTS chk_materials_access_level 
  CHECK (access_level IN ('basic', 'restricted', 'admin'));