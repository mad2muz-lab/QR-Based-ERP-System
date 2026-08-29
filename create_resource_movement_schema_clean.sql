-- Resource Movement Management System Schema (Clean)
-- Unified system for managing fleet, equipment, employee, and material movement

-- ===== CHECK IF EMPLOYEES TABLE EXISTS =====
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'employees') THEN
    -- Create a minimal employees table if it doesn't exist
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Insert a default employee for testing
    INSERT INTO employees (id, name, email) 
    VALUES ('EMP-DEFAULT', 'Default Employee', 'default@company.com')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- ===== RESOURCE MOVEMENT TABLES =====

-- 1. Resource Movement Requests
CREATE TABLE IF NOT EXISTS resource_movement_requests (
  id TEXT PRIMARY KEY,
  request_type TEXT NOT NULL CHECK (request_type IN ('fleet', 'equipment', 'employee', 'material')),
  entity_id TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit TEXT DEFAULT 'unit',
  location_from TEXT NOT NULL,
  location_to TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'in_progress', 'completed', 'cancelled')),
  estimated_duration INTEGER,
  estimated_cost DECIMAL(10,2),
  actual_duration INTEGER,
  actual_cost DECIMAL(10,2),
  notes TEXT,
  reference_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Resource Movement Executions
CREATE TABLE IF NOT EXISTS resource_movement_executions (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES resource_movement_requests(id) ON DELETE CASCADE,
  execution_type TEXT NOT NULL CHECK (execution_type IN ('fleet', 'equipment', 'employee', 'material')),
  vehicle_id TEXT,
  driver_id TEXT,
  route_plan TEXT,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  executed_by TEXT NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed', 'cancelled')),
  actual_route TEXT,
  fuel_consumed DECIMAL(8,2),
  distance_traveled DECIMAL(8,2),
  cost_center TEXT,
  profit_center TEXT,
  cross_charge_amount DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Movement Checkpoints
CREATE TABLE IF NOT EXISTS movement_checkpoints (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL REFERENCES resource_movement_executions(id) ON DELETE CASCADE,
  checkpoint_name TEXT NOT NULL,
  location TEXT NOT NULL,
  checkpoint_type TEXT NOT NULL CHECK (checkpoint_type IN ('start', 'pickup', 'delivery', 'end')),
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scanned_by TEXT NOT NULL,
  qr_code TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Fleet Vehicles
CREATE TABLE IF NOT EXISTS fleet_vehicles (
  id TEXT PRIMARY KEY,
  vehicle_number TEXT UNIQUE NOT NULL,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('truck', 'van', 'car', 'bus', 'trailer')),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  license_plate TEXT UNIQUE,
  capacity TEXT,
  fuel_type TEXT CHECK (fuel_type IN ('diesel', 'petrol', 'electric', 'hybrid')),
  current_location TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'out_of_service')),
  assigned_driver_id TEXT,
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  insurance_expiry DATE,
  registration_expiry DATE,
  purchase_date DATE,
  purchase_cost DECIMAL(10,2),
  current_value DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Fleet Drivers
CREATE TABLE IF NOT EXISTS fleet_drivers (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  driver_license_number TEXT UNIQUE NOT NULL,
  license_type TEXT NOT NULL CHECK (license_type IN ('light_vehicle', 'heavy_vehicle', 'commercial')),
  license_expiry DATE NOT NULL,
  driving_experience_years INTEGER,
  specialized_certifications TEXT[],
  current_vehicle_id TEXT REFERENCES fleet_vehicles(id),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'on_trip', 'off_duty', 'suspended')),
  total_trips INTEGER DEFAULT 0,
  total_distance DECIMAL(10,2) DEFAULT 0,
  safety_rating DECIMAL(3,2) DEFAULT 5.00,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for employee_id if employees table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'employees') THEN
    ALTER TABLE fleet_drivers 
    ADD CONSTRAINT fleet_drivers_employee_id_fkey 
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 6. Movement Routes
CREATE TABLE IF NOT EXISTS movement_routes (
  id TEXT PRIMARY KEY,
  route_name TEXT NOT NULL,
  route_type TEXT NOT NULL CHECK (route_type IN ('standard', 'optimized', 'custom')),
  start_location TEXT NOT NULL,
  end_location TEXT NOT NULL,
  waypoints TEXT[],
  estimated_distance DECIMAL(8,2),
  estimated_duration INTEGER,
  fuel_consumption DECIMAL(8,2),
  toll_charges DECIMAL(8,2),
  route_description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Movement Costs
CREATE TABLE IF NOT EXISTS movement_costs (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL REFERENCES resource_movement_executions(id) ON DELETE CASCADE,
  cost_type TEXT NOT NULL CHECK (cost_type IN ('fuel', 'toll', 'labor', 'maintenance', 'other')),
  cost_description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'SAR',
  cost_center TEXT,
  profit_center TEXT,
  receipt_reference TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Movement Analytics
CREATE TABLE IF NOT EXISTS movement_analytics (
  id TEXT PRIMARY KEY,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('fleet', 'equipment', 'employee', 'material')),
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_movements INTEGER DEFAULT 0,
  total_distance DECIMAL(10,2) DEFAULT 0,
  total_duration INTEGER DEFAULT 0,
  total_cost DECIMAL(10,2) DEFAULT 0,
  average_cost_per_movement DECIMAL(10,2) DEFAULT 0,
  efficiency_score DECIMAL(5,2) DEFAULT 0,
  fuel_efficiency DECIMAL(8,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== INDEXES =====
CREATE INDEX IF NOT EXISTS idx_resource_movement_requests_type ON resource_movement_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_resource_movement_requests_status ON resource_movement_requests(status);
CREATE INDEX IF NOT EXISTS idx_resource_movement_requests_entity ON resource_movement_requests(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_resource_movement_executions_request ON resource_movement_executions(request_id);
CREATE INDEX IF NOT EXISTS idx_resource_movement_executions_status ON resource_movement_executions(status);
CREATE INDEX IF NOT EXISTS idx_movement_checkpoints_execution ON movement_checkpoints(execution_id);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_status ON fleet_vehicles(status);
CREATE INDEX IF NOT EXISTS idx_fleet_drivers_status ON fleet_drivers(status);
CREATE INDEX IF NOT EXISTS idx_movement_routes_active ON movement_routes(is_active);
CREATE INDEX IF NOT EXISTS idx_movement_costs_execution ON movement_costs(execution_id);
CREATE INDEX IF NOT EXISTS idx_movement_analytics_period ON movement_analytics(period_type, period_start, period_end);

-- ===== ROW LEVEL SECURITY (RLS) =====
ALTER TABLE resource_movement_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_movement_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE movement_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE movement_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE movement_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE movement_analytics ENABLE ROW LEVEL SECURITY;

-- ===== RLS POLICIES =====
-- Resource Movement Requests
DROP POLICY IF EXISTS "Users can view movement requests" ON resource_movement_requests;
CREATE POLICY "Users can view movement requests" ON resource_movement_requests
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create movement requests" ON resource_movement_requests;
CREATE POLICY "Users can create movement requests" ON resource_movement_requests
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update movement requests" ON resource_movement_requests;
CREATE POLICY "Users can update movement requests" ON resource_movement_requests
  FOR UPDATE USING (true);

-- Resource Movement Executions
DROP POLICY IF EXISTS "Users can view movement executions" ON resource_movement_executions;
CREATE POLICY "Users can view movement executions" ON resource_movement_executions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create movement executions" ON resource_movement_executions;
CREATE POLICY "Users can create movement executions" ON resource_movement_executions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update movement executions" ON resource_movement_executions;
CREATE POLICY "Users can update movement executions" ON resource_movement_executions
  FOR UPDATE USING (true);

-- Movement Checkpoints
DROP POLICY IF EXISTS "Users can view movement checkpoints" ON movement_checkpoints;
CREATE POLICY "Users can view movement checkpoints" ON movement_checkpoints
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create movement checkpoints" ON movement_checkpoints;
CREATE POLICY "Users can create movement checkpoints" ON movement_checkpoints
  FOR INSERT WITH CHECK (true);

-- Fleet Vehicles
DROP POLICY IF EXISTS "Users can view fleet vehicles" ON fleet_vehicles;
CREATE POLICY "Users can view fleet vehicles" ON fleet_vehicles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage fleet vehicles" ON fleet_vehicles;
CREATE POLICY "Users can manage fleet vehicles" ON fleet_vehicles
  FOR ALL USING (true);

-- Fleet Drivers
DROP POLICY IF EXISTS "Users can view fleet drivers" ON fleet_drivers;
CREATE POLICY "Users can view fleet drivers" ON fleet_drivers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage fleet drivers" ON fleet_drivers;
CREATE POLICY "Users can manage fleet drivers" ON fleet_drivers
  FOR ALL USING (true);

-- Movement Routes
DROP POLICY IF EXISTS "Users can view movement routes" ON movement_routes;
CREATE POLICY "Users can view movement routes" ON movement_routes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage movement routes" ON movement_routes;
CREATE POLICY "Users can manage movement routes" ON movement_routes
  FOR ALL USING (true);

-- Movement Costs
DROP POLICY IF EXISTS "Users can view movement costs" ON movement_costs;
CREATE POLICY "Users can view movement costs" ON movement_costs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage movement costs" ON movement_costs;
CREATE POLICY "Users can manage movement costs" ON movement_costs
  FOR ALL USING (true);

-- Movement Analytics
DROP POLICY IF EXISTS "Users can view movement analytics" ON movement_analytics;
CREATE POLICY "Users can view movement analytics" ON movement_analytics
  FOR SELECT USING (true);

-- ===== TRIGGERS =====
-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_resource_movement_requests_updated_at ON resource_movement_requests;
CREATE TRIGGER update_resource_movement_requests_updated_at 
  BEFORE UPDATE ON resource_movement_requests 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_resource_movement_executions_updated_at ON resource_movement_executions;
CREATE TRIGGER update_resource_movement_executions_updated_at 
  BEFORE UPDATE ON resource_movement_executions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fleet_vehicles_updated_at ON fleet_vehicles;
CREATE TRIGGER update_fleet_vehicles_updated_at 
  BEFORE UPDATE ON fleet_vehicles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fleet_drivers_updated_at ON fleet_drivers;
CREATE TRIGGER update_fleet_drivers_updated_at 
  BEFORE UPDATE ON fleet_drivers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_movement_routes_updated_at ON movement_routes;
CREATE TRIGGER update_movement_routes_updated_at 
  BEFORE UPDATE ON movement_routes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== VIEWS =====
-- Resource Movement Summary View
DROP VIEW IF EXISTS resource_movement_summary;
CREATE OR REPLACE VIEW resource_movement_summary AS
SELECT 
  rmr.id,
  rmr.request_type,
  rmr.entity_name,
  rmr.entity_type,
  rmr.location_from,
  rmr.location_to,
  rmr.status as request_status,
  rmr.priority,
  rmr.requested_at,
  rmr.estimated_duration,
  rmr.estimated_cost,
  rme.status as execution_status,
  rme.start_time,
  rme.end_time,
  rmr.actual_duration,
  rmr.actual_cost,
  fv.vehicle_number,
  fd.driver_license_number,
  COALESCE(e.name, 'Unknown Driver') as driver_name
FROM resource_movement_requests rmr
LEFT JOIN resource_movement_executions rme ON rmr.id = rme.request_id
LEFT JOIN fleet_vehicles fv ON rme.vehicle_id = fv.id
LEFT JOIN fleet_drivers fd ON rme.driver_id = fd.id
LEFT JOIN employees e ON fd.employee_id = e.id;

-- Fleet Utilization View
DROP VIEW IF EXISTS fleet_utilization;
CREATE OR REPLACE VIEW fleet_utilization AS
SELECT 
  fv.id,
  fv.vehicle_number,
  fv.vehicle_type,
  fv.make,
  fv.model,
  fv.status,
  fv.current_location,
  COUNT(rme.id) as total_trips,
  COALESCE(SUM(rme.distance_traveled), 0) as total_distance,
  COALESCE(SUM(rme.fuel_consumed), 0) as total_fuel,
  CASE 
    WHEN SUM(rme.fuel_consumed) > 0 THEN AVG(rme.distance_traveled / rme.fuel_consumed)
    ELSE 0 
  END as avg_fuel_efficiency,
  COALESCE(SUM(rme.cross_charge_amount), 0) as total_cost
FROM fleet_vehicles fv
LEFT JOIN resource_movement_executions rme ON fv.id = rme.vehicle_id
GROUP BY fv.id, fv.vehicle_number, fv.vehicle_type, fv.make, fv.model, fv.status, fv.current_location;

-- Driver Performance View
DROP VIEW IF EXISTS driver_performance;
CREATE OR REPLACE VIEW driver_performance AS
SELECT 
  fd.id,
  COALESCE(e.name, 'Unknown Driver') as driver_name,
  fd.driver_license_number,
  fd.license_type,
  fd.status,
  fd.total_trips,
  fd.total_distance,
  fd.safety_rating,
  COUNT(rme.id) as trips_this_month,
  COALESCE(SUM(rme.distance_traveled), 0) as distance_this_month,
  AVG(EXTRACT(EPOCH FROM (rme.end_time - rme.start_time))/60) as avg_trip_duration
FROM fleet_drivers fd
LEFT JOIN employees e ON fd.employee_id = e.id
LEFT JOIN resource_movement_executions rme ON fd.id = rme.driver_id 
  AND rme.executed_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY fd.id, e.name, fd.driver_license_number, fd.license_type, fd.status, fd.total_trips, fd.total_distance, fd.safety_rating;

-- ===== VERIFICATION =====
SELECT 'Resource Movement Management Schema Created Successfully' as status;

-- Check tables created
SELECT 
  table_name,
  'Table' as type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'resource_movement_requests',
    'resource_movement_executions', 
    'movement_checkpoints',
    'fleet_vehicles',
    'fleet_drivers',
    'movement_routes',
    'movement_costs',
    'movement_analytics'
  )
ORDER BY table_name;

-- Check views created
SELECT 
  table_name,
  'View' as type
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name IN (
    'resource_movement_summary',
    'fleet_utilization',
    'driver_performance'
  )
ORDER BY table_name; 