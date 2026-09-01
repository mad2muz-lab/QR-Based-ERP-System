// Inventory Service
// This service handles all inventory operations
// No existing functionality is modified or removed

import { supabase } from './supabaseClient';
import { 
  CMInventoryMaterialRequest, 
  MaterialRequestItem, 
  MaterialSelection,
  MaterialFilter,
  InventoryRequestFilter 
} from '../types/inventory';
import { Equipment } from '../types';

export class InventoryService {
  /**
   * Create a new inventory material request
   */
  static async createInventoryMaterialRequest(
    maintenanceRequestId: string,
    equipment: Equipment,
    materialsSelected: MaterialSelection[],
    userId: string,
    priority: string = 'medium'
  ): Promise<{ success: boolean; data?: CMInventoryMaterialRequest; error?: string }> {
    try {
      console.log('🔍 DEBUG: Creating inventory material request with:', {
        maintenanceRequestId,
        equipment: equipment.name,
        materialsSelected: materialsSelected.length,
        userId,
        priority
      });

      if (!supabase) {
        console.error('🔍 DEBUG: Supabase not configured');
        return { success: false, error: 'Supabase not configured' };
      }

      // Calculate total estimated cost
      const totalEstimatedCost = materialsSelected.reduce((total, material) => {
        return total + (material.estimated_cost * material.quantity);
      }, 0);

      const inventoryRequest = {
        maintenance_request_id: maintenanceRequestId,
        equipment_id: equipment.id,
        equipment_name: equipment.name,
        site: equipment.site,
        requested_by: userId,
        priority: priority,
        materials_requested: materialsSelected,
        total_estimated_cost: totalEstimatedCost,
        status: 'pending'
      };

      console.log('🔍 DEBUG: Inventory request object:', inventoryRequest);

      console.log('🔍 DEBUG: Inserting inventory request into database...');
      const { data, error } = await supabase
        .from('cm_inventory_material_requests')
        .insert([inventoryRequest])
        .select()
        .single();

      if (error) {
        console.error('🔍 DEBUG: Database error creating inventory material request:', error);
        return { success: false, error: error.message };
      }

      console.log('🔍 DEBUG: Inventory request created successfully:', data);

      // Create material request items
      if (data && materialsSelected.length > 0) {
        const materialItems = materialsSelected.map(material => ({
          inventory_request_id: data.id,
          material_id: material.material_id,
          material_name: material.material_name,
          material_type: material.material_type,
          requested_quantity: material.quantity,
          unit: material.unit,
          estimated_cost: material.estimated_cost,
          quality_grade: material.quality_grade
        }));

        const { error: itemsError } = await supabase
          .from('cm_material_request_items')
          .insert(materialItems);

        if (itemsError) {
          console.error('Error creating material request items:', itemsError);
          // Don't fail the entire request, just log the error
        }
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error creating inventory material request:', error);
      return { success: false, error: 'Failed to create inventory material request' };
    }
  }

  /**
   * Get all inventory material requests
   */
  static async getInventoryMaterialRequests(
    filters?: InventoryRequestFilter
  ): Promise<{ success: boolean; data?: CMInventoryMaterialRequest[]; error?: string }> {
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase not configured' };
      }

      let query = supabase
        .from('cm_inventory_material_requests')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.site) {
        query = query.eq('site', filters.site);
      }
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching inventory material requests:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching inventory material requests:', error);
      return { success: false, error: 'Failed to fetch inventory material requests' };
    }
  }

  /**
   * Get inventory material request by ID
   */
  static async getInventoryMaterialRequestById(
    requestId: string
  ): Promise<{ success: boolean; data?: CMInventoryMaterialRequest; error?: string }> {
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase not configured' };
      }

      const { data, error } = await supabase
        .from('cm_inventory_material_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) {
        console.error('Error fetching inventory material request:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching inventory material request:', error);
      return { success: false, error: 'Failed to fetch inventory material request' };
    }
  }

  /**
   * Update inventory material request status
   */
  static async updateInventoryMaterialRequestStatus(
    requestId: string,
    status: string,
    issuedBy?: string,
    inventoryNotes?: string
  ): Promise<{ success: boolean; data?: CMInventoryMaterialRequest; error?: string }> {
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase not configured' };
      }

      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'issued' && issuedBy) {
        updateData.issued_by = issuedBy;
        updateData.issued_at = new Date().toISOString();
      }

      if (inventoryNotes) {
        updateData.inventory_notes = inventoryNotes;
      }

      const { data, error } = await supabase
        .from('cm_inventory_material_requests')
        .update(updateData)
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        console.error('Error updating inventory material request:', error);
        return { success: false, error: error.message };
      }

      // If status is issued, update the maintenance request inventory status
      if (status === 'issued' && data?.maintenance_request_id) {
        await supabase
          .from('corrective_maintenance_requests')
          .update({ 
            inventory_status: 'issued',
            updated_at: new Date().toISOString()
          })
          .eq('id', data.maintenance_request_id);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating inventory material request:', error);
      return { success: false, error: 'Failed to update inventory material request' };
    }
  }

  /**
   * Get material request items for an inventory request
   */
  static async getMaterialRequestItems(
    inventoryRequestId: string
  ): Promise<{ success: boolean; data?: MaterialRequestItem[]; error?: string }> {
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase not configured' };
      }

      const { data, error } = await supabase
        .from('cm_material_request_items')
        .select('*')
        .eq('inventory_request_id', inventoryRequestId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching material request items:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching material request items:', error);
      return { success: false, error: 'Failed to fetch material request items' };
    }
  }

  /**
   * Update material request item issued quantity
   */
  static async updateMaterialRequestItemQuantity(
    itemId: string,
    issuedQuantity: number
  ): Promise<{ success: boolean; data?: MaterialRequestItem; error?: string }> {
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase not configured' };
      }

      const { data, error } = await supabase
        .from('cm_material_request_items')
        .update({ issued_quantity: issuedQuantity })
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        console.error('Error updating material request item:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating material request item:', error);
      return { success: false, error: 'Failed to update material request item' };
    }
  }

  /**
   * Get materials with filters
   */
  static async getMaterials(
    filters?: MaterialFilter
  ): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase not configured' };
      }

      let query = supabase
        .from('materials')
        .select('*')
        .order('name', { ascending: true });

      // Apply filters
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.site) {
        query = query.eq('site', filters.site);
      }
      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching materials:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching materials:', error);
      return { success: false, error: 'Failed to fetch materials' };
    }
  }

  /**
   * Get material by ID
   */
  static async getMaterialById(
    materialId: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase not configured' };
      }

      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('id', materialId)
        .single();

      if (error) {
        console.error('Error fetching material:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching material:', error);
      return { success: false, error: 'Failed to fetch material' };
    }
  }
} 