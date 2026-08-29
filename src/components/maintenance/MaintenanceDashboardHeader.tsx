import React from 'react';

interface MaintenanceDashboardHeaderProps {
  error: string | null;
  showDiagnostic: boolean;
  setShowDiagnostic: (show: boolean) => void;
  diagnosticData: any;
  handleForceRefresh: () => void;
  forceRefreshLoading: boolean;
  loadData: (force?: boolean) => void;
  equipment: any[];
  maintenanceLogs: any[];
  maintenanceSchedules: any[];
  enrichedEquipment: any[];
  lastRefresh: Date | null;
}

const MaintenanceDashboardHeader: React.FC<MaintenanceDashboardHeaderProps> = ({
  error,
  showDiagnostic,
  setShowDiagnostic,
  diagnosticData,
  handleForceRefresh,
  forceRefreshLoading,
  loadData,
  equipment,
  maintenanceLogs,
  maintenanceSchedules,
  enrichedEquipment,
  lastRefresh
}) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex justify-between items-center mb-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Maintenance Dashboard</h1>
        <p className="text-gray-600">Comprehensive view of equipment maintenance, schedules, and activity</p>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => setShowDiagnostic(!showDiagnostic)}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center space-x-2"
        >
          <span>Diagnostic</span>
        </button>
        <button
          onClick={handleForceRefresh}
          disabled={forceRefreshLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
        >
          <span>{forceRefreshLoading ? 'Refreshing...' : 'Force Refresh'}</span>
        </button>
        <button
          onClick={() => loadData(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2"
        >
          <span>Refresh</span>
        </button>
      </div>
    </div>
    {/* Status indicators */}
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center">
          <div>
            <p className="text-sm text-blue-600">Total Equipment</p>
            <p className="text-2xl font-bold text-blue-900">{equipment.length}</p>
          </div>
        </div>
      </div>
      <div className="bg-yellow-50 p-4 rounded-lg">
        <div className="flex items-center">
          <div>
            <p className="text-sm text-yellow-600">Maintenance Logs</p>
            <p className="text-2xl font-bold text-yellow-900">{maintenanceLogs.length}</p>
          </div>
        </div>
      </div>
      <div className="bg-purple-50 p-4 rounded-lg">
        <div className="flex items-center">
          <div>
            <p className="text-sm text-purple-600">Schedules</p>
            <p className="text-2xl font-bold text-purple-900">{maintenanceSchedules.length}</p>
          </div>
        </div>
      </div>
      <div className="bg-orange-50 p-4 rounded-lg">
        <div className="flex items-center">
          <div>
            <p className="text-sm text-orange-600">Requiring Maintenance</p>
            <p className="text-2xl font-bold text-orange-900">{enrichedEquipment.length}</p>
          </div>
        </div>
      </div>
      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex items-center">
          <div>
            <p className="text-sm text-green-600">Last Refresh</p>
            <p className="text-sm font-bold text-green-900">
              {lastRefresh ? lastRefresh.toLocaleTimeString() : 'Never'}
            </p>
          </div>
        </div>
      </div>
    </div>
    {/* Error display */}
    {error && (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
        <div className="flex">
          <div>
            <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    )}
    {/* Diagnostic panel */}
    {showDiagnostic && diagnosticData && (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">System Diagnostic</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>Authentication:</strong> {diagnosticData.authentication.isAuthenticated ? '✅' : '❌'}</p>
            <p><strong>Data Source:</strong> {diagnosticData.dataSource.current}</p>
            <p><strong>Supabase:</strong> {diagnosticData.supabaseConnection.reachable ? '✅' : '❌'}</p>
          </div>
          <div>
            <p><strong>Equipment:</strong> {diagnosticData.equipment.count} ({diagnosticData.equipment.source})</p>
            <p><strong>Maintenance Logs:</strong> {diagnosticData.maintenanceLogs.count} ({diagnosticData.maintenanceLogs.source})</p>
            <p><strong>Schedules:</strong> {diagnosticData.maintenanceSchedules.count} ({diagnosticData.maintenanceSchedules.source})</p>
          </div>
        </div>
        {diagnosticData.recommendations.length > 0 && (
          <div className="mt-3">
            <p className="font-medium text-yellow-800">Recommendations:</p>
            <ul className="list-disc list-inside text-sm text-yellow-700">
              {diagnosticData.recommendations.map((rec: string, index: number) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )}
  </div>
);

export default MaintenanceDashboardHeader; 