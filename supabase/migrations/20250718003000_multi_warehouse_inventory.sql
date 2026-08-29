-- Migration: Multi-Warehouse Inventory System
-- Creates: material_stock, warehouse_zones, stock_movements tables
-- Dependencies: sites, materials, users tables

-- ============================================================
-- 1. WAREHOUSE ZONES TABLE
-- Each site/warehouse can have multiple zones (Receiving, Storage, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS warehouse_zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,  -- e.g., "Receiving", "Storage A", "Cold Storage"
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(site_id, name)
);

-- Index for fast lookup by site
CREATE INDEX IF NOT EXISTS idx_warehouse_zones_site ON warehouse_zones(site_id);

-- ============================================================
-- 2. MATERIAL STOCK TABLE
-- Tracks physical stock per material per site per zone
-- ============================================================
CREATE TABLE IF NOT EXISTS material_stock (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES warehouse_zones(id) ON DELETE SET NULL,
  quantity NUMERIC(15,3) DEFAULT 0 NOT NULL,  -- supports decimal units (kg, liters)
  reserved_quantity NUMERIC(15,3) DEFAULT 0 NOT NULL,  -- allocated for POs/transfers
  reorder_level NUMERIC(15,3) DEFAULT 0,  -- auto-reorder threshold
  unit_cost NUMERIC(15,2) DEFAULT 0,  -- cost per unit in SAR
  location_detail TEXT,  -- e.g., "Aisle 3, Rack B, Shelf 2"
  last_counted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(material_id, site_id, zone_id)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_material_stock_material ON material_stock(material_id);
CREATE INDEX IF NOT EXISTS idx_material_stock_site ON material_stock(site_id);
CREATE INDEX IF NOT EXISTS idx_material_stock_zone ON material_stock(zone_id);

-- ============================================================
-- 3. STOCK MOVEMENTS TABLE (Audit Trail)
-- Records every stock change (receive, issue, transfer, adjustment, return)
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  from_site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  to_site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  from_zone_id UUID REFERENCES warehouse_zones(id) ON DELETE SET NULL,
  to_zone_id UUID REFERENCES warehouse_zones(id) ON DELETE SET NULL,
  quantity NUMERIC(15,3) NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('receive', 'issue', 'transfer', 'adjustment', 'return')),
  reference_number TEXT,  -- PO#, GRN#, work order#, etc.
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  metadata JSONB,  -- QR scan data, photos, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stock_movements_material ON stock_movements(material_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_site ON stock_movements(to_site_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON stock_movements(created_at DESC);

-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS
ALTER TABLE warehouse_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Warehouse zones policies
CREATE POLICY "Admin and developer can manage zones"
  ON warehouse_zones FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (users.role = 'admin' OR users.role = 'developer')
  ));

CREATE POLICY "Authenticated users can view zones"
  ON warehouse_zones FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Material stock policies
CREATE POLICY "Admin and developer can manage stock"
  ON material_stock FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (users.role = 'admin' OR users.role = 'developer' OR users.role = 'manager' OR users.role = 'operator')
  ));

CREATE POLICY "Authenticated users can view stock"
  ON material_stock FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Stock movements policies
CREATE POLICY "Admin and developer can manage movements"
  ON stock_movements FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (users.role = 'admin' OR users.role = 'developer' OR users.role = 'manager' OR users.role = 'operator')
  ));

CREATE POLICY "Authenticated users can view movements"
  ON stock_movements FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- 5. AUTOMATIC UPDATED_AT TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_warehouse_zones_updated_at
  BEFORE UPDATE ON warehouse_zones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_material_stock_updated_at
  BEFORE UPDATE ON material_stock
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. HELPER VIEW: Site Stock Summary
-- Aggregates total stock per site for quick dashboard queries
-- ============================================================
CREATE OR REPLACE VIEW site_stock_summary AS
SELECT
  s.id AS site_id,
  s.name AS site_name,
  s.province,
  COUNT(DISTINCT ms.material_id) AS total_materials,
  COALESCE(SUM(ms.quantity), 0) AS total_quantity,
  COALESCE(SUM(ms.quantity * ms.unit_cost), 0) AS total_value,
  COUNT(DISTINCT ms.zone_id) FILTER (WHERE ms.zone_id IS NOT NULL) AS total_zones
FROM sites s
LEFT JOIN material_stock ms ON ms.site_id = s.id
GROUP BY s.id, s.name, s.province;

-- ============================================================
-- 7. HELPER VIEW: Region Stock Summary (by KSA province/region)
-- ============================================================
CREATE OR REPLACE VIEW region_stock_summary AS
SELECT
  s.province AS region,
  COUNT(DISTINCT s.id) AS total_sites,
  COUNT(DISTINCT ms.material_id) AS total_materials,
  COALESCE(SUM(ms.quantity), 0) AS total_quantity,
  COALESCE(SUM(ms.quantity * ms.unit_cost), 0) AS total_value
FROM sites s
LEFT JOIN material_stock ms ON ms.site_id = s.id
GROUP BY s.province
ORDER BY s.province;

-- ============================================================
-- 8. BATCH LOTS TABLE
-- Tracks batch/lot numbers with manufacturing & expiry dates
-- ============================================================
CREATE TABLE IF NOT EXISTS batch_lots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  lot_number TEXT,
  manufacturing_date DATE,
  expiration_date DATE,
  supplier_batch_code TEXT,
  quantity NUMERIC(15,3) NOT NULL,
  unit TEXT DEFAULT 'pcs',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'quarantined')),
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  zone_id UUID REFERENCES warehouse_zones(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(material_id, batch_number)
);

CREATE INDEX IF NOT EXISTS idx_batch_lots_material ON batch_lots(material_id);
CREATE INDEX IF NOT EXISTS idx_batch_lots_expiry ON batch_lots(expiration_date);
CREATE INDEX IF NOT EXISTS idx_batch_lots_status ON batch_lots(status);

-- ============================================================
-- 9. SERIAL NUMBERS TABLE
-- Tracks individual items by serial number
-- ============================================================
CREATE TABLE IF NOT EXISTS serial_numbers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  serial_number TEXT NOT NULL,
  current_location TEXT,
  status TEXT DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'in_use', 'installed', 'returned', 'scrapped')),
  assigned_to TEXT,
  assigned_at TIMESTAMP WITH TIME ZONE,
  warranty_expiry DATE,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  zone_id UUID REFERENCES warehouse_zones(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(material_id, serial_number)
);

CREATE INDEX IF NOT EXISTS idx_serial_numbers_material ON serial_numbers(material_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_status ON serial_numbers(status);

-- ============================================================
-- 10. SUPPLEMENTARY DATA: UPDATE material_stock with selling price, tax
-- ============================================================
ALTER TABLE material_stock ADD COLUMN IF NOT EXISTS selling_price NUMERIC(15,2) DEFAULT 0;
ALTER TABLE material_stock ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) DEFAULT 15;
ALTER TABLE material_stock ADD COLUMN IF NOT EXISTS batch_number TEXT;
ALTER TABLE material_stock ADD COLUMN IF NOT EXISTS expiration_date DATE;

-- ============================================================
-- 11. ROW LEVEL SECURITY (RLS) for new tables
-- ============================================================
ALTER TABLE batch_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE serial_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view batch lots"
  ON batch_lots FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin and developer can manage batch lots"
  ON batch_lots FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (users.role = 'admin' OR users.role = 'developer')
  ));

CREATE POLICY "Authenticated users can view serial numbers"
  ON serial_numbers FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin and developer can manage serial numbers"
  ON serial_numbers FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (users.role = 'admin' OR users.role = 'developer')
  ));

-- ============================================================
-- 12. HELPER VIEW: Items Expiring Soon
-- ============================================================
CREATE OR REPLACE VIEW expiring_materials AS
SELECT
  bl.id AS batch_id,
  bl.material_id,
  m.name AS material_name,
  bl.batch_number,
  bl.manufacturing_date,
  bl.expiration_date,
  bl.quantity,
  bl.status,
  s.name AS site_name,
  z.name AS zone_name,
  CASE
    WHEN bl.expiration_date < NOW()::date THEN 'EXPIRED'
    WHEN bl.expiration_date < NOW()::date + INTERVAL '30 days' THEN 'EXPIRING_SOON'
    ELSE 'OK'
  END AS expiry_status
FROM batch_lots bl
JOIN materials m ON m.id = bl.material_id
LEFT JOIN sites s ON s.id = bl.site_id
LEFT JOIN warehouse_zones z ON z.id = bl.zone_id;