-- Change primary keys from UUID to TEXT to support user-provided IDs with prefixes
-- This migration updates the schema to use TEXT IDs like EMP-001, EQP-002, etc.

-- First, drop foreign key constraints and recreate tables with TEXT IDs

-- Drop existing tables (this will remove all data - use with caution in production)
DROP TABLE IF EXISTS employee_logs CASCADE;
DROP TABLE IF EXISTS equipment_logs CASCADE;
DROP TABLE IF EXISTS material_logs CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS sites CASCADE;

-- Recreate employees table with TEXT primary key
CREATE TABLE employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
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

-- Recreate equipment table with TEXT primary key
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

-- Recreate materials table with TEXT primary key
CREATE TABLE materials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  unit TEXT NOT NULL,
  site TEXT NOT NULL,
  qr_code TEXT UNIQUE NOT NULL,
  quantity INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('available', 'low-stock', 'out-of-stock')) DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  use TEXT
);

-- Recreate sites table with TEXT primary key
CREATE TABLE sites (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  province TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate log tables with TEXT foreign keys
CREATE TABLE employee_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  department TEXT NOT NULL,
  site TEXT NOT NULL,
  action TEXT CHECK (action IN ('clock-in', 'clock-out')) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME NOT NULL DEFAULT CURRENT_TIME,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  location POINT,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE equipment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id TEXT NOT NULL,
  equipment_name TEXT NOT NULL,
  equipment_type TEXT NOT NULL,
  action TEXT CHECK (action IN ('start-use', 'stop-use')) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME NOT NULL DEFAULT CURRENT_TIME,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  site TEXT NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  location POINT,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
);

CREATE TABLE material_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id TEXT NOT NULL,
  material_name TEXT NOT NULL,
  material_type TEXT NOT NULL,
  action TEXT CHECK (action IN ('material-in', 'material-out')) NOT NULL,
  quantity INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME NOT NULL DEFAULT CURRENT_TIME,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  site TEXT NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  location POINT,
  FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
);

-- Add indexes for better performance
CREATE INDEX idx_employees_site ON employees(site);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_equipment_site ON equipment(site);
CREATE INDEX idx_equipment_type ON equipment(type);
CREATE INDEX idx_materials_site ON materials(site);
CREATE INDEX idx_materials_type ON materials(type);

-- Add indexes for log tables
CREATE INDEX idx_employee_logs_employee_id ON employee_logs(employee_id);
CREATE INDEX idx_employee_logs_date ON employee_logs(date);
CREATE INDEX idx_equipment_logs_equipment_id ON equipment_logs(equipment_id);
CREATE INDEX idx_equipment_logs_date ON equipment_logs(date);
CREATE INDEX idx_material_logs_material_id ON material_logs(material_id);
CREATE INDEX idx_material_logs_date ON material_logs(date);