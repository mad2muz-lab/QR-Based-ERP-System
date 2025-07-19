import { supabase } from './supabaseClient';
import { CostCenter, ProfitCenter } from '../types';

export class CostProfitCenterService {
  // Fetch all active cost centers
  static async getCostCenters(): Promise<{ success: boolean; data?: CostCenter[]; error?: string }> {
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase client not initialized' };
      }

      const { data, error } = await supabase
        .from('cost_centers')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching cost centers:', error);
        return { success: false, error: error.message };
      }

      // Transform the data to match our interface
      const costCenters: CostCenter[] = data.map(item => ({
        id: item.id,
        code: item.code,
        name: item.name,
        description: item.description,
        isActive: item.is_active,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      return { success: true, data: costCenters };
    } catch (error) {
      console.error('Error in getCostCenters:', error);
      return { success: false, error: 'Failed to fetch cost centers' };
    }
  }

  // Fetch all active profit centers
  static async getProfitCenters(): Promise<{ success: boolean; data?: ProfitCenter[]; error?: string }> {
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase client not initialized' };
      }

      const { data, error } = await supabase
        .from('profit_centers')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching profit centers:', error);
        return { success: false, error: error.message };
      }

      // Transform the data to match our interface
      const profitCenters: ProfitCenter[] = data.map(item => ({
        id: item.id,
        code: item.code,
        name: item.name,
        description: item.description,
        isActive: item.is_active,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      return { success: true, data: profitCenters };
    } catch (error) {
      console.error('Error in getProfitCenters:', error);
      return { success: false, error: 'Failed to fetch profit centers' };
    }
  }

  // Get cost center by code
  static async getCostCenterByCode(code: string): Promise<{ success: boolean; data?: CostCenter; error?: string }> {
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase client not initialized' };
      }

      const { data, error } = await supabase
        .from('cost_centers')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching cost center by code:', error);
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: 'Cost center not found' };
      }

      const costCenter: CostCenter = {
        id: data.id,
        code: data.code,
        name: data.name,
        description: data.description,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      return { success: true, data: costCenter };
    } catch (error) {
      console.error('Error in getCostCenterByCode:', error);
      return { success: false, error: 'Failed to fetch cost center' };
    }
  }

  // Get profit center by code
  static async getProfitCenterByCode(code: string): Promise<{ success: boolean; data?: ProfitCenter; error?: string }> {
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase client not initialized' };
      }

      const { data, error } = await supabase
        .from('profit_centers')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching profit center by code:', error);
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: 'Profit center not found' };
      }

      const profitCenter: ProfitCenter = {
        id: data.id,
        code: data.code,
        name: data.name,
        description: data.description,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      return { success: true, data: profitCenter };
    } catch (error) {
      console.error('Error in getProfitCenterByCode:', error);
      return { success: false, error: 'Failed to fetch profit center' };
    }
  }

  // Mock data for offline/local development
  static getMockCostCenters(): CostCenter[] {
    return [
      {
        id: '1',
        code: 'CC001',
        name: 'Production',
        description: 'Production department cost center',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        code: 'CC002',
        name: 'Maintenance',
        description: 'Maintenance and repair cost center',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        code: 'CC003',
        name: 'Administration',
        description: 'Administrative operations cost center',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '4',
        code: 'CC004',
        name: 'Logistics',
        description: 'Logistics and transportation cost center',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '5',
        code: 'CC005',
        name: 'Quality Control',
        description: 'Quality assurance and control cost center',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  static getMockProfitCenters(): ProfitCenter[] {
    return [
      {
        id: '1',
        code: 'PC001',
        name: 'North Region',
        description: 'Northern region profit center',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        code: 'PC002',
        name: 'South Region',
        description: 'Southern region profit center',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        code: 'PC003',
        name: 'East Region',
        description: 'Eastern region profit center',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '4',
        code: 'PC004',
        name: 'West Region',
        description: 'Western region profit center',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '5',
        code: 'PC005',
        name: 'Central Region',
        description: 'Central region profit center',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }
} 