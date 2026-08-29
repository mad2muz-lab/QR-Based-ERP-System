import { EquipmentMaintenanceLog, EquipmentMaintenanceSchedule, Equipment } from '../types';
import { supabase } from './supabaseClient';
import { DataStorage } from './dataStorage';
import { AuthManager } from './authUtils';
import { SupabaseDataService } from './supabaseDataService';

export class MaintenanceDataLoader {
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static cache: {
    maintenanceLogs?: { data: EquipmentMaintenanceLog[]; timestamp: number };
    maintenanceSchedules?: { data: EquipmentMaintenanceSchedule[]; timestamp: number };
  } = {};

  /**
   * Enhanced diagnostic function to check all data sources and authentication
   */
  static async comprehensiveDiagnostic(): Promise<{
    authentication: any;
    dataSource: any;
    supabaseConnection: any;
    maintenanceLogs: any;
    maintenanceSchedules: any;
    equipment: any;
    recommendations: string[];
  }> {
    const result: any = {
      authentication: { isAuthenticated: false, user: null, useSupabase: false },
      dataSource: { current: 'unknown', available: [] },
      supabaseConnection: { configured: false, reachable: false, error: null },
      maintenanceLogs: { success: false, data: [], error: '', source: 'unknown' },
      maintenanceSchedules: { success: false, data: [], error: '', source: 'unknown' },
      equipment: { success: false, data: [], error: '', source: 'unknown' },
      recommendations: []
    };

    try {
      // 1. Check authentication
      console.log('🔍 [Diagnostic] Checking authentication...');
      const currentUser = AuthManager.getCurrentUserSync();
      const useSupabase = await AuthManager.useSupabase();
      const isAuthenticated = await AuthManager.isAuthenticated();
      
      result.authentication = {
        isAuthenticated,
        user: currentUser,
        useSupabase,
        error: null
      };

      if (!isAuthenticated) {
        result.recommendations.push('User is not authenticated. Please log in first.');
      }

      // 2. Check data source configuration
      console.log('🔍 [Diagnostic] Checking data source...');
      const DataSource = (await import('../services/DataSource')).default;
      const currentSource = DataSource.get();
      result.dataSource = {
        current: currentSource,
        available: ['supabase', 'localstorage'],
        error: null
      };

      // 3. Check Supabase connection
      console.log('🔍 [Diagnostic] Checking Supabase connection...');
      if (supabase) {
        result.supabaseConnection.configured = true;
        try {
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            result.supabaseConnection.error = error.message;
          } else {
            result.supabaseConnection.reachable = true;
          }
        } catch (error: any) {
          result.supabaseConnection.error = error.message;
        }
      } else {
        result.supabaseConnection.error = 'Supabase not configured';
        result.recommendations.push('Supabase is not configured. Check environment variables.');
      }

      // 4. Check maintenance logs
      console.log('🔍 [Diagnostic] Checking maintenance logs...');
      const maintenanceLogsResult = await this.loadMaintenanceLogs();
      result.maintenanceLogs = {
        success: maintenanceLogsResult.success,
        data: maintenanceLogsResult.data || [],
        error: maintenanceLogsResult.error || '',
        source: maintenanceLogsResult.source || 'unknown',
        count: maintenanceLogsResult.data?.length || 0
      };

      if (!maintenanceLogsResult.success) {
        result.recommendations.push(`Maintenance logs failed to load: ${maintenanceLogsResult.error}`);
      }

      // 5. Check maintenance schedules
      console.log('🔍 [Diagnostic] Checking maintenance schedules...');
      const maintenanceSchedulesResult = await this.loadMaintenanceSchedules();
      result.maintenanceSchedules = {
        success: maintenanceSchedulesResult.success,
        data: maintenanceSchedulesResult.data || [],
        error: maintenanceSchedulesResult.error || '',
        source: maintenanceSchedulesResult.source || 'unknown',
        count: maintenanceSchedulesResult.data?.length || 0
      };

      if (!maintenanceSchedulesResult.success) {
        result.recommendations.push(`Maintenance schedules failed to load: ${maintenanceSchedulesResult.error}`);
      }

      // 6. Check equipment data
      console.log('🔍 [Diagnostic] Checking equipment data...');
      try {
        if (useSupabase && supabase) {
          const { data, error } = await supabase.from('equipment').select('*');
          if (error) {
            result.equipment = {
              success: false,
              data: [] as Equipment[],
              error: error.message,
              source: 'supabase'
            };
          } else {
            result.equipment = {
              success: true,
              data: (data || []) as Equipment[],
              error: '',
              source: 'supabase',
              count: data?.length || 0
            };
          }
        } else {
          const equipmentData = DataStorage.loadEquipment();
          result.equipment = {
            success: true,
            data: equipmentData,
            error: '',
            source: 'localstorage',
            count: equipmentData.length
          };
        }
      } catch (error: any) {
        result.equipment = {
          success: false,
          data: [] as Equipment[],
          error: error.message,
          source: 'unknown'
        };
      }

      if (!result.equipment.success) {
        result.recommendations.push(`Equipment data failed to load: ${result.equipment.error}`);
      }

      // 7. Generate recommendations
      if (result.maintenanceLogs.count === 0 && result.equipment.success && result.equipment.count > 0) {
        result.recommendations.push('No maintenance logs found but equipment exists. Consider creating sample maintenance data.');
      }

      if (result.dataSource.current === 'supabase' && !result.supabaseConnection.reachable) {
        result.recommendations.push('Supabase is selected but not reachable. Consider switching to local storage.');
      }

      console.log('✅ [Diagnostic] Comprehensive diagnostic completed');
      return result;

    } catch (error: any) {
      console.error('❌ [Diagnostic] Error during diagnostic:', error);
      result.recommendations.push(`Diagnostic error: ${error.message}`);
      return result;
    }
  }

  /**
   * Force refresh all maintenance data
   */
  static async forceRefresh(): Promise<{
    maintenanceLogs: any;
    maintenanceSchedules: any;
    equipment: any;
  }> {
    console.log('🔄 [Force Refresh] Starting force refresh...');
    
    // Clear cache
    this.cache = {};
    
    // Force reload all data
    const maintenanceLogs = await this.loadMaintenanceLogs(true);
    const maintenanceSchedules = await this.loadMaintenanceSchedules(true);
    
    // Get equipment data
    let equipment: { success: boolean; data: Equipment[]; error: string } = { success: false, data: [], error: '' };
    try {
      const useSupabase = await AuthManager.useSupabase();
      if (useSupabase && supabase) {
        const { data, error } = await supabase.from('equipment').select('*');
        if (error) {
          equipment = { success: false, data: [], error: error.message };
        } else {
          equipment = { success: true, data: (data || []) as Equipment[], error: '' };
        }
      } else {
        const equipmentData = DataStorage.loadEquipment();
        equipment = { success: true, data: equipmentData, error: '' };
      }
    } catch (error: any) {
      equipment = { success: false, data: [], error: error.message };
    }

    console.log('✅ [Force Refresh] Force refresh completed');
    return {
      maintenanceLogs,
      maintenanceSchedules,
      equipment
    };
  }

  /**
   * Load maintenance logs with enhanced error handling and logging
   */
  static async loadMaintenanceLogs(forceRefresh = false): Promise<{
    success: boolean;
    data?: EquipmentMaintenanceLog[];
    error?: string;
    source?: string;
  }> {
    console.log('📊 [MaintenanceDataLoader] Loading maintenance logs...');
    
    try {
      const useSupabase = await AuthManager.useSupabase();
      console.log('🔍 [MaintenanceDataLoader] Use Supabase:', useSupabase);

      // Check cache first (unless force refresh)
      if (!forceRefresh && this.cache.maintenanceLogs) {
        const now = Date.now();
        if (now - this.cache.maintenanceLogs.timestamp < this.CACHE_DURATION) {
          console.log('📊 [MaintenanceDataLoader] Using cached maintenance logs');
          return {
            success: true,
            data: this.cache.maintenanceLogs.data,
            source: 'cache'
          };
        }
      }

      if (useSupabase && supabase) {
        console.log('🔍 [MaintenanceDataLoader] Attempting Supabase load...');
        try {
          const { data, error } = await supabase
            .from('preventive_maintenance_logs')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            console.error('❌ [MaintenanceDataLoader] Supabase error:', error);
            throw error;
          }

          console.log('✅ [MaintenanceDataLoader] Supabase load successful:', data?.length || 0, 'records');
          
          // Cache the result
          this.cache.maintenanceLogs = {
            data: data || [],
            timestamp: Date.now()
          };

          return {
            success: true,
            data: data || [],
            source: 'supabase'
          };
        } catch (error: any) {
          console.error('❌ [MaintenanceDataLoader] Supabase load failed:', error);
          // Fall back to local storage
          console.log('🔄 [MaintenanceDataLoader] Falling back to local storage...');
        }
      }

      // Local storage fallback
      console.log('🔍 [MaintenanceDataLoader] Loading from local storage...');
      try {
        const data = DataStorage.loadMaintenanceLogs();
        console.log('✅ [MaintenanceDataLoader] Local storage load successful:', data.length, 'records');
        
        // Cache the result
        this.cache.maintenanceLogs = {
          data,
          timestamp: Date.now()
        };

        return {
          success: true,
          data,
          source: 'localstorage'
        };
      } catch (error: any) {
        console.error('❌ [MaintenanceDataLoader] Local storage load failed:', error);
        return {
          success: false,
          error: error.message,
          source: 'localstorage'
        };
      }

    } catch (error: any) {
      console.error('❌ [MaintenanceDataLoader] Unexpected error:', error);
      return {
        success: false,
        error: error.message,
        source: 'unknown'
      };
    }
  }

  /**
   * Load maintenance schedules with enhanced error handling and logging
   */
  static async loadMaintenanceSchedules(forceRefresh = false): Promise<{
    success: boolean;
    data?: EquipmentMaintenanceSchedule[];
    error?: string;
    source?: string;
  }> {
    console.log('📅 [MaintenanceDataLoader] Loading maintenance schedules...');
    
    try {
      const useSupabase = await AuthManager.useSupabase();
      console.log('🔍 [MaintenanceDataLoader] Use Supabase for schedules:', useSupabase);

      // Check cache first (unless force refresh)
      if (!forceRefresh && this.cache.maintenanceSchedules) {
        const now = Date.now();
        if (now - this.cache.maintenanceSchedules.timestamp < this.CACHE_DURATION) {
          console.log('📅 [MaintenanceDataLoader] Using cached maintenance schedules');
          return {
            success: true,
            data: this.cache.maintenanceSchedules.data,
            source: 'cache'
          };
        }
      }

      if (useSupabase && supabase) {
        console.log('🔍 [MaintenanceDataLoader] Attempting Supabase schedule load...');
        try {
          const { data, error } = await supabase
            .from('preventive_maintenance_configs')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('❌ [MaintenanceDataLoader] Supabase schedule error:', error);
            throw error;
          }

          console.log('✅ [MaintenanceDataLoader] Supabase schedule load successful:', data?.length || 0, 'records');
          
          // Cache the result
          this.cache.maintenanceSchedules = {
            data: data || [],
            timestamp: Date.now()
          };

          return {
            success: true,
            data: data || [],
            source: 'supabase'
          };
        } catch (error: any) {
          console.error('❌ [MaintenanceDataLoader] Supabase schedule load failed:', error);
          // Fall back to local storage
          console.log('🔄 [MaintenanceDataLoader] Falling back to local storage for schedules...');
        }
      }

      // Local storage fallback
      console.log('🔍 [MaintenanceDataLoader] Loading schedules from local storage...');
      try {
        const data = DataStorage.loadMaintenanceSchedules();
        console.log('✅ [MaintenanceDataLoader] Local storage schedule load successful:', data.length, 'records');
        
        // Cache the result
        this.cache.maintenanceSchedules = {
          data,
          timestamp: Date.now()
        };

        return {
          success: true,
          data,
          source: 'localstorage'
        };
      } catch (error: any) {
        console.error('❌ [MaintenanceDataLoader] Local storage schedule load failed:', error);
        return {
          success: false,
          error: error.message,
          source: 'localstorage'
        };
      }

    } catch (error: any) {
      console.error('❌ [MaintenanceDataLoader] Unexpected schedule error:', error);
      return {
        success: false,
        error: error.message,
        source: 'unknown'
      };
    }
  }

  /**
   * Test database connection with detailed checks
   */
  static async testDatabaseConnection(): Promise<{
    success: boolean;
    message: string;
    details: any;
  }> {
    console.log('🔍 [MaintenanceDataLoader] Testing database connection...');
    
    const result: any = {
      success: false,
      message: '',
      details: {
        supabaseConfigured: false,
        supabaseReachable: false,
        authentication: false,
        tableAccess: {
          preventive_maintenance_logs: false,
          preventive_maintenance_configs: false,
          equipment: false
        },
        errors: []
      }
    };

    try {
      // Check if Supabase is configured
      if (!supabase) {
        result.message = 'Supabase not configured';
        result.details.errors.push('Supabase client not initialized');
        return result;
      }
      result.details.supabaseConfigured = true;

      // Test basic connection
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          result.details.errors.push(`Authentication error: ${error.message}`);
        } else {
          result.details.supabaseReachable = true;
          result.details.authentication = !!data.session;
        }
      } catch (error: any) {
        result.details.errors.push(`Connection error: ${error.message}`);
        return result;
      }

      // Test table access
      const tables = ['preventive_maintenance_logs', 'preventive_maintenance_configs', 'equipment'];
      for (const table of tables) {
        try {
          const { data, error } = await supabase.from(table).select('count', { count: 'exact', head: true });
          if (error) {
            result.details.errors.push(`${table} access error: ${error.message}`);
          } else {
            result.details.tableAccess[table] = true;
          }
        } catch (error: any) {
          result.details.errors.push(`${table} error: ${error.message}`);
        }
      }

      // Determine overall success
      const hasTableAccess = Object.values(result.details.tableAccess).some(Boolean);
      result.success = result.details.supabaseReachable && hasTableAccess;
      
      if (result.success) {
        result.message = 'Database connection successful';
      } else {
        result.message = 'Database connection failed';
      }

      console.log('✅ [MaintenanceDataLoader] Database connection test completed');
      return result;

    } catch (error: any) {
      console.error('❌ [MaintenanceDataLoader] Database connection test error:', error);
      result.message = 'Database connection test failed';
      result.details.errors.push(error.message);
      return result;
    }
  }

  /**
   * Debug function to check all data sources
   */
  static async debugDataSources(): Promise<{
    maintenanceLogs: any;
    maintenanceSchedules: any;
    equipment: any;
    authStatus: any;
  }> {
    const result: any = {
      maintenanceLogs: await this.loadMaintenanceLogs(),
      maintenanceSchedules: await this.loadMaintenanceSchedules(),
      equipment: { success: false, data: [], error: '' },
      authStatus: { isAuthenticated: false, user: null, useSupabase: false }
    };

    try {
      // Check equipment data
      const equipmentData = DataStorage.loadEquipment();
      result.equipment = {
        success: true,
        data: equipmentData,
        error: ''
      };
    } catch (error: any) {
      result.equipment = {
        success: false,
        data: [],
        error: error.message
      };
    }

    try {
      // Check auth status
      const currentUser = AuthManager.getCurrentUserSync();
      const useSupabase = await AuthManager.useSupabase();
      result.authStatus = {
        isAuthenticated: !!currentUser,
        user: currentUser,
        useSupabase
      };
    } catch (error: any) {
      result.authStatus = {
        isAuthenticated: false,
        user: null,
        useSupabase: false,
        error: error.message
      };
    }

    return result;
  }
} 