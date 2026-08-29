-- Fix PM Classification System and Cost Sources
-- This script establishes proper PM classifications and cost estimates

-- =====================================================
-- 1. CREATE PM TYPE DEFINITIONS WITH STANDARD COSTS
-- =====================================================

-- Create preventive_maintenance_types table if it doesn't exist
CREATE TABLE IF NOT EXISTS preventive_maintenance_types (
  id TEXT PRIMARY KEY DEFAULT ('pmt-' || replace(gen_random_uuid()::text, '-', '')),
  maintenance_type TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  standard_cost DECIMAL(10,2) NOT NULL,
  estimated_hours INTEGER NOT NULL,
  frequency_days INTEGER NOT NULL,
  checklist_items TEXT[] NOT NULL,
  spare_parts TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert standard PM type definitions with costs
INSERT INTO preventive_maintenance_types (
  maintenance_type, 
  description, 
  standard_cost, 
  estimated_hours, 
  frequency_days, 
  checklist_items, 
  spare_parts
) VALUES
-- Class A: Basic Preventive Maintenance
('Class A', 
 'Basic Service - Oil changes, filter replacements, inspections, minor adjustments', 
 500.00, 
 2, 
 90, 
 ARRAY[
   'Check and top up engine oil',
   'Replace oil filter',
   'Check and clean air filter',
   'Inspect belts and hoses',
   'Check tire pressure and condition',
   'Inspect lights and signals',
   'Check fluid levels (brake, coolant, transmission)',
   'Lubricate moving parts',
   'Inspect electrical connections',
   'Check safety equipment'
 ], 
 ARRAY['Engine Oil', 'Oil Filter', 'Air Filter', 'Grease', 'Brake Fluid']
),

-- Class B: Standard Preventive Maintenance  
('Class B', 
 'Standard Service - Fluid changes, belt replacements, minor repairs, system checks', 
 1500.00, 
 4, 
 365, 
 ARRAY[
   'Complete Class A service',
   'Replace hydraulic fluid',
   'Replace transmission fluid',
   'Replace drive belts',
   'Inspect and adjust brakes',
   'Check wheel alignment',
   'Inspect suspension components',
   'Test hydraulic systems',
   'Check engine performance',
   'Inspect transmission',
   'Test electrical systems',
   'Check emission systems'
 ], 
 ARRAY['Hydraulic Fluid', 'Transmission Fluid', 'Drive Belts', 'Brake Pads', 'Suspension Parts']
),

-- Class C: Major Preventive Maintenance
('Class C', 
 'Major Service - Overhauls, major component replacements, complete system inspection', 
 3000.00, 
 8, 
 730, 
 ARRAY[
   'Complete Class B service',
   'Engine tune-up and adjustment',
   'Transmission service',
   'Hydraulic system overhaul',
   'Electrical system inspection',
   'Safety system certification',
   'Structural integrity check',
   'Performance testing',
   'Calibration of instruments',
   'Complete lubrication service',
   'Cooling system service',
   'Fuel system inspection'
 ], 
 ARRAY['Engine Parts', 'Transmission Parts', 'Hydraulic Components', 'Electrical Components', 'Safety Equipment']
)

ON CONFLICT (maintenance_type) DO UPDATE SET
  description = EXCLUDED.description,
  standard_cost = EXCLUDED.standard_cost,
  estimated_hours = EXCLUDED.estimated_hours,
  frequency_days = EXCLUDED.frequency_days,
  checklist_items = EXCLUDED.checklist_items,
  spare_parts = EXCLUDED.spare_parts,
  updated_at = NOW();

-- =====================================================
-- 2. ADD COST FIELDS TO PM CONFIGURATIONS
-- =====================================================

-- Add cost estimate fields to preventive_maintenance_configs if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'preventive_maintenance_configs' AND column_name = 'class_a_cost') THEN
        ALTER TABLE preventive_maintenance_configs ADD COLUMN class_a_cost DECIMAL(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'preventive_maintenance_configs' AND column_name = 'class_b_cost') THEN
        ALTER TABLE preventive_maintenance_configs ADD COLUMN class_b_cost DECIMAL(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'preventive_maintenance_configs' AND column_name = 'class_c_cost') THEN
        ALTER TABLE preventive_maintenance_configs ADD COLUMN class_c_cost DECIMAL(10,2);
    END IF;
END $$;

-- Update PM configs with standard costs
UPDATE preventive_maintenance_configs 
SET 
  class_a_cost = 500.00,
  class_b_cost = 1500.00,
  class_c_cost = 3000.00
WHERE class_a_cost IS NULL OR class_b_cost IS NULL OR class_c_cost IS NULL;

-- =====================================================
-- 3. FIX EQUIPMENT PM CLASSIFICATIONS
-- =====================================================

-- Set default PM class for equipment that don't have one
UPDATE equipment 
SET pm_class = 'Class A'
WHERE is_pm = true AND (pm_class IS NULL OR pm_class = '');

-- Set PM frequency days based on PM class
UPDATE equipment 
SET pm_frequency_days = 
    CASE 
        WHEN pm_class = 'Class A' THEN 90
        WHEN pm_class = 'Class B' THEN 365
        WHEN pm_class = 'Class C' THEN 730
        ELSE 90
    END
WHERE is_pm = true AND pm_frequency_days IS NULL;

-- Set cost estimates based on PM class
UPDATE equipment 
SET pm_cost_estimate = 
    CASE 
        WHEN pm_class = 'Class A' THEN 500.00
        WHEN pm_class = 'Class B' THEN 1500.00
        WHEN pm_class = 'Class C' THEN 3000.00
        ELSE 500.00
    END
WHERE is_pm = true AND pm_cost_estimate IS NULL;

-- =====================================================
-- 4. CREATE EQUIPMENT-SPECIFIC COST ADJUSTMENTS
-- =====================================================

-- Add equipment-specific cost multipliers based on type
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS pm_cost_multiplier DECIMAL(3,2) DEFAULT 1.00;

-- Set cost multipliers based on equipment type complexity
UPDATE equipment 
SET pm_cost_multiplier = 
    CASE 
        -- Heavy machinery - higher costs
        WHEN type IN ('Excavator', 'Bulldozer', 'Crane', 'Forklift') THEN 1.50
        -- Transport vehicles - medium costs  
        WHEN type IN ('Truck', 'Car', 'Van', 'Bus') THEN 1.25
        -- Light equipment - standard costs
        WHEN type IN ('Generator', 'Compressor', 'Pump') THEN 1.00
        -- Tools and small equipment - lower costs
        WHEN type IN ('Drill', 'Saw', 'Welder') THEN 0.75
        ELSE 1.00
    END
WHERE is_pm = true;

-- Apply cost multipliers to get final cost estimates
UPDATE equipment 
SET pm_cost_estimate = pm_cost_estimate * pm_cost_multiplier
WHERE is_pm = true AND pm_cost_multiplier IS NOT NULL;

-- =====================================================
-- 5. CREATE PM CLASSIFICATION VIEW
-- =====================================================

-- Create a view for easy PM classification lookup
CREATE OR REPLACE VIEW pm_classification_summary AS
SELECT 
    pm_class,
    CASE 
        WHEN pm_class = 'Class A' THEN 'Basic Service'
        WHEN pm_class = 'Class B' THEN 'Standard Service' 
        WHEN pm_class = 'Class C' THEN 'Major Service'
        ELSE 'Unknown'
    END as service_level,
    CASE 
        WHEN pm_class = 'Class A' THEN 'Oil changes, filters, inspections, minor adjustments'
        WHEN pm_class = 'Class B' THEN 'Fluid changes, belt replacements, minor repairs, system checks'
        WHEN pm_class = 'Class C' THEN 'Overhauls, major component replacements, complete system inspection'
        ELSE 'Service scope not defined'
    END as service_scope,
    CASE 
        WHEN pm_class = 'Class A' THEN 90
        WHEN pm_class = 'Class B' THEN 365
        WHEN pm_class = 'Class C' THEN 730
        ELSE 90
    END as standard_frequency_days,
    CASE 
        WHEN pm_class = 'Class A' THEN 500.00
        WHEN pm_class = 'Class B' THEN 1500.00
        WHEN pm_class = 'Class C' THEN 3000.00
        ELSE 500.00
    END as standard_cost,
    COUNT(*) as equipment_count
FROM equipment 
WHERE is_pm = true
GROUP BY pm_class
ORDER BY pm_class;

-- =====================================================
-- 6. VERIFICATION QUERIES
-- =====================================================

-- Check PM classifications after fixes
SELECT 
    'PM Classifications After Fix' as section,
    pm_class,
    COUNT(*) as equipment_count,
    ROUND(AVG(pm_cost_estimate), 2) as avg_cost,
    ROUND(AVG(pm_frequency_days), 0) as avg_frequency_days
FROM equipment 
WHERE is_pm = true 
GROUP BY pm_class
ORDER BY pm_class;

-- Show PM type definitions
SELECT 
    'PM Type Definitions' as section,
    maintenance_type,
    description,
    standard_cost,
    estimated_hours,
    frequency_days
FROM preventive_maintenance_types
ORDER BY maintenance_type;

-- Show equipment with their PM details
SELECT 
    'Sample Equipment PM Details' as section,
    name,
    type,
    pm_class,
    pm_cost_estimate,
    pm_cost_multiplier,
    pm_frequency_days,
    ROUND(pm_cost_estimate * pm_cost_multiplier, 2) as final_cost_estimate
FROM equipment 
WHERE is_pm = true 
ORDER BY name
LIMIT 10;

-- =====================================================
-- 7. SUMMARY
-- =====================================================

-- Final summary
SELECT 
    'PM System Status' as section,
    'Total PM Equipment' as metric,
    COUNT(*) as value
FROM equipment WHERE is_pm = true
UNION ALL
SELECT 
    'PM System Status' as section,
    'Equipment with PM Class' as metric,
    COUNT(*) as value
FROM equipment WHERE is_pm = true AND pm_class IS NOT NULL
UNION ALL
SELECT 
    'PM System Status' as section,
    'Equipment with Cost Estimates' as metric,
    COUNT(*) as value
FROM equipment WHERE is_pm = true AND pm_cost_estimate IS NOT NULL
UNION ALL
SELECT 
    'PM System Status' as section,
    'Total Estimated PM Cost' as metric,
    ROUND(SUM(pm_cost_estimate), 2) as value
FROM equipment WHERE is_pm = true AND pm_cost_estimate IS NOT NULL; 