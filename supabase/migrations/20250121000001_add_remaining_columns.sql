-- Add remaining missing columns that are causing schema cache errors

-- Add qr_code column to sites table if it doesn't exist
ALTER TABLE sites ADD COLUMN IF NOT EXISTS qr_code TEXT UNIQUE;

-- Add access_level column to materials table if it doesn't exist
ALTER TABLE materials ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'basic';

-- Update existing records to have proper values
UPDATE sites SET qr_code = 'SITE-' || id WHERE qr_code IS NULL;
UPDATE materials SET access_level = 'basic' WHERE access_level IS NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sites_qr_code ON sites(qr_code);
CREATE INDEX IF NOT EXISTS idx_materials_access_level ON materials(access_level);

-- Add constraint for access_level
ALTER TABLE materials ADD CONSTRAINT IF NOT EXISTS chk_materials_access_level 
  CHECK (access_level IN ('basic', 'restricted', 'admin'));

-- Ensure all tables have the expected structure
-- Force schema cache refresh by updating table comments
COMMENT ON TABLE sites IS 'Sites table with qr_code column - updated';
COMMENT ON TABLE materials IS 'Materials table with access_level column - updated';
COMMENT ON TABLE equipment IS 'Equipment table with serial_number column - updated';
COMMENT ON TABLE employees IS 'Employees table with TEXT IDs - updated';