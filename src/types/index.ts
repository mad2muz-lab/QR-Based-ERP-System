// src/types/index.ts

import { MATERIAL_TYPES } from './constants';
import type { MaterialType } from './constants';

export interface Employee {
  id: string;
  name: string;
  type?: string;
  department: string;
  position: string;
  bloodGroup: string;
  site: string;
  qrCode: string;
  status: 'active' | 'inactive';
  createdAt: string;
  lastUpdated: string;
  photo?: string;
  email?: string;
  phone?: string;
  oldId?: string; // Legacy ID from previous system
  companyId?: string;
  costCenterCode?: string; // Cost center code for financial analysis
  profitCenterCode?: string; // Profit center code for financial analysis
}

export interface Equipment {
  id: string; // Auto-generated UUID (primary key)
  custom_equipment_id: string; // User-defined unique identifier
  name: string;
  type: string;
  model: string;
  site: string;
  qrCode: string;
  status: 'available' | 'in-use' | 'maintenance' | 'down';
  operational_status: 'working' | 'not_working' | 'in_use' | 'standby' | 'under_repair' | 'under_service';
  createdAt: string;
  lastUpdated: string;
  serialNumber?: string;
  oldId?: string; // Legacy ID from previous system
  companyId?: string;
  costCenterCode?: string; // Cost center code for financial analysis
  profitCenterCode?: string; // Profit center code for financial analysis
}

export interface Material {
  id: string;
  name: string;
  type: MaterialType;
  unit: string;
  site: string;
  qrCode: string;
  quantity: number;
  status: 'available' | 'low-stock' | 'out-of-stock';
  createdAt: string;
  lastUpdated: string;
  use?: string;
  accessLevel?: 'basic' | 'restricted' | 'admin';
  oldId?: string; // Legacy ID from previous system
  companyId?: string;
  costCenterCode?: string; // Cost center code for financial analysis
  profitCenterCode?: string; // Profit center code for financial analysis
}

export interface Site {
  id: string;
  name: string;
  province: string;
  coordinates: [number, number]; // [longitude, latitude]
  address: string;
  manager: string;
  lastUpdated: string;
  type?: string;
  qrCode: string;
  costCenterCode?: string; // Cost center code for financial analysis
  profitCenterCode?: string; // Profit center code for financial analysis
}

export interface TimeLog {
  id: string;
  entityId: string;
  entityType: 'employee' | 'equipment' | 'material' | 'site';
  action: 'clock-in' | 'clock-out' | 'start-use' | 'stop-use' | 'material-in' | 'material-out' | 'site-checkin';
  timestamp: string;
  site: string;
  notes?: string;
  location?: [number, number];
  quantity?: number;
}

// New separate log interfaces
export interface EmployeeLog {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  site: string;
  action: 'clock-in' | 'clock-out';
  date: string;
  time: string;
  timestamp: string;
  notes?: string;
  location?: [number, number];
  oldId?: string; // Legacy ID from previous system
}

export interface EquipmentLog {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentType: string;
  action: 'start-use' | 'stop-use' | 'standby-start' | 'standby-end' | 'maintenance-start' | 'maintenance-end';
  date: string;
  time: string;
  timestamp: string;
  site: string;
  status: string;
  notes?: string;
  location?: [number, number];
  oldId?: string; // Legacy ID from previous system
}

export interface MaterialLog {
  id: string;
  materialId: string;
  materialName: string;
  materialType: string;
  action: 'material-in' | 'material-out';
  quantity: number;
  date: string;
  time: string;
  timestamp: string;
  site: string;
  status: string;
  notes?: string;
  location?: [number, number];
  oldId?: string; // Legacy ID from previous system
}

export interface Province {
  name: string;
  coordinates: [number, number];
  sites: Site[];
  stats: {
    employees: number;
    equipment: number;
    materials: number;
  };
}

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'developer' | 'admin' | 'manager' | 'operator' | 'viewer';
  name: string;
  email: string;
  site?: string;
  isFirstLogin: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

// Equipment Maintenance System Types
export interface EquipmentMaintenanceLog {
  id: string;
  equipment_id: string; // This is TEXT in database, not UUID
  maintenance_type: 'repair' | 'service';
  repair_type?: 'on_site' | 'yard_repair';
  service_type?: 'type_a' | 'type_b' | 'type_c';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  description?: string;
  technician_notes?: string;
  parts_used?: string;
  start_date: string;
  completion_date?: string;
  completed_by?: string;
  estimated_duration_hours?: number; // Can be decimal like 1.5
  actual_duration_hours?: number; // Can be decimal like 1.5
  cost?: number;
  next_maintenance_date?: string;
  created_at: string;
  updated_at: string;
  // New fields for reporting
  equipment_name?: string;
  old_equipment_id?: string;
  equipment_type?: string;
  model?: string;
  serial_number?: string;
  site_assignment?: string;
  // Enhanced workflow fields
  assigned_technician?: string;
  workflow_step?: 'marked' | 'inspected' | 'in_progress' | 'completed';
  inspection_date?: string;
  work_start_date?: string;
  work_completion_date?: string;
  equipment_condition_before?: string;
  equipment_condition_after?: string;
  safety_checks_completed?: boolean;
  quality_checks_completed?: boolean;
}

export interface EquipmentMaintenanceSchedule {
  id: string;
  equipment_id: string; // This is TEXT in database, not UUID
  schedule_type: 'preventive' | 'corrective' | 'emergency';
  maintenance_type: 'repair' | 'service';
  frequency_days?: number;
  last_maintenance_date?: string;
  next_maintenance_date: string;
  assigned_technician?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Purchase Request System Types
export interface PurchaseRequest {
  id: string;
  pr_number: string;
  title: string;
  description?: string;
  requested_by: string;
  department: string;
  site: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'ordered' | 'received' | 'closed';
  total_estimated_cost: number;
  currency: string;
  requested_date: string;
  required_date?: string;
  approved_date?: string;
  approved_by?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  // Additional fields for UI
  department_name?: string;
  site_name?: string;
  requester_name?: string;
  approver_name?: string;
  items?: PurchaseRequestItem[];
}

export interface PurchaseRequestItem {
  id: string;
  pr_id: string;
  material_name: string;
  material_type: string;
  quantity_required: number;
  quantity_available: number;
  unit: string;
  estimated_unit_cost: number;
  total_estimated_cost: number;
  urgency_reason?: string;
  supplier_suggestion?: string;
  specifications?: string;
  created_at: string;
  updated_at: string;
  // Additional fields for UI
  material_id?: string; // Reference to existing material if available
  current_stock?: number;
  low_stock_threshold?: number;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'maintenance' | 'schedule';
  entity_type?: 'equipment' | 'employee' | 'material' | 'site';
  entity_id?: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
  expires_at?: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'technician' | 'manager' | 'admin' | 'viewer';
  permissions: Record<string, any>;
  assigned_by?: string;
  assigned_at: string;
  is_active: boolean;
}

export interface PageAccess {
  id: string;
  user_id: string;
  page_name: string;
  can_access: boolean;
  can_edit: boolean;
  can_delete: boolean;
  assigned_by?: string;
  assigned_at: string;
}

// Enhanced maintenance workflow types
export interface MaintenanceWorkflowHistory {
  id: string;
  maintenance_log_id: string;
  workflow_step: string;
  action_performed: string;
  performed_by?: string;
  performed_at: string;
  notes?: string;
  equipment_status_before?: string;
  equipment_status_after?: string;
}

export interface MaintenanceDashboardView {
  id: string;
  equipment_id: string;
  maintenance_type: 'repair' | 'service';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  description?: string;
  start_date: string;
  completion_date?: string;
  equipment_name: string;
  custom_equipment_id: string;
  equipment_type: string;
  equipment_site: string;
  equipment_operational_status: string;
  workflow_status_display: string;
  workflow_step_display: string;
  total_hours_elapsed: number;
  work_hours_elapsed: number;
}

export interface MaintenanceStatistics {
  total_maintenance_requests: number;
  completed_maintenance: number;
  in_progress_maintenance: number;
  scheduled_maintenance: number;
  average_completion_time_hours: number;
  total_cost: number;
  repair_count: number;
  service_count: number;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  parent_role_id?: string | null;
}

export interface RoleWithPermissions extends Role {
  permissions: string[]; // List of page_names this role can access
}

export interface RolePageAccess {
  id: string;
  role_id: string;
  page_name: string;
  can_access: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  lastUpdated: string;
  type?: string;
}

// Cost Center and Profit Center interfaces
export interface CostCenter {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProfitCenter {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ✅ Re-export constants and types
export { MATERIAL_TYPES };
export type { MaterialType };

// Material Selection for Maintenance
export interface MaterialSelection {
  materialId: string;
  materialName: string;
  materialType: string;
  quantity: number;
  unit: string;
  availableStock: number;
  estimatedCost: number;
  isSparePart: boolean;
  urgencyLevel: 'normal' | 'urgent' | 'critical';
  autoPRGenerated: boolean;
  prId?: string;
}
