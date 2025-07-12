import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  X,
  Settings
} from 'lucide-react';
import { offlineSyncManager, SyncStatus } from '../../utils/offlineSync';

interface SyncStatusIndicatorProps {
  showDetails?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ 
  showDetails = false,
  position = 'top-right'
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(offlineSyncManager.getStatus());
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const handleStatusChange = (status: SyncStatus) => {
      setSyncStatus(status);
    };

    offlineSyncManager.addSyncListener(handleStatusChange);

    return () => {
      offlineSyncManager.removeSyncListener(handleStatusChange);
    };
  }, []);

  const getStatusIcon = () => {
    if (!syncStatus.isOnline) {
      return <WifiOff className="w-4 h-4 text-red-500" />;
    }
    
    if (syncStatus.isSyncing) {
      return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
    }
    
    if (syncStatus.pendingOperations > 0) {
      return <Clock className="w-4 h-4 text-yellow-500" />;
    }
    
    if (syncStatus.errors.length > 0) {
      return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    }
    
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (!syncStatus.isOnline) {
      return 'Offline';
    }
    
    if (syncStatus.isSyncing) {
      return `Syncing... ${Math.round(syncStatus.syncProgress)}%`;
    }
    
    if (syncStatus.pendingOperations > 0) {
      return `${syncStatus.pendingOperations} pending`;
    }
    
    if (syncStatus.errors.length > 0) {
      return `${syncStatus.errors.length} errors`;
    }
    
    return 'Synced';
  };

  const getStatusColor = () => {
    if (!syncStatus.isOnline) return 'bg-red-100 border-red-200 text-red-800';
    if (syncStatus.isSyncing) return 'bg-blue-100 border-blue-200 text-blue-800';
    if (syncStatus.pendingOperations > 0) return 'bg-yellow-100 border-yellow-200 text-yellow-800';
    if (syncStatus.errors.length > 0) return 'bg-orange-100 border-orange-200 text-orange-800';
    return 'bg-green-100 border-green-200 text-green-800';
  };

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  const handleForceSync = async () => {
    if (syncStatus.isOnline) {
      await offlineSyncManager.forcSync();
    }
  };

  const handleClearErrors = () => {
    offlineSyncManager.clearErrors();
  };

  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Status Indicator */}
      <div className={`fixed ${positionClasses[position]} z-50`}>
        <div
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${getStatusColor()}`}
          onClick={() => setShowDetailPanel(!showDetailPanel)}
        >
          {getStatusIcon()}
          {showDetails && (
            <span className="text-sm font-medium">{getStatusText()}</span>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {showDetailPanel && (
        <div className={`fixed ${positionClasses[position]} z-50 mt-12`}>
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Sync Status</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowDetailPanel(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Connection Status */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Connection:</span>
                <div className="flex items-center space-x-2">
                  {syncStatus.isOnline ? (
                    <Wifi className="w-4 h-4 text-green-500" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    syncStatus.isOnline ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {syncStatus.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>

              {/* Sync Progress */}
              {syncStatus.isSyncing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Progress:</span>
                    <span className="text-sm font-medium text-blue-600">
                      {Math.round(syncStatus.syncProgress)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${syncStatus.syncProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Pending Operations */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending:</span>
                <span className={`text-sm font-medium ${
                  syncStatus.pendingOperations > 0 ? 'text-yellow-600' : 'text-gray-600'
                }`}>
                  {syncStatus.pendingOperations} operations
                </span>
              </div>

              {/* Errors */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Errors:</span>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${
                    syncStatus.errors.length > 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {syncStatus.errors.length}
                  </span>
                  {syncStatus.errors.length > 0 && (
                    <button
                      onClick={handleClearErrors}
                      className="text-xs text-red-600 hover:text-red-800 underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Last Sync */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last sync:</span>
                <span className="text-sm text-gray-600">
                  {formatLastSync(syncStatus.lastSyncTime)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <button
                  onClick={handleForceSync}
                  disabled={!syncStatus.isOnline || syncStatus.isSyncing}
                  className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
                  <span className="text-sm">Sync Now</span>
                </button>
              </div>
            </div>

            {/* Recent Errors */}
            {syncStatus.errors.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Errors:</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {syncStatus.errors.slice(-3).map(error => (
                    <div key={error.id} className="p-2 bg-red-50 rounded border border-red-200">
                      <div className="text-xs text-red-800 font-medium">
                        {error.operation.type} {error.operation.entityType}
                      </div>
                      <div className="text-xs text-red-600 mt-1">
                        {error.error}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Settings Panel */}
            {showSettings && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Settings:</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      onChange={(e) => offlineSyncManager.setBatteryOptimization(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-600">Battery optimization</span>
                  </label>
                  <button
                    onClick={() => offlineSyncManager.clearSyncQueue()}
                    className="w-full text-left text-sm text-red-600 hover:text-red-800"
                  >
                    Clear sync queue
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SyncStatusIndicator;