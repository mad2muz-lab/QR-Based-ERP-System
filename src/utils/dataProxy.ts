import DataSource, { DataSourceType } from '../services/DataSource';
import { SupabaseDataService } from './supabaseDataService';
import { DataStorage } from './dataStorage';

export type TableName = 'employees' | 'equipment' | 'materials' | 'sites' | 'time_logs';

/**
 * Centralized data fetching proxy
 * Routes to appropriate service based on current data source
 */
export async function fetchData(tableName: TableName): Promise<any[]> {
  const currentSource = DataSource.get();
  
  if (currentSource === 'supabase') {
    switch (tableName) {
      case 'employees':
        return await SupabaseDataService.getEmployees();
      case 'equipment':
        return await SupabaseDataService.getEquipment();
      case 'materials':
        return await SupabaseDataService.getMaterials();
      case 'sites':
        return await SupabaseDataService.getSites();
      case 'time_logs':
        return await SupabaseDataService.getTimeLogs();
      default:
        return [];
    }
  } else {
    // localStorage
    switch (tableName) {
      case 'employees':
        return DataStorage.loadEmployees();
      case 'equipment':
        return DataStorage.loadEquipment();
      case 'materials':
        return DataStorage.loadMaterials();
      case 'sites':
        return DataStorage.loadSites();
      case 'time_logs':
        return DataStorage.loadTimeLogs();
      default:
        return [];
    }
  }
}

/**
 * Centralized data saving proxy
 * Routes to appropriate service based on current data source
 */
export async function saveData(tableName: TableName, data: any[]): Promise<boolean> {
  const currentSource = DataSource.get();
  
  if (currentSource === 'supabase') {
    // For Supabase, we typically don't bulk save, but individual operations
    // This is a simplified implementation
    console.log(`Saving ${tableName} to Supabase:`, data);
    return true;
  } else {
    // localStorage
    switch (tableName) {
      case 'employees':
        DataStorage.saveEmployees(data);
        return true;
      case 'equipment':
        DataStorage.saveEquipment(data);
        return true;
      case 'materials':
        DataStorage.saveMaterials(data);
        return true;
      case 'sites':
        DataStorage.saveSites(data);
        return true;
      case 'time_logs':
        DataStorage.saveTimeLogs(data);
        return true;
      default:
        return false;
    }
  }
}

/**
 * Get all logs from current data source
 */
export async function getAllLogs(): Promise<any> {
  const currentSource = DataSource.get();
  
  if (currentSource === 'supabase') {
    return await SupabaseDataService.getAllLogs();
  } else {
    return DataStorage.loadAllLogs();
  }
}

/**
 * Get current data source
 */
export function getCurrentDataSource(): DataSourceType {
  return DataSource.get();
}

/**
 * Switch data source
 */
export function switchDataSource(source: DataSourceType): void {
  DataSource.set(source);
}