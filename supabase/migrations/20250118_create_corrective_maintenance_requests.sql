-- Migration: Create Corrective Maintenance Requests Table
-- This adds the new table for corrective maintenance requests
-- No existing functionality is modified or removed

CREATE TABLE IF NOT EXISTS public.corrective_maintenance_requests (
  id text NOT NULL DEFAULT ('cmr-' || replace(gen_random_uuid()::text, '-', '')),
  equipment_id text NOT NULL REFERENCES public.equipment(id),
  equipment_name text NOT NULL,
  equipment_type text NOT NULL,
  equipment_model text,
  site text NOT NULL,
  reported_by text NOT NULL REFERENCES public.users(id),
  reported_at timestamp with time zone DEFAULT now(),
  issue_description text NOT NULL,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  assigned_technician text REFERENCES public.employees(id),
  assigned_at timestamp with time zone,
  estimated_duration_hours numeric,
  actual_duration_hours numeric,
  completion_notes text,
  completed_at timestamp with time zone,
  completed_by text REFERENCES public.users(id),
  total_cost numeric DEFAULT 0,
  parts_used jsonb DEFAULT '[]',
  safety_concerns text,
  attachments jsonb DEFAULT '[]',
  repair_location text CHECK (repair_location IN ('site', 'yard')),
  geo_coordinates point,
  maintenance_start_time timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT corrective_maintenance_requests_pkey PRIMARY KEY (id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_corrective_maintenance_equipment_id ON public.corrective_maintenance_requests(equipment_id);
CREATE INDEX IF NOT EXISTS idx_corrective_maintenance_status ON public.corrective_maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_corrective_maintenance_priority ON public.corrective_maintenance_requests(priority);
CREATE INDEX IF NOT EXISTS idx_corrective_maintenance_reported_at ON public.corrective_maintenance_requests(reported_at);

-- Add RLS policies (if RLS is enabled)
ALTER TABLE public.corrective_maintenance_requests ENABLE ROW LEVEL SECURITY;

-- Policy for users to see their own requests
CREATE POLICY "Users can view their own maintenance requests" ON public.corrective_maintenance_requests
  FOR SELECT USING (auth.uid() = reported_by);

-- Policy for users to insert their own requests
CREATE POLICY "Users can create maintenance requests" ON public.corrective_maintenance_requests
  FOR INSERT WITH CHECK (auth.uid() = reported_by);

-- Policy for users to update their own requests
CREATE POLICY "Users can update their own maintenance requests" ON public.corrective_maintenance_requests
  FOR UPDATE USING (auth.uid() = reported_by);

-- Policy for admins to see all requests
CREATE POLICY "Admins can view all maintenance requests" ON public.corrective_maintenance_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.username = 'admin'
    )
  );

-- Log this migration
INSERT INTO migration_rollback_log (migration_name, rollback_sql) VALUES (
  'create_corrective_maintenance_requests',
  'DROP TABLE IF EXISTS public.corrective_maintenance_requests CASCADE;'
); 