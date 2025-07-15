// Offline Synchronization System
// Handles network connectivity, data queuing, and sync operations

import { supabase } from './supabaseClient';

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: 'employee' | 'equipment' | 'material' | 'site' | 'timeLog' | 'employeeLog' | 'equipmentLog' | 'materialLog';
  entityId: string;
  data: any;
  timestamp: string;
  retryCount: number;
  priority: 'high' | 'medium' | 'low';
  userId?: string;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingOperations: number;
  lastSyncTime: string | null;
  syncProgress: number;
  errors: SyncError[];
}

export interface SyncError {
  id: string;
  operation: SyncOperation;
  error: string;
  timestamp: string;
  retryable: boolean;
}

export interface ConflictResolution {
  strategy: 'server-wins' | 'client-wins' | 'merge' | 'manual';
  resolver?: (local: any, server: any) => any;
}

export class OfflineSyncManager {
  private static instance: OfflineSyncManager;
  private syncQueue: SyncOperation[] = [];
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private syncListeners: ((status: SyncStatus) => void)[] = [];
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private maxRetries: number = 3;
  private syncInterval: NodeJS.Timeout | null = null;
  private batteryOptimization: boolean = true;
  private idMappings: Map<string, string> = new Map(); // customId -> databaseUuid

  private constructor() {
    this.initializeNetworkListeners();
    this.loadPendingOperations();
    this.loadIdMappings();
    this.startPeriodicSync();
  }

  static getInstance(): OfflineSyncManager {
    if (!OfflineSyncManager.instance) {
      OfflineSyncManager.instance = new OfflineSyncManager();
    }
    return OfflineSyncManager.instance;
  }

  // Network Status Management
  private initializeNetworkListeners(): void {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Enhanced connectivity detection
    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', this.handleConnectionChange.bind(this));
    }
  }

  private handleOnline(): void {
    console.log('Network connection restored');
    this.isOnline = true;
    this.notifyStatusChange();
    this.processSyncQueue();
  }

  private handleOffline(): void {
    console.log('Network connection lost');
    this.isOnline = false;
    this.isSyncing = false;
    this.notifyStatusChange();
  }

  private handleConnectionChange(): void {
    const connection = (navigator as any).connection;
    const isEffectivelyOnline = this.isOnline && connection.effectiveType !== 'slow-2g';
    
    if (isEffectivelyOnline !== this.isOnline) {
      this.isOnline = isEffectivelyOnline;
      this.notifyStatusChange();
      
      if (this.isOnline) {
        this.processSyncQueue();
      }
    }
  }

  // Queue Management
  queueOperation(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount'>): string {
    const syncOperation: SyncOperation = {
      ...operation,
      id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };

    this.syncQueue.push(syncOperation);
    this.savePendingOperations();
    this.notifyStatusChange();

    // Try immediate sync if online
    if (this.isOnline && !this.isSyncing) {
      this.processSyncQueue();
    }

    return syncOperation.id;
  }

  private loadPendingOperations(): void {
    try {
      const stored = localStorage.getItem('qr_system_sync_queue');
      if (stored) {
        this.syncQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load pending operations:', error);
      this.syncQueue = [];
    }
  }

  private savePendingOperations(): void {
    try {
      localStorage.setItem('qr_system_sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to save pending operations:', error);
      this.handleStorageError(error);
    }
  }

  // Synchronization Process
  async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.isSyncing || this.syncQueue.length === 0) {
      return;
    }
  
    this.isSyncing = true;
    this.notifyStatusChange();
  
    try {
      // Sort by entity type priority (entities before logs), then by priority and timestamp
      const sortedQueue = this.syncQueue.sort((a, b) => {
        // Entity type priority: entities first, then logs
        const entityTypeOrder = {
          'employee': 4, 'equipment': 4, 'material': 4, 'site': 4,
          'employeeLog': 1, 'equipmentLog': 1, 'materialLog': 1, 'timeLog': 1
        };
        const entityTypeDiff = (entityTypeOrder[b.entityType] || 2) - (entityTypeOrder[a.entityType] || 2);
        if (entityTypeDiff !== 0) return entityTypeDiff;
        
        // Then by operation priority
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        // Finally by timestamp
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });
  
      const batchSize = this.getBatchSize();
      const batch = sortedQueue.slice(0, batchSize);
  
      for (let i = 0; i < batch.length; i++) {
        const operation = batch[i];
        
        try {
          await this.syncOperation(operation);
          this.removeFromQueue(operation.id);
          
          // Update progress
          const progress = ((i + 1) / batch.length) * 100;
          this.notifyStatusChange(progress);
          
          // Battery optimization: add delay between operations
          if (this.batteryOptimization && i < batch.length - 1) {
            await this.delay(100);
          }
          
        } catch (error) {
          await this.handleSyncError(operation, error);
        }
      }
  
      // Update last sync time
      localStorage.setItem('qr_system_last_sync', new Date().toISOString());
      
    } catch (error) {
      console.error('Sync process failed:', error);
    } finally {
      this.isSyncing = false;
      this.notifyStatusChange();
      // Chain next batch if queue still has items
      if (this.syncQueue.length > 0 && this.isOnline) {
        setTimeout(() => this.processSyncQueue(), 1000);
      }
    }
  }

  // ID Mapping Management
  private loadIdMappings(): void {
    try {
      const mappings = localStorage.getItem('qr_system_id_mappings');
      if (mappings) {
        const parsed = JSON.parse(mappings);
        this.idMappings = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error('Failed to load ID mappings:', error);
      this.idMappings = new Map();
    }
  }

  private saveIdMappings(): void {
    try {
      const mappingsObj = Object.fromEntries(this.idMappings);
      localStorage.setItem('qr_system_id_mappings', JSON.stringify(mappingsObj));
    } catch (error) {
      console.error('Failed to save ID mappings:', error);
    }
  }

  private addIdMapping(customId: string, databaseUuid: string): void {
    this.idMappings.set(customId, databaseUuid);
    this.saveIdMappings();
  }

  private getUuidForCustomId(customId: string): string | null {
    return this.idMappings.get(customId) || null;
  }

  private async syncOperation(operation: SyncOperation): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
  
    const { type, entityType, entityId, data } = operation;
    
    // For main entity types, use SupabaseRegistrationService to ensure proper transformations
    if (['employee', 'equipment', 'material', 'site'].includes(entityType)) {
      return this.syncEntityOperation(operation);
    }
    
    // For log types, continue with direct Supabase operations
    // Map entity types to correct table names
    const getTableName = (entityType: string): string => {
      switch (entityType) {
        case 'timeLog': return 'time_logs';
        case 'employeeLog': return 'employee_logs';
        case 'equipmentLog': return 'equipment_logs';
        case 'materialLog': return 'material_logs';
        default: return entityType + 's';
      }
    };
    
    const tableName = getTableName(entityType);
    
    // Transform data to match database schema
    const transformDataForDB = (data: any, entityType: string, operationType: string) => {
      if (!data) return data;
      
      const transformed = { ...data };
      
      // Handle ID resolution for different operation types
      if (operationType === 'create') {
        // For create operations with TEXT IDs, keep the custom ID as-is
        // The database now uses TEXT IDs directly, not UUIDs
        // No need to delete the ID for TEXT-based tables
      } else if (operationType === 'update' && transformed.id) {
        // For update operations with TEXT IDs, use the custom ID directly
        // No UUID resolution needed since database uses TEXT IDs
        // Keep the original custom ID for TEXT-based tables
      }
      
      // Remove form-specific fields that don't exist in database
      if (transformed.selectedLocation !== undefined) {
        delete transformed.selectedLocation;
      }
      if (transformed.customType !== undefined) {
        delete transformed.customType;
      }
      if (transformed.accessLevel !== undefined) {
        delete transformed.accessLevel;
      }
      
      // Convert camelCase to snake_case for database fields
      if (transformed.bloodGroup !== undefined) {
        transformed.blood_group = transformed.bloodGroup;
        delete transformed.bloodGroup;
      }
      if (transformed.createdAt !== undefined) {
        transformed.created_at = transformed.createdAt;
        delete transformed.createdAt;
      }
      if (transformed.lastUpdated !== undefined) {
        transformed.last_updated = transformed.lastUpdated;
        delete transformed.lastUpdated;
      }
      if (transformed.qrCode !== undefined) {
        transformed.qr_code = transformed.qrCode;
        delete transformed.qrCode;
      }
      if (transformed.serialNumber !== undefined) {
        transformed.serial_number = transformed.serialNumber;
        delete transformed.serialNumber;
      }
      if (transformed.entityId !== undefined) {
        // Resolve custom entity ID to database UUID for foreign key reference
        const entityUuid = this.getUuidForCustomId(transformed.entityId);
        if (entityUuid) {
          transformed.entity_id = entityUuid;
        } else {
          // If no mapping found, use the original value (might be already a UUID)
          transformed.entity_id = transformed.entityId;
        }
        delete transformed.entityId;
      }
      if (transformed.entityType !== undefined) {
        transformed.entity_type = transformed.entityType;
        delete transformed.entityType;
      }
      
      // Handle coordinates conversion for sites (array to POINT format)
      if (entityType === 'site' && transformed.coordinates && Array.isArray(transformed.coordinates)) {
        // Convert [longitude, latitude] array to PostgreSQL POINT format
        transformed.coordinates = `(${transformed.coordinates[0]},${transformed.coordinates[1]})`;
      }
      
      // Handle specific field transformations for log entity types
      if (entityType === 'employeeLog' || entityType === 'equipmentLog' || entityType === 'materialLog') {
        // Convert camelCase to snake_case for log-specific fields
        if (transformed.employeeId !== undefined) {
          const employeeUuid = this.getUuidForCustomId(transformed.employeeId);
          // Use UUID if available, otherwise use the original employeeId
          // This allows logs to sync even if the employee hasn't been synced yet
          transformed.employee_id = employeeUuid || transformed.employeeId;
          delete transformed.employeeId;
        }
        if (transformed.employeeName !== undefined) {
          transformed.employee_name = transformed.employeeName;
          delete transformed.employeeName;
        }
        if (transformed.equipmentId !== undefined) {
          const equipmentUuid = this.getUuidForCustomId(transformed.equipmentId);
          // Use UUID if available, otherwise use the original equipmentId
          // This allows logs to sync even if the equipment hasn't been synced yet
          transformed.equipment_id = equipmentUuid || transformed.equipmentId;
          delete transformed.equipmentId;
        }
        if (transformed.equipmentName !== undefined) {
          transformed.equipment_name = transformed.equipmentName;
          delete transformed.equipmentName;
        }
        if (transformed.equipmentType !== undefined) {
          transformed.equipment_type = transformed.equipmentType;
          delete transformed.equipmentType;
        }
        if (transformed.materialId !== undefined) {
          const materialUuid = this.getUuidForCustomId(transformed.materialId);
          // Use UUID if available, otherwise use the original materialId
          // This allows logs to sync even if the material hasn't been synced yet
          transformed.material_id = materialUuid || transformed.materialId;
          delete transformed.materialId;
        }
        if (transformed.materialName !== undefined) {
          transformed.material_name = transformed.materialName;
          delete transformed.materialName;
        }
        if (transformed.materialType !== undefined) {
          transformed.material_type = transformed.materialType;
          delete transformed.materialType;
        }
        
        // Handle location conversion for logs
        if (transformed.location && Array.isArray(transformed.location)) {
          transformed.location = `(${transformed.location[0]},${transformed.location[1]})`;
        }
      }
      
      return transformed;
    };
    
    const dbData = transformDataForDB(data, entityType, type);
    
    try {
      switch (type) {
        case 'create':
          const { error: createError } = await supabase
            .from(tableName)
            .insert(dbData);
          if (createError) throw createError;
          break;
          
        case 'update':
          // Use the custom ID directly for TEXT-based tables
          const { error: updateError } = await supabase
            .from(tableName)
            .update(dbData)
            .eq('id', entityId);
          if (updateError) throw updateError;
          break;
          
        case 'delete':
          // Use the custom ID directly for TEXT-based tables
          const { error: deleteError } = await supabase
            .from(tableName)
            .delete()
            .eq('id', entityId);
          if (deleteError) throw deleteError;
          break;
      }
      
      console.log(`Successfully synced operation: ${operation.type} ${operation.entityType} ${operation.entityId}`);
    } catch (error: any) {
      console.error(`Failed to sync operation: ${operation.type} ${operation.entityType} ${operation.entityId}`);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        tableName,
        data: dbData
      });
      throw error;
    };
  }

  private async syncEntityOperation(operation: SyncOperation): Promise<void> {
    const { type, entityType, entityId, data } = operation;
    
    try {
      // Import SupabaseRegistrationService dynamically to avoid circular dependencies
      const { SupabaseRegistrationService } = await import('./supabaseRegistrationService');
      
      let result: { success: boolean; data?: any; error?: string };
      
      switch (entityType) {
        case 'employee':
          switch (type) {
            case 'create':
              result = await SupabaseRegistrationService.createEmployee(data);
              break;
            case 'update':
              result = await SupabaseRegistrationService.updateEmployee(data);
              break;
            case 'delete':
              result = await SupabaseRegistrationService.deleteEmployee(entityId);
              break;
            default:
              throw new Error(`Unsupported operation type: ${type}`);
          }
          break;
          
        case 'equipment':
          switch (type) {
            case 'create':
              result = await SupabaseRegistrationService.createEquipment(data);
              break;
            case 'update':
              result = await SupabaseRegistrationService.updateEquipment(data);
              break;
            case 'delete':
              result = await SupabaseRegistrationService.deleteEquipment(entityId);
              break;
            default:
              throw new Error(`Unsupported operation type: ${type}`);
          }
          break;
          
        case 'material':
          switch (type) {
            case 'create':
              result = await SupabaseRegistrationService.createMaterial(data);
              break;
            case 'update':
              result = await SupabaseRegistrationService.updateMaterial(data);
              break;
            case 'delete':
              result = await SupabaseRegistrationService.deleteMaterial(entityId);
              break;
            default:
              throw new Error(`Unsupported operation type: ${type}`);
          }
          break;
          
        case 'site':
          switch (type) {
            case 'create':
              result = await SupabaseRegistrationService.createSite(data);
              break;
            case 'update':
              result = await SupabaseRegistrationService.updateSite(data);
              break;
            case 'delete':
              result = await SupabaseRegistrationService.deleteSite(entityId);
              break;
            default:
              throw new Error(`Unsupported operation type: ${type}`);
          }
          break;
          
        case 'materialLog':
          switch (type) {
            case 'create':
              result = await SupabaseRegistrationService.createMaterialLog(data);
              break;
            default:
              throw new Error(`Unsupported operation type: ${type} for materialLog`);
          }
          break;
          
        case 'employeeLog':
          switch (type) {
            case 'create':
              result = await SupabaseRegistrationService.createEmployeeLog(data);
              break;
            default:
              throw new Error(`Unsupported operation type: ${type} for employeeLog`);
          }
          break;
          
        case 'equipmentLog':
          switch (type) {
            case 'create':
              result = await SupabaseRegistrationService.createEquipmentLog(data);
              break;
            default:
              throw new Error(`Unsupported operation type: ${type} for equipmentLog`);
          }
          break;
          
        default:
          throw new Error(`Unsupported entity type: ${entityType}`);
      }
      
      if (!result.success) {
        throw new Error(result.error || `Failed to sync ${entityType} ${type} operation`);
      }
      
      console.log(`Successfully synced ${type} ${entityType} ${entityId} using SupabaseRegistrationService`);
      
    } catch (error: any) {
      console.error(`Failed to sync ${type} ${entityType} ${entityId} using SupabaseRegistrationService:`, error);
      throw error;
    }
  }

    // Conflict Resolution
  async resolveConflict(
    localData: any, 
    serverData: any, 
    resolution: ConflictResolution
  ): Promise<any> {
    switch (resolution.strategy) {
      case 'server-wins':
        return serverData;
        
      case 'client-wins':
        return localData;
        
      case 'merge':
        return this.mergeData(localData, serverData);
        
      case 'manual':
        if (resolution.resolver) {
          return resolution.resolver(localData, serverData);
        }
        throw new Error('Manual resolution requires a resolver function');
        
      default:
        throw new Error(`Unknown conflict resolution strategy: ${resolution.strategy}`);
    }
  }

  private mergeData(local: any, server: any): any {
    // Intelligent merge based on timestamps and field-level comparison
    const merged = { ...server };
    
    Object.keys(local).forEach(key => {
      if (key === 'lastUpdated' || key === 'timestamp') {
        // Use the most recent timestamp
        if (new Date(local[key]) > new Date(server[key])) {
          merged[key] = local[key];
        }
      } else if (local[key] !== server[key]) {
        // For conflicts, prefer local changes if they're more recent
        const localTime = new Date(local.lastUpdated || local.timestamp || 0);
        const serverTime = new Date(server.lastUpdated || server.timestamp || 0);
        
        if (localTime > serverTime) {
          merged[key] = local[key];
        }
      }
    });
    
    return merged;
  }

  // Error Handling
  private async handleSyncError(operation: SyncOperation, error: any): Promise<void> {
    const isDependencyError = error.message?.includes('UUID mapping not found');
    
    if (isDependencyError) {
      // For dependency errors, move the operation to the end of the queue without incrementing retry count
      this.removeFromQueue(operation.id);
      operation.retryCount = 0; // Reset retry count for dependency errors
      this.syncQueue.push(operation);
      this.savePendingOperations();
      console.log(`Deferred operation due to missing dependency: ${operation.entityType} ${operation.entityId}`);
      return;
    }
    
    operation.retryCount++;
    
    const syncError: SyncError = {
      id: `error-${Date.now()}`,
      operation,
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
      retryable: this.isRetryableError(error)
    };

    // Store error for user feedback
    this.addSyncError(syncError);

    if (operation.retryCount < this.maxRetries && syncError.retryable) {
      // Exponential backoff
      const delay = Math.pow(2, operation.retryCount) * 1000;
      
      const timeoutId = setTimeout(() => {
        this.retryTimeouts.delete(operation.id);
        this.processSyncQueue();
      }, delay);
      
      this.retryTimeouts.set(operation.id, timeoutId);
    } else {
      // Max retries reached or non-retryable error
      this.moveToFailedQueue(operation, syncError);
    }
  }

  private isRetryableError(error: any): boolean {
    const retryableErrors = [
      'Network timeout',
      'Connection failed',
      'Server temporarily unavailable',
      'Rate limit exceeded',
      'UUID mapping not found' // Dependency errors are retryable
    ];
    
    return retryableErrors.some(retryable => 
      error.message?.includes(retryable)
    );
  }

  private moveToFailedQueue(operation: SyncOperation, error: SyncError): void {
    this.removeFromQueue(operation.id);
    
    // Store failed operations for manual review
    const failedOps = this.getFailedOperations();
    failedOps.push({ operation, error });
    localStorage.setItem('qr_system_failed_sync', JSON.stringify(failedOps));
  }

  // Utility Methods
  private removeFromQueue(operationId: string): void {
    this.syncQueue = this.syncQueue.filter(op => op.id !== operationId);
    this.savePendingOperations();
  }

  private getBatchSize(): number {
    // Adjust batch size based on connection quality
    if (!this.isOnline) return 0;
    
    const connection = (navigator as any).connection;
    if (connection) {
      switch (connection.effectiveType) {
        case 'slow-2g': return 1;
        case '2g': return 3;
        case '3g': return 5;
        case '4g': return 10;
        default: return 5;
      }
    }
    
    return 5; // Default batch size
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Status Management
  private notifyStatusChange(progress?: number): void {
    const status: SyncStatus = {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingOperations: this.syncQueue.length,
      lastSyncTime: localStorage.getItem('qr_system_last_sync'),
      syncProgress: progress || 0,
      errors: this.getSyncErrors()
    };

    this.syncListeners.forEach(listener => listener(status));
  }

  addSyncListener(listener: (status: SyncStatus) => void): void {
    this.syncListeners.push(listener);
  }

  removeSyncListener(listener: (status: SyncStatus) => void): void {
    this.syncListeners = this.syncListeners.filter(l => l !== listener);
  }

  // Error Management
  private addSyncError(error: SyncError): void {
    const errors = this.getSyncErrors();
    errors.push(error);
    
    // Keep only last 50 errors
    if (errors.length > 50) {
      errors.splice(0, errors.length - 50);
    }
    
    localStorage.setItem('qr_system_sync_errors', JSON.stringify(errors));
  }

  private getSyncErrors(): SyncError[] {
    try {
      const stored = localStorage.getItem('qr_system_sync_errors');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private getFailedOperations(): any[] {
    try {
      const stored = localStorage.getItem('qr_system_failed_sync');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Storage Management
  private handleStorageError(error: any): void {
    console.error('Storage error:', error);
    
    if (error.name === 'QuotaExceededError') {
      this.cleanupOldData();
    }
  }

  private cleanupOldData(): void {
    // Remove old sync errors
    const errors = this.getSyncErrors();
    const recentErrors = errors.slice(-20); // Keep only last 20 errors
    localStorage.setItem('qr_system_sync_errors', JSON.stringify(recentErrors));
    
    // Remove old failed operations
    const failedOps = this.getFailedOperations();
    const recentFailed = failedOps.slice(-10); // Keep only last 10 failed operations
    localStorage.setItem('qr_system_failed_sync', JSON.stringify(recentFailed));
  }

  // Periodic Sync
  private startPeriodicSync(): void {
    // Sync every 5 minutes when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0) {
        this.processSyncQueue();
      }
    }, 5 * 60 * 1000);
  }

  // Public API
  getStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingOperations: this.syncQueue.length,
      lastSyncTime: localStorage.getItem('qr_system_last_sync'),
      syncProgress: 0,
      errors: this.getSyncErrors()
    };
  }

  async forcSync(): Promise<void> {
    if (this.isOnline) {
      await this.processSyncQueue();
    }
  }

  clearSyncQueue(): void {
    this.syncQueue = [];
    this.savePendingOperations();
    this.notifyStatusChange();
  }

  clearIdMappings(): void {
    this.idMappings.clear();
    localStorage.removeItem('qr_system_id_mappings');
    console.log('Cleared ID mappings cache - now using TEXT IDs directly');
  }

  clearErrors(): void {
    localStorage.removeItem('qr_system_sync_errors');
    this.notifyStatusChange();
  }

  setBatteryOptimization(enabled: boolean): void {
    this.batteryOptimization = enabled;
  }

  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts.clear();
    
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
  }
}

// Export singleton instance
export const offlineSyncManager = OfflineSyncManager.getInstance();