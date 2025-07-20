-- Fix Missing Cost Center Columns Migration
-- This migration adds back the cost_center_code and profit_center_code columns
-- that were accidentally removed by the force_text_ids migration

-- Add cost_center_code and profit_center_code columns to equipment table
ALTER TABLE public.equipment 
ADD COLUMN IF NOT EXISTS cost_center_code text,
ADD COLUMN IF NOT EXISTS profit_center_code text;

-- Add cost_center_code and profit_center_code columns to employees table (if missing)
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS cost_center_code text,
ADD COLUMN IF NOT EXISTS profit_center_code text;

-- Add cost_center_code and profit_center_code columns to materials table (if missing)
ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS cost_center_code text,
ADD COLUMN IF NOT EXISTS profit_center_code text;

-- Add cost_center_code and profit_center_code columns to sites table (if missing)
ALTER TABLE public.sites 
ADD COLUMN IF NOT EXISTS cost_center_code text,
ADD COLUMN IF NOT EXISTS profit_center_code text;

-- Add cost_center_code and profit_center_code columns to log tables (if missing)
ALTER TABLE public.employee_logs 
ADD COLUMN IF NOT EXISTS cost_center_code text,
ADD COLUMN IF NOT EXISTS profit_center_code text;

ALTER TABLE public.equipment_logs 
ADD COLUMN IF NOT EXISTS cost_center_code text,
ADD COLUMN IF NOT EXISTS profit_center_code text;

ALTER TABLE public.material_logs 
ADD COLUMN IF NOT EXISTS cost_center_code text,
ADD COLUMN IF NOT EXISTS profit_center_code text;

-- Add cost_center_code and profit_center_code columns to maintenance tables (if missing)
ALTER TABLE public.equipment_maintenance_logs 
ADD COLUMN IF NOT EXISTS cost_center_code text,
ADD COLUMN IF NOT EXISTS profit_center_code text;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_equipment_cost_center ON public.equipment(cost_center_code);
CREATE INDEX IF NOT EXISTS idx_equipment_profit_center ON public.equipment(profit_center_code);
CREATE INDEX IF NOT EXISTS idx_employees_cost_center ON public.employees(cost_center_code);
CREATE INDEX IF NOT EXISTS idx_employees_profit_center ON public.employees(profit_center_code);
CREATE INDEX IF NOT EXISTS idx_materials_cost_center ON public.materials(cost_center_code);
CREATE INDEX IF NOT EXISTS idx_materials_profit_center ON public.materials(profit_center_code);
CREATE INDEX IF NOT EXISTS idx_sites_cost_center ON public.sites(cost_center_code);
CREATE INDEX IF NOT EXISTS idx_sites_profit_center ON public.sites(profit_center_code);

-- Create indexes for log tables for analytics performance
CREATE INDEX IF NOT EXISTS idx_employee_logs_cost_center ON public.employee_logs(cost_center_code);
CREATE INDEX IF NOT EXISTS idx_employee_logs_profit_center ON public.employee_logs(profit_center_code);
CREATE INDEX IF NOT EXISTS idx_equipment_logs_cost_center ON public.equipment_logs(cost_center_code);
CREATE INDEX IF NOT EXISTS idx_equipment_logs_profit_center ON public.equipment_logs(profit_center_code);
CREATE INDEX IF NOT EXISTS idx_material_logs_cost_center ON public.material_logs(cost_center_code);
CREATE INDEX IF NOT EXISTS idx_material_logs_profit_center ON public.material_logs(profit_center_code);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_logs_cost_center ON public.equipment_maintenance_logs(cost_center_code);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_logs_profit_center ON public.equipment_maintenance_logs(profit_center_code);

-- Ensure cost_centers and profit_centers tables exist
CREATE TABLE IF NOT EXISTS public.cost_centers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cost_centers_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.profit_centers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profit_centers_pkey PRIMARY KEY (id)
);

-- Insert sample data for cost centers (if not exists)
INSERT INTO public.cost_centers (code, name, description) VALUES
('CC001', 'Production', 'Production department cost center'),
('CC002', 'Maintenance', 'Maintenance and repair cost center'),
('CC003', 'Administration', 'Administrative operations cost center'),
('CC004', 'Logistics', 'Logistics and transportation cost center'),
('CC005', 'Quality Control', 'Quality assurance and control cost center')
ON CONFLICT (code) DO NOTHING;

-- Insert sample data for profit centers (if not exists)
INSERT INTO public.profit_centers (code, name, description) VALUES
('PC001', 'North Region', 'Northern region profit center'),
('PC002', 'South Region', 'Southern region profit center'),
('PC003', 'East Region', 'Eastern region profit center'),
('PC004', 'West Region', 'Western region profit center'),
('PC005', 'Central Region', 'Central region profit center')
ON CONFLICT (code) DO NOTHING;

-- Enable RLS on cost_centers and profit_centers tables
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profit_centers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cost_centers
CREATE POLICY "Allow all operations on cost_centers"
  ON public.cost_centers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Create RLS policies for profit_centers
CREATE POLICY "Allow all operations on profit_centers"
  ON public.profit_centers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true); 