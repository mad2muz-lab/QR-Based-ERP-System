-- Comprehensive Maintenance Data Test Script
-- This script helps diagnose issues with maintenance data loading

-- 1. Check if maintenance tables exist
SELECT '1. Checking table existence:' as test_name;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name IN ('equipment_maintenance_logs', 'equipment_maintenance_schedules', 'equipment', 'departments', 'employees', 'sites')
ORDER BY table_name;

-- 2. Check maintenance logs table structure
SELECT '2. Checking equipment_maintenance_logs structure:' as test_name;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'equipment_maintenance_logs'
ORDER BY ordinal_position;

-- 3. Check if there are any maintenance logs
SELECT '3. Checking maintenance logs count:' as test_name;
SELECT COUNT(*) as total_maintenance_logs FROM equipment_maintenance_logs;

-- 4. Check recent maintenance logs
SELECT '4. Recent maintenance logs (last 10):' as test_name;
SELECT 
    id,
    equipment_id,
    maintenance_type,
    status,
    description,
    created_at,
    updated_at
FROM equipment_maintenance_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. Check equipment table
SELECT '5. Checking equipment count:' as test_name;
SELECT COUNT(*) as total_equipment FROM equipment;

-- 6. Check equipment with maintenance status
SELECT '6. Equipment with maintenance status:' as test_name;
SELECT 
    id,
    name,
    type,
    operational_status,
    site,
    custom_equipment_id
FROM equipment 
WHERE operational_status IN ('under_repair', 'under_service', 'not_working')
ORDER BY name;

-- 7. Check departments
SELECT '7. Checking departments:' as test_name;
SELECT 
    id,
    name,
    description,
    created_at
FROM departments 
ORDER BY name;

-- 8. Check employees
SELECT '8. Checking employees count:' as test_name;
SELECT COUNT(*) as total_employees FROM employees;

-- 9. Check sites
SELECT '9. Checking sites:' as test_name;
SELECT 
    id,
    name,
    location,
    created_at
FROM sites 
ORDER BY name;

-- 10. Check maintenance logs with equipment info
SELECT '10. Maintenance logs with equipment info:' as test_name;
SELECT 
    ml.id,
    ml.equipment_id,
    e.name as equipment_name,
    e.operational_status,
    ml.maintenance_type,
    ml.status,
    ml.description,
    ml.created_at
FROM equipment_maintenance_logs ml
LEFT JOIN equipment e ON ml.equipment_id = e.id
ORDER BY ml.created_at DESC
LIMIT 10;

-- 11. Check RLS policies on maintenance tables
SELECT '11. Checking RLS policies:' as test_name;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('equipment_maintenance_logs', 'equipment_maintenance_schedules')
ORDER BY tablename, policyname;

-- 12. Check if RLS is enabled on maintenance tables
SELECT '12. Checking RLS status:' as test_name;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('equipment_maintenance_logs', 'equipment_maintenance_schedules')
ORDER BY tablename;

-- 13. Test direct query with authentication check
SELECT '13. Testing authenticated query:' as test_name;
-- This will show if the current user can access the data
SELECT 
    COUNT(*) as accessible_maintenance_logs
FROM equipment_maintenance_logs;

-- 14. Check for any foreign key constraints
SELECT '14. Checking foreign key constraints:' as test_name;
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('equipment_maintenance_logs', 'equipment_maintenance_schedules');

-- 15. Check for any data inconsistencies
SELECT '15. Checking for orphaned maintenance logs:' as test_name;
SELECT 
    ml.id,
    ml.equipment_id,
    ml.maintenance_type,
    ml.status
FROM equipment_maintenance_logs ml
LEFT JOIN equipment e ON ml.equipment_id = e.id
WHERE e.id IS NULL;

-- 16. Summary report
SELECT '16. Summary Report:' as test_name;
SELECT 
    'equipment_maintenance_logs' as table_name,
    COUNT(*) as record_count
FROM equipment_maintenance_logs
UNION ALL
SELECT 
    'equipment' as table_name,
    COUNT(*) as record_count
FROM equipment
UNION ALL
SELECT 
    'departments' as table_name,
    COUNT(*) as record_count
FROM departments
UNION ALL
SELECT 
    'employees' as table_name,
    COUNT(*) as record_count
FROM employees
UNION ALL
SELECT 
    'sites' as table_name,
    COUNT(*) as record_count
FROM sites; 