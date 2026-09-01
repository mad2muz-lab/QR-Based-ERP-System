-- Resource Movement Management System Schema (Minimal)
-- Unified system for managing fleet, equipment, employee, and material movement

-- Check if employees table exists and insert default employee with required fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM employees WHERE id = 'EMP-DEFAULT') THEN
    -- Insert default employee with all required fields
    INSERT INTO employees (
      id, 
      name, 
      email, 
      department,
      position,
      site,
      qr_code,
      status
    ) VALUES (
      'EMP-DEFAULT', 
      'Default Employee', 
      'default@company.com',
      'Logistics',
      'Driver',
      'Main Site',
      'EMP-DEFAULT-QR',
      'active'
    );
  END IF;
END $$;

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

-- 3. Fleet Vehicles
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

-- 4. Fleet Drivers
CREATE TABLE IF NOT EXISTS fleet_drivers (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
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

-- 5. Movement Checkpoints
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_resource_movement_requests_type ON resource_movement_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_resource_movement_requests_status ON resource_movement_requests(status);
CREATE INDEX IF NOT EXISTS idx_resource_movement_executions_request ON resource_movement_executions(request_id);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_status ON fleet_vehicles(status);
CREATE INDEX IF NOT EXISTS idx_fleet_drivers_status ON fleet_drivers(status);

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_resource_movement_requests_updated_at 
  BEFORE UPDATE ON resource_movement_requests 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resource_movement_executions_updated_at 
  BEFORE UPDATE ON resource_movement_executions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fleet_vehicles_updated_at 
  BEFORE UPDATE ON fleet_vehicles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fleet_drivers_updated_at 
  BEFORE UPDATE ON fleet_drivers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_movement_routes_updated_at 
  BEFORE UPDATE ON movement_routes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create summary view
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

-- Verification
SELECT 'Resource Movement Management Schema Created Successfully' as status; 