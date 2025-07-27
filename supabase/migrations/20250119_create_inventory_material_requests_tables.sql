-- Migration: Create Inventory Material Requests Tables
-- This creates new tables for inventory material requests without modifying existing functionality

-- Table for inventory material requests
CREATE TABLE cm_inventory_material_requests (
  id TEXT PRIMARY KEY DEFAULT ('cmimr-' || replace(gen_random_uuid()::text, '-', '')),
  maintenance_request_id TEXT REFERENCES corrective_maintenance_requests(id),
  equipment_id TEXT REFERENCES equipment(id),
  equipment_name TEXT NOT NULL,
  site TEXT NOT NULL,
  requested_by UUID REFERENCES auth.users(id),
  requested_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected', 'issued')),
  priority TEXT DEFAULT 'medium',
  materials_requested JSONB DEFAULT '[]',
  total_estimated_cost NUMERIC DEFAULT 0,
  inventory_notes TEXT,
  issued_by UUID REFERENCES auth.users(id),
  issued_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table for material request items
CREATE TABLE cm_material_request_items (
  id TEXT PRIMARY KEY DEFAULT ('cmri-' || replace(gen_random_uuid()::text, '-', '')),
  inventory_request_id TEXT REFERENCES cm_inventory_material_requests(id),
  material_id TEXT REFERENCES materials(id),
  material_name TEXT NOT NULL,
  material_type TEXT NOT NULL,
  requested_quantity INTEGER NOT NULL,
  issued_quantity INTEGER DEFAULT 0,
  unit TEXT NOT NULL,
  estimated_cost NUMERIC DEFAULT 0,
  quality_grade TEXT DEFAULT 'standard',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add new columns to corrective_maintenance_requests (append approach)
ALTER TABLE corrective_maintenance_requests 
ADD COLUMN IF NOT EXISTS inventory_request_id TEXT REFERENCES cm_inventory_material_requests(id),
ADD COLUMN IF NOT EXISTS inventory_status TEXT DEFAULT 'not_requested' CHECK (inventory_status IN ('not_requested', 'pending', 'awaiting_inventory', 'issued', 'completed'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cm_inventory_material_requests_maintenance_id ON cm_inventory_material_requests(maintenance_request_id);
CREATE INDEX IF NOT EXISTS idx_cm_inventory_material_requests_equipment_id ON cm_inventory_material_requests(equipment_id);
CREATE INDEX IF NOT EXISTS idx_cm_inventory_material_requests_status ON cm_inventory_material_requests(status);
CREATE INDEX IF NOT EXISTS idx_cm_material_request_items_inventory_id ON cm_material_request_items(inventory_request_id);
CREATE INDEX IF NOT EXISTS idx_cm_material_request_items_material_id ON cm_material_request_items(material_id);

-- Log this migration
INSERT INTO migration_rollback_log (migration_name, rollback_sql) VALUES (
  'create_inventory_material_requests_tables',
  '-- Rollback: Remove inventory material requests tables
   -- DROP TABLE IF EXISTS cm_material_request_items;
   -- DROP TABLE IF EXISTS cm_inventory_material_requests;
   -- ALTER TABLE corrective_maintenance_requests DROP COLUMN IF EXISTS inventory_request_id;
   -- ALTER TABLE corrective_maintenance_requests DROP COLUMN IF EXISTS inventory_status;'
); 