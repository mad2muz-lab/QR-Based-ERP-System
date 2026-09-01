import { useState, useEffect, useCallback } from 'react';
import { offlineSyncManager, SyncStatus, SyncOperation } from '../utils/offlineSync';

export interface UseOfflineSyncReturn {
  syncStatus: SyncStatus;
  queueOperation: (operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount'>) => string;
  forceSync: () => Promise<void>;
  clearErrors: () => void;
  clearQueue: () => void;
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  errorCount: number;
}

export const useOfflineSync = (): UseOfflineSyncReturn => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(offlineSyncManager.getStatus());

  useEffect(() => {
    const handleStatusChange = (status: SyncStatus) => {
      setSyncStatus(status);
    };

    offlineSyncManager.addSyncListener(handleStatusChange);

    return () => {
      offlineSyncManager.removeSyncListener(handleStatusChange);
    };
  }, []);

  const queueOperation = useCallback((
    operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount'>
  ): string => {
    return offlineSyncManager.queueOperation(operation);
  }, []);

  const forceSync = useCallback(async (): Promise<void> => {
    await offlineSyncManager.forcSync();
  }, []);

  const clearErrors = useCallback((): void => {
    offlineSyncManager.clearErrors();
  }, []);

  const clearQueue = useCallback((): void => {
    offlineSyncManager.clearSyncQueue();
  }, []);

  return {
    syncStatus,
    queueOperation,
    forceSync,
    clearErrors,
    clearQueue,
    isOnline: syncStatus.isOnline,
    isSyncing: syncStatus.isSyncing,
    pendingCount: syncStatus.pendingOperations,
    errorCount: syncStatus.errors.length
  };
};