-- Direct SQL execution to force schema changes
-- This will be executed directly on Supabase

-- Step 1: Check current table structure
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('employees', 'equipment', 'materials', 'sites') 
AND column_name = 'id'
ORDER BY table_name;

-- Step 2: Backup existing data
CREATE TABLE IF NOT EXISTS employees_backup_temp AS SELECT * FROM employees;
CREATE TABLE IF NOT EXISTS equipment_backup_temp AS SELECT * FROM equipment;
CREATE TABLE IF NOT EXISTS materials_backup_temp AS SELECT * FROM materials;
CREATE TABLE IF NOT EXISTS sites_backup_temp AS SELECT * FROM sites;

-- Step 3: Drop existing tables and recreate with TEXT IDs
DROP TABLE IF EXISTS employee_logs CASCADE;
DROP TABLE IF EXISTS equipment_logs CASCADE;
DROP TABLE IF EXISTS material_logs CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS sites CASCADE;

-- Step 4: Create new tables with TEXT IDs
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

-- Step 5: Restore data with proper TEXT IDs
INSERT INTO employees (id, name, department, position, blood_group, site, qr_code, status, created_at, last_updated, photo, email, phone)
SELECT 
  CASE 
    WHEN id::text LIKE 'EMP-%' THEN id::text
    ELSE 'EMP-' || UPPER(SUBSTRING(MD5(RANDOM()::text), 1, 8))
  END,
  name, department, position, blood_group, site, 
  CASE 
    WHEN qr_code LIKE 'EMP-%' THEN qr_code
    ELSE 'EMP-' || UPPER(SUBSTRING(MD5(RANDOM()::text), 1, 8))
  END,
  status, created_at, last_updated, photo, email, phone
FROM employees_backup_temp;

INSERT INTO equipment (id, name, type, model, site, qr_code, status, created_at, last_updated, serial_number)
SELECT 
  CASE 
    WHEN id::text LIKE 'EQP-%' THEN id::text
    ELSE 'EQP-' || UPPER(SUBSTRING(MD5(RANDOM()::text), 1, 8))
  END,
  name, type, model, site,
  CASE 
    WHEN qr_code LIKE 'EQP-%' THEN qr_code
    ELSE 'EQP-' || UPPER(SUBSTRING(MD5(RANDOM()::text), 1, 8))
  END,
  status, created_at, last_updated, serial_number
FROM equipment_backup_temp;

INSERT INTO materials (id, name, type, unit, site, qr_code, quantity, status, created_at, last_updated, use_field, access_level)
SELECT 
  CASE 
    WHEN id::text LIKE 'MAT-%' THEN id::text
    ELSE 'MAT-' || UPPER(SUBSTRING(MD5(RANDOM()::text), 1, 8))
  END,
  name, type, unit, site,
  CASE 
    WHEN qr_code LIKE 'MAT-%' THEN qr_code
    ELSE 'MAT-' || UPPER(SUBSTRING(MD5(RANDOM()::text), 1, 8))
  END,
  quantity, status, created_at, last_updated, use_field, 'basic'
FROM materials_backup_temp;

INSERT INTO sites (id, name, type, province, address, created_at, last_updated, coordinates, manager, qr_code)
SELECT 
  CASE 
    WHEN id::text LIKE 'SITE-%' THEN id::text
    ELSE 'SITE-' || UPPER(SUBSTRING(MD5(RANDOM()::text), 1, 8))
  END,
  name, type, province, address, created_at, last_updated, coordinates, manager,
  CASE 
    WHEN qr_code IS NOT NULL AND qr_code LIKE 'SITE-%' THEN qr_code
    ELSE 'SITE-' || UPPER(SUBSTRING(MD5(RANDOM()::text), 1, 8))
  END
FROM sites_backup_temp;

-- Step 6: Recreate log tables
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

-- Step 7: Create indexes
CREATE INDEX idx_employees_qr_code ON employees(qr_code);
CREATE INDEX idx_equipment_qr_code ON equipment(qr_code);
CREATE INDEX idx_materials_qr_code ON materials(qr_code);
CREATE INDEX idx_sites_qr_code ON sites(qr_code);
CREATE INDEX idx_materials_access_level ON materials(access_level);

-- Step 8: Enable RLS and create policies
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations" ON employees;
DROP POLICY IF EXISTS "Allow all operations" ON equipment;
DROP POLICY IF EXISTS "Allow all operations" ON materials;
DROP POLICY IF EXISTS "Allow all operations" ON sites;

-- Create new policies
CREATE POLICY "Allow all operations" ON employees FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON equipment FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON materials FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON sites FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Step 9: Clean up backup tables
DROP TABLE IF EXISTS employees_backup_temp;
DROP TABLE IF EXISTS equipment_backup_temp;
DROP TABLE IF EXISTS materials_backup_temp;
DROP TABLE IF EXISTS sites_backup_temp;

-- Step 10: Verify the changes
SELECT 'employees' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'employees' AND column_name = 'id'
UNION ALL
SELECT 'equipment' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'equipment' AND column_name = 'id'
UNION ALL
SELECT 'materials' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'materials' AND column_name = 'id'
UNION ALL
SELECT 'sites' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sites' AND column_name = 'id';