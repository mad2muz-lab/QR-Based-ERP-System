-- Migration: Update Employee and Material IDs to UUID format
-- This migration changes the primary key generation for employees and materials
-- to use UUIDs instead of prefixed IDs, matching the equipment pattern

-- Update employees table to use UUID generation
ALTER TABLE employees 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Update materials table to use UUID generation  
ALTER TABLE materials 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Add comments to document the change
COMMENT ON TABLE employees IS 'Employees table with UUID-based primary keys for better Honeywell device compatibility';
COMMENT ON TABLE materials IS 'Materials table with UUID-based primary keys for better Honeywell device compatibility';

-- Update the qr_code column to also use UUIDs by default
-- Note: This will be handled by the application logic, not database defaults
COMMENT ON COLUMN employees.qr_code IS 'QR code data - now uses UUID format for better scanner compatibility';
COMMENT ON COLUMN materials.qr_code IS 'QR code data - now uses UUID format for better scanner compatibility'; 