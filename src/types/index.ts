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
  action: 'start-use' | 'stop-use';
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

// ✅ Re-export constants and types
export { MATERIAL_TYPES };
export type { MaterialType };
