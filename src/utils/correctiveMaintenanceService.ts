// Corrective Maintenance Service
// This service handles all corrective maintenance operations
// No existing functionality is modified or removed

import { supabase } from './supabaseClient';
import { CorrectiveMaintenanceRequest, CorrectiveMaintenanceFormData } from '../types/correctiveMaintenance';
import { Equipment } from '../types';
import { InventoryService } from './inventoryService';

export class CorrectiveMaintenanceService {
  /**
   * Create a new corrective maintenance request
   */
  static async createMaintenanceRequest(
    equipment: Equipment,
    formData: CorrectiveMaintenanceFormData,
    userId: string
  ): Promise<{ success: boolean; data?: CorrectiveMaintenanceRequest; error?: string }> {
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase not configured' };
      }

      const maintenanceRequest = {
        equipment_id: equipment.id,
        equipment_name: equipment.name,
        equipment_type: equipment.type,
        equipment_model: equipment.model,
        site: equipment.site,
        reported_by: userId,
        issue_description: formData.issue_description,
        priority: formData.priority,
        estimated_duration_hours: formData.estimated_duration_hours,
        safety_concerns: formData.safety_concerns,
        repair_location: formData.repair_location,
        geo_coordinates: formData.geo_coordinates ? 
          `(${formData.geo_coordinates[0]},${formData.geo_coordinates[1]})` : null,
        maintenance_start_time: new Date().toISOString(),
        attachments: [], // Will be handled separately for file uploads
        parts_used: [],
        total_cost: 0
      };

      const { data, error } = await supabase
        .from('corrective_maintenance_requests')
        .insert([maintenanceRequest])
        .select()
        .single();

      if (error) {
        console.error('Error creating maintenance request:', error);
        return { success: false, error: error.message };
      }

      // Update notification priority if notification exists
      await this.updateNotificationPriority(equipment.id, formData.priority);

      // Create inventory material request if materials are selected (append approach)
      console.log('🔍 DEBUG: Checking for materials_selected:', formData.materials_selected);
      if (formData.materials_selected && formData.materials_selected.length > 0) {
        console.log('🔍 DEBUG: Materials selected, creating inventory request...');
        try {
          const inventoryResult = await InventoryService.createInventoryMaterialRequest(
            data.id,
            equipment,
            formData.materials_selected,
            userId,
            formData.priority
          );

          console.log('🔍 DEBUG: Inventory result:', inventoryResult);

          if (inventoryResult.success && inventoryResult.data) {
            console.log('🔍 DEBUG: Inventory request created successfully, updating maintenance request...');
            // Update the maintenance request with inventory request ID
            await supabase
              .from('corrective_maintenance_requests')
              .update({ 
                inventory_request_id: inventoryResult.data.id,
                inventory_status: 'pending'
              })
              .eq('id', data.id);
            console.log('🔍 DEBUG: Maintenance request updated with inventory info');
          } else {
            console.error('🔍 DEBUG: Inventory request failed:', inventoryResult.error);
          }
        } catch (error) {
          console.error('Error creating inventory material request:', error);
          // Don't fail the maintenance request if inventory request fails
        }
      } else {
        console.log('🔍 DEBUG: No materials selected, skipping inventory request creation');
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error creating maintenance request:', error);
      return { success: false, error: 'Failed to create maintenance request' };
    }
  }

  /**
   * Get all maintenance requests for a user
   */
  static async getMaintenanceRequests(userId: string): Promise<{ success: boolean; data?: CorrectiveMaintenanceRequest[]; error?: string }> {
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase not configured' };
      }

      const { data, error } = await supabase
        .from('corrective_maintenance_requests')
        .select('*')
        .eq('reported_by', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching maintenance requests:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching maintenance requests:', error);
      return { success: false, error: 'Failed to fetch maintenance requests' };
    }
  }

  /**
   * Get all maintenance requests (admin only)
   */
  static async getAllMaintenanceRequests(): Promise<{ success: boolean; data?: CorrectiveMaintenanceRequest[]; error?: string }> {
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase not configured' };
      }

      const { data, error } = await supabase
        .from('corrective_maintenance_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all maintenance requests:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching all maintenance requests:', error);
      return { success: false, error: 'Failed to fetch maintenance requests' };
    }
  }

  /**
   * Get maintenance request by ID
   */
  static async getMaintenanceRequestById(requestId: string): Promise<{ success: boolean; data?: CorrectiveMaintenanceRequest; error?: string }> {
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase not configured' };
      }

      const { data, error } = await supabase
        .from('corrective_maintenance_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) {
        console.error('Error fetching maintenance request:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching maintenance request:', error);
      return { success: false, error: 'Failed to fetch maintenance request' };
    }
  }

  /**
   * Update maintenance request
   */
  static async updateMaintenanceRequest(
    requestId: string,
    updateData: Partial<CorrectiveMaintenanceRequest>
  ): Promise<{ success: boolean; data?: CorrectiveMaintenanceRequest; error?: string }> {
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase not configured' };
      }

      const { data, error } = await supabase
        .from('corrective_maintenance_requests')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        console.error('Error updating maintenance request:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating maintenance request:', error);
      return { success: false, error: 'Failed to update maintenance request' };
    }
  }

  /**
   * Update notification priority when maintenance request is created
   */
  private static async updateNotificationPriority(equipmentId: string, priority: string): Promise<void> {
    try {
      if (!supabase) return;

      const { error } = await supabase
        .from('notifications')
        .update({ priority })
        .eq('entity_id', equipmentId)
        .eq('type', 'maintenance');

      if (error) {
        console.error('Error updating notification priority:', error);
      }
    } catch (error) {
      console.error('Error updating notification priority:', error);
    }
  }

  /**
   * Get equipment that requires maintenance
   */
  static async getEquipmentRequiringMaintenance(): Promise<{ success: boolean; data?: Equipment[]; error?: string }> {
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase not configured' };
      }

      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('status', 'maintenance')
        .order('last_updated', { ascending: false });

      if (error) {
        console.error('Error fetching equipment requiring maintenance:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching equipment requiring maintenance:', error);
      return { success: false, error: 'Failed to fetch equipment requiring maintenance' };
    }
  }

  /**
   * Get current location coordinates
   */
  static async getCurrentLocation(): Promise<{ success: boolean; coordinates?: [number, number]; error?: string }> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ success: false, error: 'Geolocation not supported' });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            success: true,
            coordinates: [position.coords.latitude, position.coords.longitude]
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          resolve({ success: false, error: 'Failed to get location' });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }
} 