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