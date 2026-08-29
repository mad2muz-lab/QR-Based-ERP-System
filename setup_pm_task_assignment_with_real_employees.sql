-- Setup PM Task Assignment with Real Employees
-- This script works with whatever employees actually exist in your database

-- 1. Update existing equipment to have PM schedules
UPDATE equipment 
SET 
  is_pm = true,
  pm_class = 'Class A',
  pm_frequency_hours = 250,
  usage_duration = 200,
  last_pm_date = (CURRENT_DATE - INTERVAL '30 days')::text,
  next_pm_date = (CURRENT_DATE + INTERVAL '5 days')::text,
  pm_status = 'scheduled'
WHERE name IN ('Excavator_01', 'BatchPlant_01', 'MotorGrader_01');

UPDATE equipment 
SET 
  is_pm = true,
  pm_class = 'Class B',
  pm_frequency_hours = 500,
  usage_duration = 450,
  last_pm_date = (CURRENT_DATE - INTERVAL '45 days')::text,
  next_pm_date = (CURRENT_DATE - INTERVAL '5 days')::text,
  pm_status = 'overdue'
WHERE name IN ('Paver_01', 'Roller_01');

UPDATE equipment 
SET 
  is_pm = true,
  pm_class = 'Class C',
  pm_frequency_hours = 1000,
  usage_duration = 950,
  last_pm_date = (CURRENT_DATE - INTERVAL '60 days')::text,
  next_pm_date = (CURRENT_DATE - INTERVAL '15 days')::text,
  pm_status = 'overdue'
WHERE name IN ('Crane_01', 'Loader_01');

-- 2. Note: Using position column for role information
-- The position column contains the role information (e.g., "Site Supervisor", "Equipment Operator", etc.)
-- No need to update roles since position already contains this information

-- 3. Insert sample PM logs for testing
INSERT INTO preventive_maintenance_logs (
  id, equipment_id, maintenance_class, maintenance_type, 
  scheduled_date, status, technician_id, technician_name, assigned_date
)
VALUES 
  (
    'pm-log-001', 
    (SELECT id FROM equipment WHERE name = 'Excavator_01' LIMIT 1),
    'Class A', 'preventive', 
    CURRENT_DATE + INTERVAL '5 days', 'scheduled', NULL, NULL, NULL
  ),
  (
    'pm-log-002', 
    (SELECT id FROM equipment WHERE name = 'BatchPlant_01' LIMIT 1),
    'Class A', 'preventive', 
    CURRENT_DATE + INTERVAL '3 days', 'scheduled', NULL, NULL, NULL
  ),
  (
    'pm-log-003', 
    (SELECT id FROM equipment WHERE name = 'Paver_01' LIMIT 1),
    'Class B', 'preventive', 
    CURRENT_DATE - INTERVAL '5 days', 'pending', NULL, NULL, NULL
  ),
  (
    'pm-log-004', 
    (SELECT id FROM equipment WHERE name = 'Roller_01' LIMIT 1),
    'Class B', 'preventive', 
    CURRENT_DATE - INTERVAL '3 days', 'assigned', 
    (SELECT id FROM employees LIMIT 1), 
    (SELECT name FROM employees LIMIT 1), 
    CURRENT_DATE - INTERVAL '1 day'
  ),
  (
    'pm-log-005', 
    (SELECT id FROM equipment WHERE name = 'Crane_01' LIMIT 1),
    'Class C', 'preventive', 
    CURRENT_DATE - INTERVAL '15 days', 'pending', NULL, NULL, NULL
  )
ON CONFLICT (id) DO UPDATE SET
  equipment_id = EXCLUDED.equipment_id,
  maintenance_class = EXCLUDED.maintenance_class,
  maintenance_type = EXCLUDED.maintenance_type,
  scheduled_date = EXCLUDED.scheduled_date,
  status = EXCLUDED.status,
  technician_id = EXCLUDED.technician_id,
  technician_name = EXCLUDED.technician_name,
  assigned_date = EXCLUDED.assigned_date;

-- 4. Show the results
SELECT 'Equipment with PM schedules:' as info;
SELECT 
  name, 
  pm_class, 
  pm_frequency_hours,
  usage_duration,
  last_pm_date,
  next_pm_date,
  pm_status
FROM equipment 
WHERE is_pm = true 
ORDER BY pm_status, next_pm_date;

SELECT 'Employees available for assignment:' as info;
SELECT 
  name, 
  position, 
  qr_code, 
  department
FROM employees 
ORDER BY name;

SELECT 'PM Tasks Status:' as info;
SELECT 
  pml.id,
  e.name as equipment_name,
  pml.maintenance_class,
  pml.scheduled_date,
  pml.status,
  pml.technician_name,
  pml.assigned_date
FROM preventive_maintenance_logs pml
JOIN equipment e ON pml.equipment_id = e.id
ORDER BY pml.scheduled_date;

-- 5. Show available QR codes for testing
SELECT 'Available QR Codes for Testing:' as info;
SELECT 
  name,
  position,
  qr_code,
  'Use this QR code: ' || qr_code || ' for ' || name || ' (' || position || ')' as testing_info
FROM employees 
ORDER BY name; 