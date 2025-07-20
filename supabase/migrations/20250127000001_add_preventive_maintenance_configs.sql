-- Add Preventive Maintenance Configurations Table
-- This table stores maintenance intervals and thresholds for different equipment types

CREATE TABLE IF NOT EXISTS preventive_maintenance_configs (
  id TEXT PRIMARY KEY DEFAULT ('pmc-' || replace(gen_random_uuid()::text, '-', '')),
  equipment_type TEXT NOT NULL UNIQUE,
  class_a_hours INTEGER NOT NULL DEFAULT 40,
  class_b_hours INTEGER NOT NULL DEFAULT 480,
  class_c_hours INTEGER NOT NULL DEFAULT 1920,
  class_a_threshold_hours INTEGER NOT NULL DEFAULT 32,
  class_b_threshold_hours INTEGER NOT NULL DEFAULT 384,
  class_c_threshold_hours INTEGER NOT NULL DEFAULT 1536,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_preventive_maintenance_configs_equipment_type ON preventive_maintenance_configs(equipment_type);
CREATE INDEX IF NOT EXISTS idx_preventive_maintenance_configs_active ON preventive_maintenance_configs(is_active);

-- Enable Row Level Security
ALTER TABLE preventive_maintenance_configs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to view preventive maintenance configs" ON preventive_maintenance_configs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin users to manage preventive maintenance configs" ON preventive_maintenance_configs
  FOR ALL USING (auth.role() = 'authenticated' AND (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'developer')
    )
  ));

-- Insert default configurations for common equipment types
INSERT INTO preventive_maintenance_configs (equipment_type, class_a_hours, class_b_hours, class_c_hours, class_a_threshold_hours, class_b_threshold_hours, class_c_threshold_hours, is_active) VALUES
-- Heavy Machinery
('Excavator', 40, 480, 1920, 32, 384, 1536, true),
('Bulldozer', 40, 480, 1920, 32, 384, 1536, true),
('Motor Grader', 40, 480, 1920, 32, 384, 1536, true),
('Wheel Loader', 40, 480, 1920, 32, 384, 1536, true),
('Backhoe Loader', 40, 480, 1920, 32, 384, 1536, true),
('Asphalt Paver', 40, 480, 1920, 32, 384, 1536, true),
('Road Roller', 40, 480, 1920, 32, 384, 1536, true),
('Compactor', 40, 480, 1920, 32, 384, 1536, true),

-- Lifting Equipment
('Tower Crane', 40, 480, 1920, 32, 384, 1536, true),
('Mobile Crane', 40, 480, 1920, 32, 384, 1536, true),
('Overhead Crane', 40, 480, 1920, 32, 384, 1536, true),
('Forklift', 40, 480, 1920, 32, 384, 1536, true),
('Telehandler', 40, 480, 1920, 32, 384, 1536, true),
('Boom Lift', 40, 480, 1920, 32, 384, 1536, true),
('Scissor Lift', 40, 480, 1920, 32, 384, 1536, true),

-- Transport Vehicles
('Dump Truck', 50, 200, 1000, 40, 160, 800, true),
('Concrete Mixer Truck', 50, 200, 1000, 40, 160, 800, true),
('Water Tanker', 50, 200, 1000, 40, 160, 800, true),
('Fuel Tanker', 50, 200, 1000, 40, 160, 800, true),
('Flatbed Truck', 50, 200, 1000, 40, 160, 800, true),
('Pickup Truck', 50, 200, 1000, 40, 160, 800, true),
('Service Van', 50, 200, 1000, 40, 160, 800, true),
('Car', 50, 200, 1000, 40, 160, 800, true),

-- Power Tools
('Concrete Mixer', 40, 480, 1920, 32, 384, 1536, true),
('Welding Machine', 40, 480, 1920, 32, 384, 1536, true),
('Generator', 40, 480, 1920, 32, 384, 1536, true),
('Air Compressor', 40, 480, 1920, 32, 384, 1536, true),
('Jackhammer', 40, 480, 1920, 32, 384, 1536, true),
('Concrete Saw', 40, 480, 1920, 32, 384, 1536, true),
('Angle Grinder', 40, 480, 1920, 32, 384, 1536, true),
('Drill Press', 40, 480, 1920, 32, 384, 1536, true),

-- Testing Equipment
('Core Drilling Machine', 40, 480, 1920, 32, 384, 1536, true),
('Concrete Test Hammer', 40, 480, 1920, 32, 384, 1536, true),
('Rebar Locator', 40, 480, 1920, 32, 384, 1536, true),
('Soil Compaction Tester', 40, 480, 1920, 32, 384, 1536, true),
('Asphalt Thickness Gauge', 40, 480, 1920, 32, 384, 1536, true),
('Survey Equipment', 40, 480, 1920, 32, 384, 1536, true),

-- Safety Equipment
('Safety Barriers', 40, 480, 1920, 32, 384, 1536, true),
('Warning Lights', 40, 480, 1920, 32, 384, 1536, true),
('Traffic Control Signs', 40, 480, 1920, 32, 384, 1536, true),
('First Aid Station', 40, 480, 1920, 32, 384, 1536, true),
('Fire Extinguisher', 40, 480, 1920, 32, 384, 1536, true),
('Emergency Shower', 40, 480, 1920, 32, 384, 1536, true)

ON CONFLICT (equipment_type) DO NOTHING; 