-- Sample Data for Resource Movement Management System
-- This script populates all tables with realistic test data

-- 1. Fleet Vehicles
INSERT INTO fleet_vehicles (id, vehicle_number, vehicle_type, make, model, year, license_plate, capacity, fuel_type, current_location, status, purchase_cost, current_value) VALUES
('VEH-001', 'FLEET-001', 'truck', 'Mercedes-Benz', 'Actros', 2022, 'ABC-123', '10 tons', 'diesel', 'Main Warehouse', 'available', 450000.00, 380000.00),
('VEH-002', 'FLEET-002', 'van', 'Ford', 'Transit', 2023, 'XYZ-456', '2 tons', 'diesel', 'Site A', 'in_use', 120000.00, 110000.00),
('VEH-003', 'FLEET-003', 'car', 'Toyota', 'Hilux', 2021, 'DEF-789', '1 ton', 'petrol', 'Main Office', 'available', 85000.00, 70000.00),
('VEH-004', 'FLEET-004', 'truck', 'Volvo', 'FH16', 2020, 'GHI-012', '15 tons', 'diesel', 'Site B', 'maintenance', 650000.00, 520000.00),
('VEH-005', 'FLEET-005', 'trailer', 'Schmitz', 'Cargobull', 2023, 'JKL-345', '20 tons', 'N/A', 'Main Warehouse', 'available', 180000.00, 170000.00);

-- 2. Fleet Drivers (using the default employee we created)
INSERT INTO fleet_drivers (id, employee_id, driver_license_number, license_type, license_expiry, driving_experience_years, specialized_certifications, current_vehicle_id, status, total_trips, total_distance, safety_rating) VALUES
('DRIVER-001', 'EMP-DEFAULT', 'DL-001-2023', 'heavy_vehicle', '2025-12-31', 8, ARRAY['Hazmat', 'Heavy Equipment'], 'VEH-001', 'available', 45, 12500.50, 4.85),
('DRIVER-002', 'EMP-DEFAULT', 'DL-002-2023', 'commercial', '2026-06-30', 5, ARRAY['Passenger Transport'], 'VEH-002', 'on_trip', 32, 8900.25, 4.92),
('DRIVER-003', 'EMP-DEFAULT', 'DL-003-2023', 'light_vehicle', '2025-09-15', 3, ARRAY['Defensive Driving'], 'VEH-003', 'available', 28, 6500.75, 4.78);

-- 3. Movement Routes
INSERT INTO movement_routes (id, route_name, route_type, start_location, end_location, waypoints, estimated_distance, estimated_duration, fuel_consumption, toll_charges, route_description, created_by) VALUES
('ROUTE-001', 'Main Warehouse to Site A', 'standard', 'Main Warehouse', 'Site A', ARRAY['Checkpoint 1', 'Checkpoint 2'], 45.5, 60, 12.5, 15.00, 'Standard route for material delivery', 'EMP-DEFAULT'),
('ROUTE-002', 'Site A to Site B', 'optimized', 'Site A', 'Site B', ARRAY['Highway Exit', 'Industrial Zone'], 78.2, 90, 18.2, 25.00, 'Optimized route avoiding traffic', 'EMP-DEFAULT'),
('ROUTE-003', 'Main Office to Site C', 'custom', 'Main Office', 'Site C', ARRAY['City Center', 'Suburban Area'], 32.8, 45, 8.5, 8.00, 'Custom route for executive transport', 'EMP-DEFAULT');

-- 4. Resource Movement Requests
INSERT INTO resource_movement_requests (id, request_type, entity_id, entity_name, entity_type, quantity, unit, location_from, location_to, requested_by, priority, status, estimated_duration, estimated_cost, notes) VALUES
('REQ-001', 'material', 'MAT-001', 'Steel Beams', 'Construction Material', 50, 'pieces', 'Main Warehouse', 'Site A', 'EMP-DEFAULT', 'high', 'approved', 120, 2500.00, 'Urgent delivery for bridge construction'),
('REQ-002', 'equipment', 'EQ-001', 'Excavator CAT320', 'Heavy Equipment', 1, 'unit', 'Site A', 'Site B', 'EMP-DEFAULT', 'medium', 'in_progress', 180, 1800.00, 'Equipment transfer for new project'),
('REQ-003', 'employee', 'EMP-001', 'Construction Team', 'Workforce', 8, 'persons', 'Main Office', 'Site C', 'EMP-DEFAULT', 'low', 'pending', 60, 800.00, 'Team deployment for maintenance work'),
('REQ-004', 'fleet', 'VEH-002', 'Ford Transit Van', 'Vehicle', 1, 'unit', 'Site A', 'Main Warehouse', 'EMP-DEFAULT', 'medium', 'completed', 90, 1200.00, 'Vehicle return after delivery'),
('REQ-005', 'material', 'MAT-002', 'Concrete Mix', 'Construction Material', 200, 'bags', 'Main Warehouse', 'Site B', 'EMP-DEFAULT', 'critical', 'approved', 150, 3200.00, 'Critical material for foundation work');

-- 5. Resource Movement Executions
INSERT INTO resource_movement_executions (id, request_id, execution_type, vehicle_id, driver_id, route_plan, start_time, end_time, executed_by, status, actual_route, fuel_consumed, distance_traveled, cost_center, profit_center, cross_charge_amount) VALUES
('EXEC-001', 'REQ-001', 'material', 'VEH-001', 'DRIVER-001', 'ROUTE-001', '2025-08-06 08:00:00+00', '2025-08-06 10:15:00+00', 'EMP-DEFAULT', 'completed', 'ROUTE-001 with minor detour', 13.2, 47.8, 'Construction', 'Project A', 2500.00),
('EXEC-002', 'REQ-002', 'equipment', 'VEH-004', 'DRIVER-001', 'ROUTE-002', '2025-08-06 14:00:00+00', NULL, 'EMP-DEFAULT', 'in_progress', 'ROUTE-002', 8.5, 35.2, 'Equipment', 'Project B', 1800.00),
('EXEC-003', 'REQ-004', 'fleet', 'VEH-002', 'DRIVER-002', 'ROUTE-001', '2025-08-05 16:00:00+00', '2025-08-05 17:45:00+00', 'EMP-DEFAULT', 'completed', 'ROUTE-001', 11.8, 46.2, 'Logistics', 'General', 1200.00);

-- 6. Movement Checkpoints
INSERT INTO movement_checkpoints (id, execution_id, checkpoint_name, location, checkpoint_type, scanned_at, scanned_by, qr_code, notes) VALUES
('CP-001', 'EXEC-001', 'Warehouse Exit', 'Main Warehouse Gate', 'start', '2025-08-06 08:05:00+00', 'EMP-DEFAULT', 'QR-WH-EXIT', 'Vehicle and load verified'),
('CP-002', 'EXEC-001', 'Highway Entry', 'Highway A1 Entry', 'pickup', '2025-08-06 08:25:00+00', 'EMP-DEFAULT', 'QR-HW-ENTRY', 'Route confirmed'),
('CP-003', 'EXEC-001', 'Site A Arrival', 'Site A Gate', 'delivery', '2025-08-06 10:10:00+00', 'EMP-DEFAULT', 'QR-SITE-A', 'Delivery completed'),
('CP-004', 'EXEC-001', 'Site A Exit', 'Site A Gate', 'end', '2025-08-06 10:15:00+00', 'EMP-DEFAULT', 'QR-SITE-A-EXIT', 'Return journey started'),
('CP-005', 'EXEC-002', 'Equipment Loading', 'Site A Equipment Yard', 'start', '2025-08-06 14:15:00+00', 'EMP-DEFAULT', 'QR-EQ-LOAD', 'Excavator loaded and secured');

-- 7. Movement Costs
INSERT INTO movement_costs (id, execution_id, cost_type, cost_description, amount, currency, cost_center, profit_center, receipt_reference, notes) VALUES
('COST-001', 'EXEC-001', 'fuel', 'Diesel fuel for delivery trip', 450.00, 'SAR', 'Logistics', 'Project A', 'REC-001', 'Fuel consumption for steel beam delivery'),
('COST-002', 'EXEC-001', 'toll', 'Highway toll charges', 15.00, 'SAR', 'Logistics', 'Project A', 'REC-002', 'Toll charges for route'),
('COST-003', 'EXEC-001', 'labor', 'Driver overtime for urgent delivery', 200.00, 'SAR', 'HR', 'Project A', 'REC-003', 'Overtime payment for urgent delivery'),
('COST-004', 'EXEC-002', 'fuel', 'Diesel fuel for equipment transfer', 320.00, 'SAR', 'Equipment', 'Project B', 'REC-004', 'Fuel for excavator transfer'),
('COST-005', 'EXEC-003', 'fuel', 'Diesel fuel for van return', 380.00, 'SAR', 'Logistics', 'General', 'REC-005', 'Fuel for van return trip');

-- 8. Movement Analytics
INSERT INTO movement_analytics (id, movement_type, period_type, period_start, period_end, total_movements, total_distance, total_duration, total_cost, average_cost_per_movement, efficiency_score, fuel_efficiency) VALUES
('ANALYTICS-001', 'material', 'daily', '2025-08-06', '2025-08-06', 2, 94.0, 270, 5200.00, 2600.00, 85.5, 12.8),
('ANALYTICS-002', 'equipment', 'daily', '2025-08-06', '2025-08-06', 1, 35.2, 180, 1800.00, 1800.00, 78.2, 9.1),
('ANALYTICS-003', 'fleet', 'daily', '2025-08-05', '2025-08-05', 1, 46.2, 105, 1200.00, 1200.00, 92.1, 8.2),
('ANALYTICS-004', 'material', 'weekly', '2025-08-01', '2025-08-07', 8, 425.6, 1200, 18500.00, 2312.50, 87.3, 11.2),
('ANALYTICS-005', 'equipment', 'weekly', '2025-08-01', '2025-08-07', 3, 156.8, 540, 7200.00, 2400.00, 82.1, 10.5);

-- Update vehicle assignments
UPDATE fleet_vehicles SET assigned_driver_id = 'DRIVER-001' WHERE id = 'VEH-001';
UPDATE fleet_vehicles SET assigned_driver_id = 'DRIVER-002' WHERE id = 'VEH-002';
UPDATE fleet_vehicles SET assigned_driver_id = 'DRIVER-003' WHERE id = 'VEH-003';

-- Update driver current vehicles
UPDATE fleet_drivers SET current_vehicle_id = 'VEH-001' WHERE id = 'DRIVER-001';
UPDATE fleet_drivers SET current_vehicle_id = 'VEH-002' WHERE id = 'DRIVER-002';
UPDATE fleet_drivers SET current_vehicle_id = 'VEH-003' WHERE id = 'DRIVER-003';

-- Verification
SELECT 'Sample Data Inserted Successfully' as status,
       (SELECT COUNT(*) FROM fleet_vehicles) as vehicles_count,
       (SELECT COUNT(*) FROM fleet_drivers) as drivers_count,
       (SELECT COUNT(*) FROM movement_routes) as routes_count,
       (SELECT COUNT(*) FROM resource_movement_requests) as requests_count,
       (SELECT COUNT(*) FROM resource_movement_executions) as executions_count,
       (SELECT COUNT(*) FROM movement_checkpoints) as checkpoints_count,
       (SELECT COUNT(*) FROM movement_costs) as costs_count,
       (SELECT COUNT(*) FROM movement_analytics) as analytics_count; 