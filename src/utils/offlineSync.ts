// Offline Synchronization System
// Handles network connectivity, data queuing, and sync operations

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: 'employee' | 'equipment' | 'material' | 'site' | 'timeLog';
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

  private constructor() {
    this.initializeNetworkListeners();
    this.loadPendingOperations();
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
      // Sort by priority and timestamp
      const sortedQueue = this.syncQueue.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
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
    }
  }

  private async syncOperation(operation: SyncOperation): Promise<void> {
    // Simulate API call - replace with actual server communication
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate network conditions
        const shouldFail = Math.random() < 0.1; // 10% failure rate for testing
        
        if (shouldFail) {
          reject(new Error('Network timeout'));
        } else {
          console.log(`Synced operation: ${operation.type} ${operation.entityType} ${operation.entityId}`);
          resolve();
        }
      }, 500 + Math.random() * 1000); // Simulate network latency
    });
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
      'Rate limit exceeded'
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