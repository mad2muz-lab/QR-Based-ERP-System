-- supabase_schema_2024_07_19.sql
-- This is the authoritative schema for the Supabase database as of 2024-07-19.
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  details jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT audit_log_pkey PRIMARY KEY (id)
);
CREATE TABLE public.class_maintenance_types (
  id text NOT NULL DEFAULT ('cmt-'::text || replace((gen_random_uuid())::text, '-'::text, ''::text)),
  maintenance_type text NOT NULL,
  typical_equipment text NOT NULL,
  spare_part text NOT NULL,
  estimated_quantity numeric NOT NULL DEFAULT 0,
  uom text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT class_maintenance_types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  CONSTRAINT companies_pkey PRIMARY KEY (id)
);
CREATE TABLE public.cost_centers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cost_centers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.departments (
  id text NOT NULL DEFAULT ('dept-'::text || replace((gen_random_uuid())::text, '-'::text, ''::text)),
  name text NOT NULL UNIQUE,
  description text,
  type text,
  created_at timestamp with time zone DEFAULT now(),
  last_updated timestamp with time zone DEFAULT now(),
  CONSTRAINT departments_pkey PRIMARY KEY (id)
);
CREATE TABLE public.employee_logs (
  id text NOT NULL DEFAULT ((('emp-log-'::text || EXTRACT(epoch FROM now())) || '-'::text) || substr(md5((random())::text), 1, 8)),
  employee_id text NOT NULL,
  employee_name text NOT NULL,
  department text NOT NULL,
  site text NOT NULL,
  action text NOT NULL CHECK (action = ANY (ARRAY['clock-in'::text, 'clock-out'::text])),
  date date NOT NULL DEFAULT CURRENT_DATE,
  time time without time zone NOT NULL DEFAULT CURRENT_TIME,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  notes text,
  location point,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  old_id character varying,
  cost_center_code text,
  profit_center_code text,
  CONSTRAINT employee_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.employees (
  id text NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text,
  department text NOT NULL,
  position text NOT NULL,
  blood_group text,
  site text NOT NULL,
  qr_code text NOT NULL UNIQUE,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text])),
  created_at timestamp with time zone DEFAULT now(),
  last_updated timestamp with time zone DEFAULT now(),
  photo text,
  email text,
  phone text,
  old_id character varying,
  companyId uuid,
  cost_center_code text,
  profit_center_code text,
  CONSTRAINT employees_pkey PRIMARY KEY (id),
  CONSTRAINT employees_companyid_fkey FOREIGN KEY (companyId) REFERENCES public.companies(id)
);
CREATE TABLE public.equipment (
  id text NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  model text NOT NULL,
  site text NOT NULL,
  qr_code text NOT NULL UNIQUE,
  status text DEFAULT 'available'::text CHECK (status = ANY (ARRAY['available'::text, 'in-use'::text, 'maintenance'::text, 'down'::text])),
  created_at timestamp with time zone DEFAULT now(),
  last_updated timestamp with time zone DEFAULT now(),
  serial_number text,
  custom_equipment_id text,
  old_id character varying,
  operational_status text DEFAULT 'working'::text CHECK (operational_status = ANY (ARRAY['working'::text, 'not_working'::text, 'in_use'::text, 'standby'::text, 'under_repair'::text, 'under_service'::text])),
  cost_center_code text,
  profit_center_code text,
  CONSTRAINT equipment_pkey PRIMARY KEY (id)
);
CREATE TABLE public.equipment_logs (
  id text NOT NULL DEFAULT ((('eq-log-'::text || EXTRACT(epoch FROM now())) || '-'::text) || substr(md5((random())::text), 1, 8)),
  equipment_id text NOT NULL,
  equipment_name text NOT NULL,
  equipment_type text NOT NULL,
  action text NOT NULL CHECK (action = ANY (ARRAY['start-use'::text, 'stop-use'::text, 'standby-start'::text, 'standby-end'::text, 'maintenance-start'::text, 'maintenance-end'::text])),
  date date NOT NULL DEFAULT CURRENT_DATE,
  time time without time zone NOT NULL DEFAULT CURRENT_TIME,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  site text NOT NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY['available'::text, 'in-use'::text, 'maintenance'::text, 'standby'::text, 'out-of-order'::text])),
  notes text,
  location point,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  old_id character varying,
  cost_center_code text,
  profit_center_code text,
  CONSTRAINT equipment_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.equipment_maintenance_logs (
  id text NOT NULL DEFAULT ('ml-'::text || replace((gen_random_uuid())::text, '-'::text, ''::text)),
  equipment_id text NOT NULL,
  maintenance_type text NOT NULL CHECK (maintenance_type = ANY (ARRAY['repair'::text, 'service'::text])),
  repair_type text CHECK (repair_type = ANY (ARRAY['on_site'::text, 'yard_repair'::text])),
  service_type text CHECK (service_type = ANY (ARRAY['type_a'::text, 'type_b'::text, 'type_c'::text])),
  status text DEFAULT 'scheduled'::text CHECK (status = ANY (ARRAY['scheduled'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])),
  description text,
  technician_notes text,
  parts_used text,
  start_date timestamp with time zone DEFAULT now(),
  completion_date timestamp with time zone,
  completed_by text,
  estimated_duration_hours numeric,
  actual_duration_hours numeric,
  cost numeric,
  next_maintenance_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  equipment_name text,
  old_equipment_id text,
  equipment_type text,
  model text,
  serial_number text,
  site_assignment text,
  cost_center_code text,
  profit_center_code text,
  assigned_technician text,
  workflow_step text DEFAULT 'marked'::text CHECK (workflow_step = ANY (ARRAY['marked'::text, 'inspected'::text, 'in_progress'::text, 'completed'::text])),
  inspection_date timestamp with time zone,
  work_start_date timestamp with time zone,
  work_completion_date timestamp with time zone,
  equipment_condition_before text,
  equipment_condition_after text,
  safety_checks_completed boolean DEFAULT false,
  quality_checks_completed boolean DEFAULT false,
  CONSTRAINT equipment_maintenance_logs_pkey PRIMARY KEY (id),
  CONSTRAINT equipment_maintenance_logs_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.equipment(id)
);
CREATE TABLE public.equipment_maintenance_schedules (
  id text NOT NULL DEFAULT ('ms-'::text || replace((gen_random_uuid())::text, '-'::text, ''::text)),
  equipment_id text NOT NULL,
  schedule_type text NOT NULL CHECK (schedule_type = ANY (ARRAY['preventive'::text, 'corrective'::text, 'emergency'::text])),
  maintenance_type text NOT NULL CHECK (maintenance_type = ANY (ARRAY['repair'::text, 'service'::text])),
  frequency_days integer,
  last_maintenance_date timestamp with time zone,
  next_maintenance_date timestamp with time zone NOT NULL,
  assigned_technician text,
  priority text DEFAULT 'medium'::text CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])),
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT equipment_maintenance_schedules_pkey PRIMARY KEY (id),
  CONSTRAINT equipment_maintenance_schedules_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.equipment(id)
);
CREATE TABLE public.locations (
  id integer NOT NULL DEFAULT nextval('locations_id_seq'::regclass),
  city text NOT NULL,
  province text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  source text DEFAULT 'imported'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT locations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.maintenance_material_request_items (
  id text NOT NULL DEFAULT ('mmri-'::text || replace((gen_random_uuid())::text, '-'::text, ''::text)),
  request_id text,
  material_name text NOT NULL,
  material_type text NOT NULL,
  quantity_requested numeric NOT NULL,
  quantity_issued numeric DEFAULT 0,
  uom text NOT NULL,
  estimated_unit_cost numeric DEFAULT 0,
  actual_unit_cost numeric DEFAULT 0,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'available'::text, 'issued'::text, 'unavailable'::text, 'pr_generated'::text])),
  inventory_notes text,
  pr_id text,
  material_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT maintenance_material_request_items_pkey PRIMARY KEY (id),
  CONSTRAINT maintenance_material_request_items_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id),
  CONSTRAINT maintenance_material_request_items_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.maintenance_material_requests(id)
);
CREATE TABLE public.maintenance_material_requests (
  id text NOT NULL DEFAULT ('mmr-'::text || replace((gen_random_uuid())::text, '-'::text, ''::text)),
  maintenance_log_id text,
  equipment_id text,
  equipment_name text NOT NULL,
  maintenance_class text NOT NULL CHECK (maintenance_class = ANY (ARRAY['A'::text, 'B'::text, 'C'::text])),
  maintenance_type text NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'awaiting_inventory'::text, 'pending_service'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])),
  requested_by text NOT NULL,
  requested_at timestamp with time zone DEFAULT now(),
  issued_by text,
  issued_at timestamp with time zone,
  completed_by text,
  completed_at timestamp with time zone,
  site text NOT NULL,
  priority text DEFAULT 'medium'::text CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text])),
  notes text,
  estimated_duration_hours numeric,
  actual_duration_hours numeric,
  total_estimated_cost numeric DEFAULT 0,
  total_actual_cost numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT maintenance_material_requests_pkey PRIMARY KEY (id),
  CONSTRAINT maintenance_material_requests_maintenance_log_id_fkey FOREIGN KEY (maintenance_log_id) REFERENCES public.equipment_maintenance_logs(id),
  CONSTRAINT maintenance_material_requests_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.equipment(id)
);
CREATE TABLE public.maintenance_workflow_history (
  id text NOT NULL DEFAULT ('mwh-'::text || replace((gen_random_uuid())::text, '-'::text, ''::text)),
  maintenance_log_id text NOT NULL,
  workflow_step text NOT NULL,
  action_performed text NOT NULL,
  performed_by text,
  performed_at timestamp with time zone DEFAULT now(),
  notes text,
  equipment_status_before text,
  equipment_status_after text,
  CONSTRAINT maintenance_workflow_history_pkey PRIMARY KEY (id),
  CONSTRAINT maintenance_workflow_history_maintenance_log_id_fkey FOREIGN KEY (maintenance_log_id) REFERENCES public.equipment_maintenance_logs(id)
);
CREATE TABLE public.material_logs (
  id text NOT NULL DEFAULT ((('mat-log-'::text || EXTRACT(epoch FROM now())) || '-'::text) || substr(md5((random())::text), 1, 8)),
  material_id text NOT NULL,
  material_name text NOT NULL,
  material_type text NOT NULL,
  action text NOT NULL CHECK (action = ANY (ARRAY['material-in'::text, 'material-out'::text, 'transfer'::text, 'adjustment'::text])),
  quantity integer NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  time time without time zone NOT NULL DEFAULT CURRENT_TIME,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  site text NOT NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY['available'::text, 'low-stock'::text, 'out-of-stock'::text, 'reserved'::text])),
  notes text,
  location point,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  old_id character varying,
  cost_center_code text,
  profit_center_code text,
  CONSTRAINT material_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.materials (
  id text NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  unit text NOT NULL,
  site text NOT NULL,
  qr_code text NOT NULL UNIQUE,
  quantity integer DEFAULT 0,
  status text DEFAULT 'available'::text CHECK (status = ANY (ARRAY['available'::text, 'low-stock'::text, 'out-of-stock'::text])),
  created_at timestamp with time zone DEFAULT now(),
  last_updated timestamp with time zone DEFAULT now(),
  use text,
  access_level text DEFAULT 'basic'::text CHECK (access_level = ANY (ARRAY['basic'::text, 'restricted'::text, 'admin'::text])),
  createdAt timestamp with time zone DEFAULT now(),
  old_id character varying,
  cost_center_code text,
  profit_center_code text,
  CONSTRAINT materials_pkey PRIMARY KEY (id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['info'::text, 'warning'::text, 'error'::text, 'success'::text, 'maintenance'::text, 'schedule'::text])),
  entity_type text CHECK (entity_type = ANY (ARRAY['equipment'::text, 'employee'::text, 'material'::text, 'site'::text])),
  entity_id text,
  is_read boolean DEFAULT false,
  action_url text,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.page_access (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  page_name text NOT NULL,
  can_access boolean DEFAULT false,
  can_edit boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  assigned_by uuid,
  assigned_at timestamp with time zone DEFAULT now(),
  CONSTRAINT page_access_pkey PRIMARY KEY (id),
  CONSTRAINT page_access_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT page_access_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES auth.users(id)
);
CREATE TABLE public.preventive_maintenance_configs (
  id text NOT NULL DEFAULT ('pmc-'::text || replace((gen_random_uuid())::text, '-'::text, ''::text)),
  equipment_type text NOT NULL UNIQUE,
  class_a_hours integer NOT NULL DEFAULT 40,
  class_b_hours integer NOT NULL DEFAULT 480,
  class_c_hours integer NOT NULL DEFAULT 1920,
  class_a_threshold_hours integer NOT NULL DEFAULT 32,
  class_b_threshold_hours integer NOT NULL DEFAULT 384,
  class_c_threshold_hours integer NOT NULL DEFAULT 1536,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT preventive_maintenance_configs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profit_centers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profit_centers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.role_page_access (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  role_id uuid,
  page_name text NOT NULL,
  can_access boolean DEFAULT false,
  CONSTRAINT role_page_access_pkey PRIMARY KEY (id),
  CONSTRAINT role_page_access_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id)
);
CREATE TABLE public.roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  parent_role_id uuid,
  CONSTRAINT roles_pkey PRIMARY KEY (id),
  CONSTRAINT roles_parent_role_id_fkey FOREIGN KEY (parent_role_id) REFERENCES public.roles(id)
);
CREATE TABLE public.sites (
  id text NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  province text NOT NULL,
  coordinates point,
  address text NOT NULL,
  manager text NOT NULL,
  last_updated timestamp with time zone DEFAULT now(),
  type text,
  qr_code text,
  cost_center_code text,
  profit_center_code text,
  CONSTRAINT sites_pkey PRIMARY KEY (id)
);
CREATE TABLE public.time_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL,
  entity_type text NOT NULL CHECK (entity_type = ANY (ARRAY['employee'::text, 'equipment'::text, 'material'::text, 'site'::text])),
  action text NOT NULL CHECK (action = ANY (ARRAY['clock-in'::text, 'clock-out'::text, 'start-use'::text, 'stop-use'::text, 'material-in'::text, 'material-out'::text, 'site-checkin'::text])),
  timestamp timestamp with time zone DEFAULT now(),
  site text NOT NULL,
  notes text,
  location point,
  quantity integer,
  cost_center_code text,
  profit_center_code text,
  CONSTRAINT time_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  role text NOT NULL CHECK (role = ANY (ARRAY['technician'::text, 'manager'::text, 'admin'::text, 'viewer'::text])),
  permissions jsonb DEFAULT '{}'::jsonb,
  assigned_by uuid,
  assigned_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  CONSTRAINT user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES auth.users(id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  username text NOT NULL UNIQUE,
  role USER-DEFINED NOT NULL DEFAULT 'viewer'::user_role,
  name text NOT NULL,
  email text,
  site text,
  created_at timestamp with time zone DEFAULT now(),
  last_login timestamp with time zone,
  department text,
  position text,
  phone text,
  avatar_url text,
  is_active boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now(),
  login_count integer DEFAULT 0,
  password_changed_at timestamp with time zone,
  two_factor_enabled boolean DEFAULT false,
  preferences jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
); 