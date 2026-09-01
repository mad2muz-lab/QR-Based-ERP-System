-- Create purchase_requests table
-- Run this script in your Supabase SQL editor

-- First, create the sequence if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS pr_sequence START 1;

-- Create Purchase Requests (PR) table
CREATE TABLE IF NOT EXISTS purchase_requests (
  id TEXT PRIMARY KEY DEFAULT ('PR-' || replace(gen_random_uuid()::text, '-', '')),
  pr_number TEXT UNIQUE NOT NULL DEFAULT ('PR-' || extract(year from now())::text || '-' || lpad(extract(month from now())::text, 2, '0') || '-' || lpad(nextval('pr_sequence')::text, 4, '0')),
  title TEXT NOT NULL,
  description TEXT,
  requested_by TEXT NOT NULL,
  department TEXT NOT NULL,
  site TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'ordered', 'received', 'closed')) DEFAULT 'draft',
  total_estimated_cost DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'SAR',
  requested_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  required_date TIMESTAMP WITH TIME ZONE,
  approved_date TIMESTAMP WITH TIME ZONE,
  approved_by TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (department) REFERENCES departments(name),
  FOREIGN KEY (site) REFERENCES sites(id)
);

-- Create PR Items table for individual items in a PR
CREATE TABLE IF NOT EXISTS purchase_request_items (
  id TEXT PRIMARY KEY DEFAULT ('PRI-' || replace(gen_random_uuid()::text, '-', '')),
  pr_id TEXT NOT NULL REFERENCES purchase_requests(id) ON DELETE CASCADE,
  material_name TEXT NOT NULL,
  material_type TEXT NOT NULL,
  quantity_required DECIMAL(10,2) NOT NULL,
  quantity_available DECIMAL(10,2) DEFAULT 0,
  unit TEXT NOT NULL,
  estimated_unit_cost DECIMAL(10,2) DEFAULT 0,
  total_estimated_cost DECIMAL(10,2) DEFAULT 0,
  urgency_reason TEXT,
  supplier_suggestion TEXT,
  specifications TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on PR tables
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_request_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for purchase_requests
CREATE POLICY "Allow all operations on purchase_requests"
  ON purchase_requests FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Create RLS policies for purchase_request_items
CREATE POLICY "Allow all operations on purchase_request_items"
  ON purchase_request_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON purchase_requests(status);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_department ON purchase_requests(department);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_site ON purchase_requests(site);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_requested_date ON purchase_requests(requested_date);
CREATE INDEX IF NOT EXISTS idx_purchase_request_items_pr_id ON purchase_request_items(pr_id);
CREATE INDEX IF NOT EXISTS idx_purchase_request_items_material_type ON purchase_request_items(material_type);

-- Add comment to document the tables
COMMENT ON TABLE purchase_requests IS 'Purchase Requests table for material procurement';
COMMENT ON TABLE purchase_request_items IS 'Individual items within purchase requests';
