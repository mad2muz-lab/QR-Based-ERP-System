// Corrective Maintenance Types
// This file contains all TypeScript interfaces for the corrective maintenance system

// Import MaterialSelection from inventory types
import { MaterialSelection } from './inventory';

export interface CorrectiveMaintenanceRequest {
  id: string;
  equipment_id: string;
  equipment_name: string;
  equipment_type: string;
  equipment_model: string;
  site: string;
  reported_by: string;
  reported_at: string;
  issue_description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assigned_technician?: string;
  assigned_at?: string;
  estimated_duration_hours: number;
  actual_duration_hours?: number;
  completion_notes?: string;
  completed_at?: string;
  completed_by?: string;
  total_cost: number;
  parts_used: string[];
  safety_concerns?: string;
  attachments: string[];
  repair_location: 'site' | 'yard';
  geo_coordinates?: [number, number];
  maintenance_start_time: string;
  created_at: string;
  updated_at: string;
}

export interface CorrectiveMaintenanceFormData {
  issue_description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_duration_hours: number;
  safety_concerns: string;
  attachments: File[];
  repair_location: 'site' | 'yard';
  geo_coordinates?: [number, number];
  // New material selection fields (append approach)
  materials_selected?: MaterialSelection[];
}

export interface MaintenanceNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'maintenance';
  entity_type: 'equipment';
  entity_id: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  action_url: string;
  is_read: boolean;
  created_at: string;
  maintenance_request_id?: string;
  assigned_to?: string;
}

export interface PriorityOption {
  value: 'low' | 'medium' | 'high' | 'urgent';
  label: string;
  description: string;
  color: string;
}

export const PRIORITY_OPTIONS: PriorityOption[] = [
  {
    value: 'low',
    label: 'Low Priority',
    description: 'Can be addressed during regular maintenance',
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  {
    value: 'medium',
    label: 'Medium Priority',
    description: 'Should be addressed soon',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  {
    value: 'high',
    label: 'High Priority',
    description: 'Affects operations, needs attention',
    color: 'bg-orange-100 text-orange-800 border-orange-200'
  },
  {
    value: 'urgent',
    label: 'Urgent',
    description: 'Safety issue or critical failure',
    color: 'bg-red-100 text-red-800 border-red-200'
  }
];

export interface RepairLocationOption {
  value: 'site' | 'yard';
  label: string;
  description: string;
}

export const REPAIR_LOCATION_OPTIONS: RepairLocationOption[] = [
  {
    value: 'site',
    label: 'Repair on Site',
    description: 'Repair at current location'
  },
  {
    value: 'yard',
    label: 'Yard Repair',
    description: 'Move to maintenance yard'
  }
]; 