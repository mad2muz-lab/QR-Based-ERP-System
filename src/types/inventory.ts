// Inventory Types
// This file contains all TypeScript interfaces for the inventory system
// No existing functionality is modified or removed

export interface CMInventoryMaterialRequest {
  id: string;
  maintenance_request_id: string;
  equipment_id: string;
  equipment_name: string;
  site: string;
  requested_by: string;
  requested_at: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected' | 'issued';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  materials_requested: MaterialRequestItem[];
  total_estimated_cost: number;
  inventory_notes?: string;
  issued_by?: string;
  issued_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MaterialRequestItem {
  id: string;
  inventory_request_id: string;
  material_id: string;
  material_name: string;
  material_type: string;
  requested_quantity: number;
  issued_quantity: number;
  unit: string;
  estimated_cost: number;
  quality_grade: 'standard' | 'premium' | 'economy';
  notes?: string;
  created_at: string;
}

export interface MaterialSelection {
  material_id: string;
  material_name: string;
  material_type: string;
  quantity: number;
  unit: string;
  quality_grade: 'standard' | 'premium' | 'economy';
  estimated_cost: number;
}

export interface InventoryNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'inventory';
  entity_type: 'equipment';
  entity_id: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  action_url: string;
  is_read: boolean;
  created_at: string;
  role?: string;
}

export interface MaterialFilter {
  type?: string;
  status?: string;
  site?: string;
  search?: string;
}

export interface InventoryRequestFilter {
  status?: string;
  priority?: string;
  site?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface QualityGradeOption {
  value: 'standard' | 'premium' | 'economy';
  label: string;
  description: string;
  color: string;
}

export const QUALITY_GRADE_OPTIONS: QualityGradeOption[] = [
  {
    value: 'standard',
    label: 'Standard Grade',
    description: 'Regular quality materials for normal use',
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  {
    value: 'premium',
    label: 'Premium Grade',
    description: 'High-quality materials for critical applications',
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  {
    value: 'economy',
    label: 'Economy Grade',
    description: 'Cost-effective materials for non-critical use',
    color: 'bg-gray-100 text-gray-800 border-gray-200'
  }
]; 