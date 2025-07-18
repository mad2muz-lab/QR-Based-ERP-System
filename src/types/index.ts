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
  estimated_duration_hours?: number;
  actual_duration_hours?: number;
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

// ✅ Re-export constants and types
export { MATERIAL_TYPES };
export type { MaterialType };
