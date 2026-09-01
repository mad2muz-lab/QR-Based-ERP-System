import { supabase } from '../../utils/supabaseClient';
import { AuthManager } from '../../utils/authUtils';
import { MaterialItem, StockMovement, MovementType } from './data/ksaData';

export interface CreateMovementParams {
  itemId: string;
  itemName: string;
  sku: string;
  type: MovementType;
  quantity: number;
  fromLocation?: string;
  toLocation?: string;
  performedBy?: string;
  notes?: string;
}

export class SupabaseInventoryService {
  static async createMovement(params: CreateMovementParams): Promise<{ success: boolean; data?: StockMovement; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };

    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .insert([{
          material_id: params.itemId,
          quantity: params.quantity,
          action: params.type,
          reference_number: params.fromLocation,
          notes: params.notes,
          performed_by: null,
          metadata: { sku: params.sku, itemName: params.itemName, toLocation: params.toLocation }
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: {
          id: data.id,
          itemId: params.itemId,
          itemName: params.itemName,
          sku: params.sku,
          type: params.type,
          quantity: params.quantity,
          fromLocation: params.fromLocation,
          toLocation: params.toLocation,
          reference: data.reference_number,
          performedBy: params.performedBy || 'Current User',
          timestamp: data.created_at,
          notes: params.notes
        }
      };
    } catch (error: any) {
      console.error('Error creating stock movement:', error);
      return { success: false, error: error.message };
    }
  }

  static async getMovements(itemId?: string): Promise<StockMovement[]> {
    if (!supabase) return [];

    try {
      let query = supabase.from('stock_movements').select('*').order('created_at', { ascending: false });
      if (itemId) query = query.eq('material_id', itemId);

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((m: any) => ({
        id: m.id,
        itemId: m.material_id,
        itemName: m.metadata?.itemName || '',
        sku: m.metadata?.sku || '',
        type: m.action as MovementType,
        quantity: m.quantity,
        fromLocation: m.reference_number,
        toLocation: m.metadata?.toLocation,
        reference: m.reference_number,
        performedBy: 'User',
        timestamp: m.created_at,
        notes: m.notes
      }));
    } catch (error) {
      console.error('Error fetching stock movements:', error);
      return [];
    }
  }

  static async updateMaterialStock(materialId: string, newQuantity: number, notes?: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };

    try {
      const { error } = await supabase
        .from('materials')
        .update({ quantity: newQuantity, last_updated: new Date().toISOString() })
        .eq('id', materialId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error updating material stock:', error);
      return { success: false, error: error.message };
    }
  }

  static async getMaterialById(materialId: string): Promise<MaterialItem | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('id', materialId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        ...data,
        id: data.id,
        sku: data.sku,
        name: data.name,
        quantity: data.quantity || 0,
        reserved: data.reserved || 0,
        minStock: data.min_stock || 0,
        reorderLevel: data.reorder_level || 0,
        unitCost: data.unit_cost || 0,
        location: data.location || '',
        zoneId: data.zone_id || '',
        warehouseId: data.warehouse_id || data.site_id || '',
        qrCode: data.qr_code || data.qrCode,
        supplier: data.supplier,
        status: data.quantity === 0 ? 'out_of_stock' : (data.quantity <= (data.reorder_level || 0) ? 'low_stock' : 'in_stock')
      } as MaterialItem;
    } catch (error) {
      console.error('Error fetching material by ID:', error);
      return null;
    }
  }
}