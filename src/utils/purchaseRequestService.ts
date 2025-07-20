import { PurchaseRequest, PurchaseRequestItem, MaterialSelection } from '../types';
import { supabase } from './supabaseClient';
import { AuthManager } from './authUtils';

export class PurchaseRequestService {
  // Create a new Purchase Request
  static async createPurchaseRequest(pr: Omit<PurchaseRequest, 'id' | 'pr_number' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: PurchaseRequest; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    try {
      const { data, error } = await supabase
        .from('purchase_requests')
        .insert([pr])
        .select()
        .single();

      if (error) {
        console.error('Error creating purchase request:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error creating purchase request:', error);
      return { success: false, error: 'Failed to create purchase request' };
    }
  }

  // Add items to a Purchase Request
  static async addPurchaseRequestItems(prId: string, items: Omit<PurchaseRequestItem, 'id' | 'pr_id' | 'created_at' | 'updated_at'>[]): Promise<{ success: boolean; data?: PurchaseRequestItem[]; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    try {
      const itemsWithPrId = items.map(item => ({
        ...item,
        pr_id: prId
      }));

      const { data, error } = await supabase
        .from('purchase_request_items')
        .insert(itemsWithPrId)
        .select();

      if (error) {
        console.error('Error adding PR items:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error adding PR items:', error);
      return { success: false, error: 'Failed to add PR items' };
    }
  }

  // Get all Purchase Requests
  static async getPurchaseRequests(): Promise<{ success: boolean; data?: PurchaseRequest[]; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    try {
      const { data, error } = await supabase
        .from('purchase_requests')
        .select(`
          *,
          items:purchase_request_items(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching purchase requests:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching purchase requests:', error);
      return { success: false, error: 'Failed to fetch purchase requests' };
    }
  }

  // Get Purchase Request by ID
  static async getPurchaseRequestById(prId: string): Promise<{ success: boolean; data?: PurchaseRequest; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    try {
      const { data, error } = await supabase
        .from('purchase_requests')
        .select(`
          *,
          items:purchase_request_items(*)
        `)
        .eq('id', prId)
        .single();

      if (error) {
        console.error('Error fetching purchase request:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching purchase request:', error);
      return { success: false, error: 'Failed to fetch purchase request' };
    }
  }

  // Update Purchase Request status
  static async updatePurchaseRequestStatus(prId: string, status: PurchaseRequest['status'], approvedBy?: string, rejectionReason?: string): Promise<{ success: boolean; data?: PurchaseRequest; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'approved' && approvedBy) {
        updateData.approved_date = new Date().toISOString();
        updateData.approved_by = approvedBy;
      }

      if (status === 'rejected' && rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      const { data, error } = await supabase
        .from('purchase_requests')
        .update(updateData)
        .eq('id', prId)
        .select()
        .single();

      if (error) {
        console.error('Error updating purchase request status:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating purchase request status:', error);
      return { success: false, error: 'Failed to update purchase request status' };
    }
  }

  // Auto-generate PR from maintenance parts selection
  static async autoGeneratePRFromMaintenance(
    equipmentId: string,
    equipmentName: string,
    maintenanceType: string,
    materialSelections: MaterialSelection[],
    site: string,
    department: string = 'Maintenance'
  ): Promise<{ success: boolean; data?: PurchaseRequest; error?: string }> {
    try {
      const currentUser = AuthManager.getCurrentUserSync();
      if (!currentUser) {
        return { success: false, error: 'User not authenticated' };
      }

      // Filter only spare parts that need procurement
      const sparePartsNeedingPR = materialSelections.filter(
        material => material.isSparePart && material.quantity > material.availableStock
      );

      if (sparePartsNeedingPR.length === 0) {
        return { success: false, error: 'No spare parts requiring procurement found' };
      }

      // Calculate total estimated cost
      const totalEstimatedCost = sparePartsNeedingPR.reduce(
        (total, material) => total + (material.estimatedCost * material.quantity),
        0
      );

      // Create PR
      const prData: Omit<PurchaseRequest, 'id' | 'pr_number' | 'created_at' | 'updated_at'> = {
        title: `Auto-Generated PR - ${maintenanceType} Maintenance for ${equipmentName}`,
        description: `Automatically generated Purchase Request for ${maintenanceType} maintenance of equipment ${equipmentName} (ID: ${equipmentId}). Parts required for maintenance completion.`,
        requested_by: currentUser.name || currentUser.username || 'System',
        department,
        site,
        priority: this.determinePriority(materialSelections),
        status: 'draft',
        total_estimated_cost: totalEstimatedCost,
        currency: 'SAR',
        requested_date: new Date().toISOString(),
        required_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      };

      const prResult = await this.createPurchaseRequest(prData);
      if (!prResult.success || !prResult.data) {
        return { success: false, error: prResult.error || 'Failed to create PR' };
      }

      // Create PR items
      const prItems = sparePartsNeedingPR.map(material => ({
        material_name: material.materialName,
        material_type: material.materialType,
        quantity_required: material.quantity,
        quantity_available: material.availableStock,
        unit: material.unit,
        estimated_unit_cost: material.estimatedCost,
        total_estimated_cost: material.estimatedCost * material.quantity,
        urgency_reason: material.urgencyLevel === 'critical' ? 'Critical for equipment operation' : 
                       material.urgencyLevel === 'urgent' ? 'Urgent maintenance requirement' : 'Standard maintenance requirement',
        specifications: `Required for ${maintenanceType} maintenance of ${equipmentName}`
      }));

      const itemsResult = await this.addPurchaseRequestItems(prResult.data.id, prItems);
      if (!itemsResult.success) {
        console.error('Failed to add PR items:', itemsResult.error);
        // PR was created but items failed - this is not ideal but we'll continue
      }

      return { success: true, data: prResult.data };
    } catch (error) {
      console.error('Error auto-generating PR:', error);
      return { success: false, error: 'Failed to auto-generate PR' };
    }
  }

  // Determine PR priority based on material urgency
  private static determinePriority(materialSelections: MaterialSelection[]): PurchaseRequest['priority'] {
    const hasCritical = materialSelections.some(m => m.urgencyLevel === 'critical');
    const hasUrgent = materialSelections.some(m => m.urgencyLevel === 'urgent');

    if (hasCritical) return 'urgent';
    if (hasUrgent) return 'high';
    return 'medium';
  }

  // Get PRs by status
  static async getPurchaseRequestsByStatus(status: PurchaseRequest['status']): Promise<{ success: boolean; data?: PurchaseRequest[]; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    try {
      const { data, error } = await supabase
        .from('purchase_requests')
        .select(`
          *,
          items:purchase_request_items(*)
        `)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching purchase requests by status:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching purchase requests by status:', error);
      return { success: false, error: 'Failed to fetch purchase requests by status' };
    }
  }

  // Get PRs by department
  static async getPurchaseRequestsByDepartment(department: string): Promise<{ success: boolean; data?: PurchaseRequest[]; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    try {
      const { data, error } = await supabase
        .from('purchase_requests')
        .select(`
          *,
          items:purchase_request_items(*)
        `)
        .eq('department', department)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching purchase requests by department:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching purchase requests by department:', error);
      return { success: false, error: 'Failed to fetch purchase requests by department' };
    }
  }

  // Delete Purchase Request (only if in draft status)
  static async deletePurchaseRequest(prId: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    try {
      // First check if PR is in draft status
      const { data: pr, error: fetchError } = await supabase
        .from('purchase_requests')
        .select('status')
        .eq('id', prId)
        .single();

      if (fetchError) {
        console.error('Error fetching PR status:', fetchError);
        return { success: false, error: fetchError.message };
      }

      if (pr.status !== 'draft') {
        return { success: false, error: 'Only draft PRs can be deleted' };
      }

      const { error } = await supabase
        .from('purchase_requests')
        .delete()
        .eq('id', prId);

      if (error) {
        console.error('Error deleting purchase request:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting purchase request:', error);
      return { success: false, error: 'Failed to delete purchase request' };
    }
  }
} 