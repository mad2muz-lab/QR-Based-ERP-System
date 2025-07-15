-- Migration: Update Equipment Primary Key Structure
-- Add custom_equipment_id and modify equipment_id to auto-generate UUID
-- Date: 2025-01-14

-- Step 1: Add custom_equipment_id column
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS custom_equipment_id TEXT;

-- Step 2: Migrate existing equipment_id values to custom_equipment_id
UPDATE equipment 
SET custom_equipment_id = id 
WHERE custom_equipment_id IS NULL;

-- Step 3: Make custom_equipment_id NOT NULL and UNIQUE
ALTER TABLE equipment 
ALTER COLUMN custom_equipment_id SET NOT NULL;

ALTER TABLE equipment 
ADD CONSTRAINT equipment_custom_equipment_id_unique UNIQUE (custom_equipment_id);

-- Step 4: Change equipment_id (id) column to UUID with auto-generation
-- First, create a temporary column for new UUIDs
ALTER TABLE equipment ADD COLUMN new_id UUID DEFAULT gen_random_uuid();

-- Update all rows to have new UUIDs
UPDATE equipment SET new_id = gen_random_uuid() WHERE new_id IS NULL;

-- Update foreign key references in related tables
-- Update equipment_logs table
ALTER TABLE equipment_logs ADD COLUMN new_equipment_id UUID;
UPDATE equipment_logs 
SET new_equipment_id = equipment.new_id 
FROM equipment 
WHERE equipment_logs.equipment_id = equipment.id;

-- Update time_logs table (if equipment references exist)
UPDATE time_logs 
SET entity_id = equipment.new_id::text 
FROM equipment 
WHERE time_logs.entity_type = 'equipment' AND time_logs.entity_id = equipment.id;

-- Drop old foreign key constraints and columns
ALTER TABLE equipment_logs DROP COLUMN equipment_id;
ALTER TABLE equipment_logs RENAME COLUMN new_equipment_id TO equipment_id;

-- Drop the old id column and rename new_id to id
ALTER TABLE equipment DROP COLUMN id;
ALTER TABLE equipment RENAME COLUMN new_id TO id;

-- Set the new id column as primary key
ALTER TABLE equipment ADD PRIMARY KEY (id);

-- Set default value for future inserts
ALTER TABLE equipment ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_equipment_custom_equipment_id ON equipment(custom_equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_site ON equipment(site);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);

-- Add check constraint for custom_equipment_id format
ALTER TABLE equipment 
ADD CONSTRAINT equipment_custom_equipment_id_format 
CHECK (custom_equipment_id ~ '^[A-Z0-9-]{1,10}$');

-- Update RLS policies if they exist
DROP POLICY IF EXISTS "Users can view equipment" ON equipment;
DROP POLICY IF EXISTS "Users can insert equipment" ON equipment;
DROP POLICY IF EXISTS "Users can update equipment" ON equipment;
DROP POLICY IF EXISTS "Users can delete equipment" ON equipment;

-- Recreate RLS policies with new structure
CREATE POLICY "Users can view equipment" ON equipment
  FOR SELECT USING (true);

CREATE POLICY "Users can insert equipment" ON equipment
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update equipment" ON equipment
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete equipment" ON equipment
  FOR DELETE USING (true);

-- Add comment to document the change
COMMENT ON COLUMN equipment.id IS 'Auto-generated UUID primary key';
COMMENT ON COLUMN equipment.custom_equipment_id IS 'User-defined unique equipment identifier (alphanumeric, dashes, max 10 chars)';