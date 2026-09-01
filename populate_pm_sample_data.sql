-- Populate PM System with realistic sample data
-- This will make the dashboard show actual values instead of dashes

-- 1. Insert sample equipment data (if not exists)
INSERT INTO public.equipment (id, name, type, status, site, created_at, updated_at) VALUES
('equipment_001', 'Excavator EX-001', 'Excavator', 'operational', 'Site A', NOW(), NOW()),
('equipment_002', 'Bulldozer BD-001', 'Bulldozer', 'operational', 'Site B', NOW(), NOW()),
('equipment_003', 'Crane CR-001', 'Crane', 'operational', 'Site C', NOW(), NOW()),
('equipment_004', 'Loader LD-001', 'Loader', 'operational', 'Site A', NOW(), NOW()),
('equipment_005', 'Truck TK-001', 'Truck', 'operational', 'Site B', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Insert sample preventive maintenance logs
INSERT INTO public.preventive_maintenance_logs (equipment_id, maintenance_class, maintenance_type, scheduled_date, performed_date, status, technician_id, notes) VALUES
('equipment_001', 'A', 'service', '2024-01-15 08:00:00+00', '2024-01-15 10:30:00+00', 'completed', 'EMP-001', 'Regular oil change and filter replacement'),
('equipment_001', 'B', 'service', '2024-02-01 08:00:00+00', '2024-02-01 14:00:00+00', 'completed', 'EMP-002', 'Major service - hydraulic system check'),
('equipment_002', 'A', 'service', '2024-01-20 08:00:00+00', '2024-01-20 09:45:00+00', 'completed', 'EMP-001', 'Regular maintenance check'),
('equipment_002', 'C', 'repair', '2024-02-10 08:00:00+00', '2024-02-10 16:00:00+00', 'completed', 'EMP-003', 'Engine overhaul completed'),
('equipment_003', 'A', 'service', '2024-01-25 08:00:00+00', '2024-01-25 11:00:00+00', 'completed', 'EMP-002', 'Crane safety inspection'),
('equipment_003', 'B', 'service', '2024-02-15 08:00:00+00', NULL, 'scheduled', 'EMP-001', 'Scheduled for next week'),
('equipment_004', 'A', 'service', '2024-01-30 08:00:00+00', '2024-01-30 10:15:00+00', 'completed', 'EMP-003', 'Loader maintenance'),
('equipment_005', 'A', 'service', '2024-02-05 08:00:00+00', NULL, 'overdue', 'EMP-002', 'Overdue maintenance'),
('equipment_001', 'A', 'service', '2024-03-01 08:00:00+00', NULL, 'scheduled', 'EMP-001', 'Next scheduled maintenance'),
('equipment_002', 'A', 'service', '2024-03-05 08:00:00+00', NULL, 'scheduled', 'EMP-002', 'Upcoming maintenance')
ON CONFLICT DO NOTHING;

-- 3. Update PM compliance summary with real data
INSERT INTO public.pm_compliance_summary (equipment_id, equipment_name, equipment_type, total_scheduled_pm, completed_pm, overdue_pm, compliance_rate, last_pm_date, next_pm_date, maintenance_class) VALUES
('equipment_001', 'Excavator EX-001', 'Excavator', 3, 2, 0, 66.67, '2024-02-01 14:00:00+00', '2024-03-01 08:00:00+00', 'A'),
('equipment_002', 'Bulldozer BD-001', 'Bulldozer', 2, 2, 0, 100.00, '2024-02-10 16:00:00+00', '2024-03-05 08:00:00+00', 'A'),
('equipment_003', 'Crane CR-001', 'Crane', 2, 1, 0, 50.00, '2024-01-25 11:00:00+00', '2024-02-15 08:00:00+00', 'A'),
('equipment_004', 'Loader LD-001', 'Loader', 1, 1, 0, 100.00, '2024-01-30 10:15:00+00', NULL, 'A'),
('equipment_005', 'Truck TK-001', 'Truck', 1, 0, 1, 0.00, NULL, '2024-02-05 08:00:00+00', 'A')
ON CONFLICT (equipment_id) DO UPDATE SET
    total_scheduled_pm = EXCLUDED.total_scheduled_pm,
    completed_pm = EXCLUDED.completed_pm,
    overdue_pm = EXCLUDED.overdue_pm,
    compliance_rate = EXCLUDED.compliance_rate,
    last_pm_date = EXCLUDED.last_pm_date,
    next_pm_date = EXCLUDED.next_pm_date,
    updated_at = NOW();

-- 4. Insert PM equipment history
INSERT INTO public.pm_equipment_history (equipment_id, maintenance_class, maintenance_type, scheduled_date, performed_date, status, technician_id, technician_name, actual_duration_hours, estimated_duration_hours, actual_cost, estimated_cost, parts_used) VALUES
('equipment_001', 'A', 'service', '2024-01-15 08:00:00+00', '2024-01-15 10:30:00+00', 'completed', 'EMP-001', 'John Smith', 2.5, 2.0, 150.00, 120.00, 'Oil filter, Engine oil'),
('equipment_001', 'B', 'service', '2024-02-01 08:00:00+00', '2024-02-01 14:00:00+00', 'completed', 'EMP-002', 'Mike Johnson', 6.0, 5.0, 450.00, 400.00, 'Hydraulic fluid, Filters'),
('equipment_002', 'A', 'service', '2024-01-20 08:00:00+00', '2024-01-20 09:45:00+00', 'completed', 'EMP-001', 'John Smith', 1.75, 2.0, 100.00, 120.00, 'Air filter'),
('equipment_002', 'C', 'repair', '2024-02-10 08:00:00+00', '2024-02-10 16:00:00+00', 'completed', 'EMP-003', 'David Wilson', 8.0, 8.0, 1200.00, 1200.00, 'Engine parts, Gaskets'),
('equipment_003', 'A', 'service', '2024-01-25 08:00:00+00', '2024-01-25 11:00:00+00', 'completed', 'EMP-002', 'Mike Johnson', 3.0, 3.0, 200.00, 200.00, 'Safety equipment'),
('equipment_004', 'A', 'service', '2024-01-30 08:00:00+00', '2024-01-30 10:15:00+00', 'completed', 'EMP-003', 'David Wilson', 2.25, 2.0, 130.00, 120.00, 'Hydraulic oil')
ON CONFLICT DO NOTHING;

-- 5. Insert PM task assignments
INSERT INTO public.pm_task_assignments (pm_log_id, technician_id, assigned_date, due_date, priority, status, notes) 
SELECT 
    pml.id,
    pml.technician_id,
    pml.scheduled_date - INTERVAL '1 day',
    pml.scheduled_date,
    CASE 
        WHEN pml.maintenance_class = 'A' THEN 'medium'
        WHEN pml.maintenance_class = 'B' THEN 'high'
        WHEN pml.maintenance_class = 'C' THEN 'critical'
        ELSE 'medium'
    END,
    pml.status,
    pml.notes
FROM public.preventive_maintenance_logs pml
WHERE pml.technician_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 6. Insert PM analytics data
INSERT INTO public.pm_analytics (analytics_date, total_equipment, total_pm_scheduled, total_pm_completed, total_pm_overdue, overall_compliance_rate, total_cost, total_duration_hours, class_a_compliance, class_b_compliance, class_c_compliance) VALUES
('2024-01-01', 5, 8, 6, 1, 75.00, 2230.00, 23.5, 80.00, 100.00, 100.00),
('2024-02-01', 5, 10, 7, 2, 70.00, 2680.00, 29.5, 75.00, 100.00, 100.00),
('2024-03-01', 5, 12, 8, 3, 66.67, 3130.00, 35.5, 70.00, 100.00, 100.00)
ON CONFLICT (analytics_date) DO UPDATE SET
    total_equipment = EXCLUDED.total_equipment,
    total_pm_scheduled = EXCLUDED.total_pm_scheduled,
    total_pm_completed = EXCLUDED.total_pm_completed,
    total_pm_overdue = EXCLUDED.total_pm_overdue,
    overall_compliance_rate = EXCLUDED.overall_compliance_rate,
    total_cost = EXCLUDED.total_cost,
    total_duration_hours = EXCLUDED.total_duration_hours,
    class_a_compliance = EXCLUDED.class_a_compliance,
    class_b_compliance = EXCLUDED.class_b_compliance,
    class_c_compliance = EXCLUDED.class_c_compliance,
    updated_at = NOW();

-- 7. Insert PM forecasts
INSERT INTO public.pm_forecasts (equipment_id, forecast_period, forecast_date, total_pm_scheduled, estimated_cost, estimated_duration_hours, maintenance_class_breakdown) VALUES
('equipment_001', 'monthly', '2024-03-01', 1, 120.00, 2.0, '{"A": 1, "B": 0, "C": 0}'),
('equipment_002', 'monthly', '2024-03-01', 1, 120.00, 2.0, '{"A": 1, "B": 0, "C": 0}'),
('equipment_003', 'monthly', '2024-03-01', 1, 200.00, 3.0, '{"A": 0, "B": 1, "C": 0}'),
('equipment_004', 'monthly', '2024-03-01', 1, 120.00, 2.0, '{"A": 1, "B": 0, "C": 0}'),
('equipment_005', 'monthly', '2024-03-01', 1, 120.00, 2.0, '{"A": 1, "B": 0, "C": 0}')
ON CONFLICT DO NOTHING;

-- 8. Verify data was inserted
SELECT 'PM Compliance Summary' as table_name, COUNT(*) as record_count FROM public.pm_compliance_summary
UNION ALL
SELECT 'PM Equipment History', COUNT(*) FROM public.pm_equipment_history
UNION ALL
SELECT 'PM Task Assignments', COUNT(*) FROM public.pm_task_assignments
UNION ALL
SELECT 'PM Analytics', COUNT(*) FROM public.pm_analytics
UNION ALL
SELECT 'PM Forecasts', COUNT(*) FROM public.pm_forecasts
UNION ALL
SELECT 'Preventive Maintenance Logs', COUNT(*) FROM public.preventive_maintenance_logs; 