// Resource Movement Management Types
// Unified system for managing fleet, equipment, employee, and material movement

// ===== CORE MOVEMENT TYPES =====
export type MovementType = 'fleet' | 'equipment' | 'employee' | 'material';
export type MovementStatus = 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
export type ExecutionStatus = 'in_progress' | 'completed' | 'failed' | 'cancelled';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type CheckpointType = 'start' | 'pickup' | 'delivery' | 'end';

// ===== RESOURCE MOVEMENT REQUESTS =====
export interface ResourceMovementRequest {
  id: string;
  request_type: MovementType;
  entity_id: string;
  entity_name: string;
  entity_type: string;
  quantity: number;
  unit: string;
  location_from: string;
  location_to: string;
  requested_by: string;
  requested_at: string;
  priority: Priority;
  status: MovementStatus;
  estimated_duration?: number; // minutes
  estimated_cost?: number;
  actual_duration?: number; // minutes
  actual_cost?: number;
  notes?: string;
  reference_id?: string;
  created_at: string;
  updated_at: string;
}

// ===== RESOURCE MOVEMENT EXECUTIONS =====
export interface ResourceMovementExecution {
  id: string;
  request_id: string;
  execution_type: MovementType;
  vehicle_id?: string;
  driver_id?: string;
  route_plan?: string;
  start_time?: string;
  end_time?: string;
  executed_by: string;
  executed_at: string;
  status: ExecutionStatus;
  actual_route?: string;
  fuel_consumed?: number; // liters
  distance_traveled?: number; // km
  cost_center?: string;
  profit_center?: string;
  cross_charge_amount?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ===== MOVEMENT CHECKPOINTS =====
export interface MovementCheckpoint {
  id: string;
  execution_id: string;
  checkpoint_name: string;
  location: string;
  checkpoint_type: CheckpointType;
  scanned_at: string;
  scanned_by: string;
  qr_code?: string;
  notes?: string;
  created_at: string;
}

// ===== FLEET MANAGEMENT =====
export type VehicleType = 'truck' | 'van' | 'car' | 'bus' | 'trailer';
export type FuelType = 'diesel' | 'petrol' | 'electric' | 'hybrid';
export type VehicleStatus = 'available' | 'in_use' | 'maintenance' | 'out_of_service';

export interface FleetVehicle {
  id: string;
  vehicle_number: string;
  vehicle_type: VehicleType;
  make: string;
  model: string;
  year?: number;
  license_plate?: string;
  capacity?: string;
  fuel_type?: FuelType;
  current_location?: string;
  status: VehicleStatus;
  assigned_driver_id?: string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  insurance_expiry?: string;
  registration_expiry?: string;
  purchase_date?: string;
  purchase_cost?: number;
  current_value?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ===== FLEET DRIVERS =====
export type LicenseType = 'light_vehicle' | 'heavy_vehicle' | 'commercial';
export type DriverStatus = 'available' | 'on_trip' | 'off_duty' | 'suspended';

export interface FleetDriver {
  id: string;
  employee_id: string;
  driver_license_number: string;
  license_type: LicenseType;
  license_expiry: string;
  driving_experience_years?: number;
  specialized_certifications?: string[];
  current_vehicle_id?: string;
  status: DriverStatus;
  total_trips: number;
  total_distance: number; // km
  safety_rating: number; // 1.00 to 5.00
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ===== MOVEMENT ROUTES =====
export type RouteType = 'standard' | 'optimized' | 'custom';

export interface MovementRoute {
  id: string;
  route_name: string;
  route_type: RouteType;
  start_location: string;
  end_location: string;
  waypoints?: string[];
  estimated_distance?: number; // km
  estimated_duration?: number; // minutes
  fuel_consumption?: number; // liters
  toll_charges?: number;
  route_description?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ===== MOVEMENT COSTS =====
export type CostType = 'fuel' | 'toll' | 'labor' | 'maintenance' | 'other';

export interface MovementCost {
  id: string;
  execution_id: string;
  cost_type: CostType;
  cost_description: string;
  amount: number;
  currency: string;
  cost_center?: string;
  profit_center?: string;
  receipt_reference?: string;
  notes?: string;
  created_at: string;
}

// ===== MOVEMENT ANALYTICS =====
export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export interface MovementAnalytics {
  id: string;
  movement_type: MovementType;
  period_type: PeriodType;
  period_start: string;
  period_end: string;
  total_movements: number;
  total_distance: number;
  total_duration: number; // minutes
  total_cost: number;
  average_cost_per_movement: number;
  efficiency_score: number; // percentage
  fuel_efficiency: number; // km/liter
  created_at: string;
}

// ===== FORM INTERFACES =====
export interface MovementRequestFormData {
  request_type: MovementType;
  entity_id: string;
  entity_name: string;
  entity_type: string;
  quantity: number;
  unit: string;
  location_from: string;
  location_to: string;
  priority: Priority;
  estimated_duration?: number;
  estimated_cost?: number;
  notes?: string;
  reference_id?: string;
}

export interface MovementExecutionFormData {
  request_id: string;
  execution_type: MovementType;
  vehicle_id?: string;
  driver_id?: string;
  route_plan?: string;
  cost_center?: string;
  profit_center?: string;
  notes?: string;
}

export interface FleetVehicleFormData {
  vehicle_number: string;
  vehicle_type: VehicleType;
  make: string;
  model: string;
  year?: number;
  license_plate?: string;
  capacity?: string;
  fuel_type?: FuelType;
  current_location?: string;
  purchase_date?: string;
  purchase_cost?: number;
  notes?: string;
}

export interface FleetDriverFormData {
  employee_id: string;
  driver_license_number: string;
  license_type: LicenseType;
  license_expiry: string;
  driving_experience_years?: number;
  specialized_certifications?: string[];
  notes?: string;
}

export interface MovementRouteFormData {
  route_name: string;
  route_type: RouteType;
  start_location: string;
  end_location: string;
  waypoints?: string[];
  estimated_distance?: number;
  estimated_duration?: number;
  fuel_consumption?: number;
  toll_charges?: number;
  route_description?: string;
}

export interface MovementCostFormData {
  execution_id: string;
  cost_type: CostType;
  cost_description: string;
  amount: number;
  currency: string;
  cost_center?: string;
  profit_center?: string;
  receipt_reference?: string;
  notes?: string;
}

// ===== DASHBOARD DATA =====
export interface ResourceMovementDashboardData {
  total_requests: number;
  pending_requests: number;
  active_executions: number;
  completed_movements: number;
  total_fleet_vehicles: number;
  available_vehicles: number;
  total_drivers: number;
  available_drivers: number;
  movement_kpis: MovementKPI[];
  recent_movements: ResourceMovementSummary[];
  fleet_utilization: FleetUtilizationSummary[];
  driver_performance: DriverPerformanceSummary[];
}

export interface MovementKPI {
  id: string;
  kpi_name: string;
  kpi_value: number;
  kpi_unit: string;
  kpi_type: 'efficiency' | 'cost' | 'time' | 'distance';
  target_value?: number;
  actual_value: number;
  variance_percentage: number;
  period: string;
  trend: 'up' | 'down' | 'stable';
}

export interface ResourceMovementSummary {
  id: string;
  request_type: MovementType;
  entity_name: string;
  entity_type: string;
  location_from: string;
  location_to: string;
  request_status: MovementStatus;
  execution_status?: ExecutionStatus;
  priority: Priority;
  requested_at: string;
  estimated_duration?: number;
  estimated_cost?: number;
  actual_duration?: number;
  actual_cost?: number;
  vehicle_number?: string;
  driver_name?: string;
}

export interface FleetUtilizationSummary {
  vehicle_id: string;
  vehicle_number: string;
  vehicle_type: VehicleType;
  make: string;
  model: string;
  status: VehicleStatus;
  current_location?: string;
  total_trips: number;
  total_distance: number;
  total_fuel: number;
  avg_fuel_efficiency: number;
  total_cost: number;
  utilization_percentage: number;
}

export interface DriverPerformanceSummary {
  driver_id: string;
  driver_name: string;
  driver_license_number: string;
  license_type: LicenseType;
  status: DriverStatus;
  total_trips: number;
  total_distance: number;
  safety_rating: number;
  trips_this_month: number;
  distance_this_month: number;
  avg_trip_duration: number;
  performance_score: number;
}

// ===== FILTER OPTIONS =====
export interface MovementFilterOptions {
  date_range?: {
    start_date: string;
    end_date: string;
  };
  request_type?: MovementType;
  entity_type?: string;
  status?: MovementStatus;
  priority?: Priority;
  location_from?: string;
  location_to?: string;
  vehicle_id?: string;
  driver_id?: string;
  cost_center?: string;
  profit_center?: string;
}

// ===== API RESPONSE INTERFACES =====
export interface MovementApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ===== QR SCANNING INTERFACES =====
export interface MovementQRScanEvent {
  id: string;
  qr_code: string;
  entity_type: MovementType;
  entity_id: string;
  entity_name: string;
  scanned_at: string;
  scanned_by: string;
  location: string;
  execution_id?: string;
  checkpoint_type?: CheckpointType;
  available_actions: MovementAction[];
}

export interface MovementAction {
  id: string;
  action_type: 'start_movement' | 'checkpoint_scan' | 'complete_movement' | 'update_status';
  action_name: string;
  description: string;
  applicable_entities: MovementType[];
  estimated_duration: number; // minutes
  required_resources: string[];
  is_active: boolean;
}

// ===== NOTIFICATION INTERFACES =====
export interface MovementAlert {
  id: string;
  alert_type: 'request_pending' | 'execution_overdue' | 'cost_overrun' | 'vehicle_maintenance' | 'driver_license_expiry';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  entity_id?: string;
  entity_type?: MovementType;
  request_id?: string;
  execution_id?: string;
  is_read: boolean;
  created_at: string;
}

// ===== REPORT INTERFACES =====
export interface MovementReport {
  id: string;
  report_type: 'movement_summary' | 'fleet_utilization' | 'driver_performance' | 'cost_analysis' | 'efficiency_report';
  generated_at: string;
  date_range: {
    start_date: string;
    end_date: string;
  };
  data: any[];
  summary: {
    total_movements: number;
    total_distance: number;
    total_cost: number;
    average_efficiency: number;
    fuel_consumption: number;
  };
}

// ===== ENUM TYPES =====
export enum MovementTypes {
  FLEET = 'fleet',
  EQUIPMENT = 'equipment',
  EMPLOYEE = 'employee',
  MATERIAL = 'material'
}

export enum MovementStatuses {
  PENDING = 'pending',
  APPROVED = 'approved',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum ExecutionStatuses {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum Priorities {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum VehicleTypes {
  TRUCK = 'truck',
  VAN = 'van',
  CAR = 'car',
  BUS = 'bus',
  TRAILER = 'trailer'
}

export enum FuelTypes {
  DIESEL = 'diesel',
  PETROL = 'petrol',
  ELECTRIC = 'electric',
  HYBRID = 'hybrid'
}

export enum VehicleStatuses {
  AVAILABLE = 'available',
  IN_USE = 'in_use',
  MAINTENANCE = 'maintenance',
  OUT_OF_SERVICE = 'out_of_service'
}

export enum DriverStatuses {
  AVAILABLE = 'available',
  ON_TRIP = 'on_trip',
  OFF_DUTY = 'off_duty',
  SUSPENDED = 'suspended'
}

export enum LicenseTypes {
  LIGHT_VEHICLE = 'light_vehicle',
  HEAVY_VEHICLE = 'heavy_vehicle',
  COMMERCIAL = 'commercial'
}

export enum RouteTypes {
  STANDARD = 'standard',
  OPTIMIZED = 'optimized',
  CUSTOM = 'custom'
}

export enum CostTypes {
  FUEL = 'fuel',
  TOLL = 'toll',
  LABOR = 'labor',
  MAINTENANCE = 'maintenance',
  OTHER = 'other'
}

export enum PeriodTypes {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly'
}

export enum CheckpointTypes {
  START = 'start',
  PICKUP = 'pickup',
  DELIVERY = 'delivery',
  END = 'end'
} 