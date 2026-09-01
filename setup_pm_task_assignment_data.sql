-- Setup PM Task Assignment Sample Data
-- This script creates sample data for testing the PM Task Assignment functionality

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

-- 2. Update existing employees to have roles for PM assignment
-- Note: These employees already exist in your system from sampleDataInitializer.ts
UPDATE employees 
SET 
  role = 'supervisor',
  email = 'ahmed@company.com',
  phone = '+966501234567'
WHERE qr_code = 'EMP-001';

UPDATE employees 
SET 
  role = 'operator',
  email = 'mohammed@company.com',
  phone = '+966501234568'
WHERE qr_code = 'EMP-002';

UPDATE employees 
SET 
  role = 'safety_officer',
  email = 'khalid@company.com',
  phone = '+966501234569'
WHERE qr_code = 'EMP-003';

-- 3. Add a few more employees if needed for testing
INSERT INTO employees (id, name, email, role, qr_code, department, position, phone, site, status, created_at, last_updated)
VALUES 
  ('EMP-004', 'Omar Al-Zahra', 'omar@company.com', 'technician', 'EMP-004', 'Maintenance', 'Maintenance Technician', '+966501234570', 'SITE-001', 'active', NOW(), NOW()),
  ('EMP-005', 'Fatima Al-Mutairi', 'fatima@company.com', 'engineer', 'EMP-005', 'Engineering', 'Maintenance Engineer', '+966501234571', 'SITE-002', 'active', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  qr_code = EXCLUDED.qr_code,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  phone = EXCLUDED.phone,
  site = EXCLUDED.site;

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
     'EMP-001', 'Ahmed Al-Rashid', CURRENT_DATE - INTERVAL '1 day'
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
  role, 
  qr_code, 
  department, 
  site
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

-- 5. Testing Instructions
SELECT 'Testing Instructions:' as info;
SELECT 
  '1. Navigate to /pm/task-assignment' as step,
  '2. Click "Assign" on any pending task' as action,
  '3. Use one of these QR codes to assign:' as qr_info,
  '   - EMP-001 (Ahmed Al-Rashid - Supervisor)' as qr1,
  '   - EMP-002 (Mohammed Al-Fahad - Operator)' as qr2,
  '   - EMP-003 (Khalid Al-Mutairi - Safety Officer)' as qr3,
  '   - EMP-004 (Omar Al-Zahra - Technician)' as qr4,
  '   - EMP-005 (Fatima Al-Mutairi - Engineer)' as qr5; 