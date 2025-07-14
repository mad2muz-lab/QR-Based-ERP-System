-- Force conversion of all tables to use TEXT IDs instead of UUID
-- This migration will drop and recreate tables to ensure proper data types

-- Backup existing data
CREATE TEMP TABLE employees_backup AS SELECT * FROM employees;
CREATE TEMP TABLE equipment_backup AS SELECT * FROM equipment;
CREATE TEMP TABLE materials_backup AS SELECT * FROM materials;
CREATE TEMP TABLE sites_backup AS SELECT * FROM sites;

-- Drop existing tables
DROP TABLE IF EXISTS employee_logs CASCADE;
DROP TABLE IF EXISTS equipment_logs CASCADE;
DROP TABLE IF EXISTS material_logs CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS sites CASCADE;

-- Recreate employees table with TEXT ID
CREATE TABLE employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  blood_group TEXT,
  site TEXT NOT NULL,
  qr_code TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  photo TEXT,
  email TEXT,
  phone TEXT
);

-- Recreate equipment table with TEXT ID
CREATE TABLE equipment (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  model TEXT NOT NULL,
  site TEXT NOT NULL,
  qr_code TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('available', 'in-use', 'maintenance', 'down')) DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  serial_number TEXT
);

-- Recreate materials table with TEXT ID
CREATE TABLE materials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  unit TEXT NOT NULL,
  site TEXT NOT NULL,
  qr_code TEXT UNIQUE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  status TEXT CHECK (status IN ('available', 'low-stock', 'out-of-stock')) DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  use_field TEXT,
  access_level TEXT DEFAULT 'basic' CHECK (access_level IN ('basic', 'restricted', 'admin'))
);

-- Recreate sites table with TEXT ID
CREATE TABLE sites (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  province TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  coordinates POINT,
  manager TEXT,
  qr_code TEXT UNIQUE
);

-- Recreate log tables
CREATE TABLE employee_logs (
  id SERIAL PRIMARY KEY,
  employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE equipment_logs (
  id SERIAL PRIMARY KEY,
  equipment_id TEXT REFERENCES equipment(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE material_logs (
  id SERIAL PRIMARY KEY,
  material_id TEXT REFERENCES materials(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date DATE DEFAULT CURRENT_DATE
);

-- Restore data with proper TEXT IDs
INSERT INTO employees SELECT 
  CASE 
    WHEN id::text LIKE 'EMP-%' THEN id::text
    ELSE 'EMP-' || id::text
  END,
  name, department, position, blood_group, site, qr_code, status, created_at, last_updated, photo, email, phone
FROM employees_backup;

INSERT INTO equipment SELECT 
  CASE 
    WHEN id::text LIKE 'EQP-%' THEN id::text
    ELSE 'EQP-' || id::text
  END,
  name, type, model, site, qr_code, status, created_at, last_updated, serial_number
FROM equipment_backup;

INSERT INTO materials SELECT 
  CASE 
    WHEN id::text LIKE 'MAT-%' THEN id::text
    ELSE 'MAT-' || id::text
  END,
  name, type, unit, site, qr_code, quantity, status, created_at, last_updated, use_field, 'basic'
FROM materials_backup;

INSERT INTO sites SELECT 
  CASE 
    WHEN id::text LIKE 'SITE-%' THEN id::text
    ELSE 'SITE-' || id::text
  END,
  name, type, province, address, created_at, last_updated, coordinates, manager, 
  CASE 
    WHEN qr_code IS NOT NULL THEN qr_code
    ELSE 'SITE-' || id::text
  END
FROM sites_backup;

-- Create indexes
CREATE INDEX idx_employees_qr_code ON employees(qr_code);
CREATE INDEX idx_equipment_qr_code ON equipment(qr_code);
CREATE INDEX idx_materials_qr_code ON materials(qr_code);
CREATE INDEX idx_sites_qr_code ON sites(qr_code);
CREATE INDEX idx_materials_access_level ON materials(access_level);

-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

-- Create permissive policies
CREATE POLICY "Allow all operations" ON employees FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON equipment FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON materials FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON sites FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);