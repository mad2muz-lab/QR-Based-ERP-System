import React from 'react';
import ActivityTimer from '../common/ActivityTimer';
import TotalDurationDisplay from '../common/TotalDurationDisplay';
import { Eye } from 'lucide-react';

const MaintenanceRequestsTable = ({ enrichedMaintenanceLogs, getStatusColor, openMaintenanceModal }: {
  enrichedMaintenanceLogs: any[];
  getStatusColor: (status: string) => string;
  openMaintenanceModal: (log: any) => void;
}) => (
  <div className="bg-white rounded-lg shadow">
    <div className="px-6 py-4 border-b border-gray-200">
      <h2 className="text-lg font-medium text-gray-900">Maintenance Requests</h2>
      <p className="text-sm text-gray-600">All maintenance logs and scheduled maintenance</p>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {enrichedMaintenanceLogs.map((log) => (
            <tr key={log.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">{log.equipment_name}</div>
                  <div className="text-sm text-gray-500">{log.equipment_type}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.maintenance_type}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(log.status)}`}>{log.status}</span>
                  {log.status === 'in_progress' && (
                    <ActivityTimer startTime={log.start_date} variant="compact" showIcon={false} />
                  )}
                  {log.status === 'completed' && log.completion_date && (
                    <TotalDurationDisplay startTime={log.start_date} endTime={log.completion_date} variant="compact" showIcon={false} />
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                <div className="max-w-xs truncate">{log.description || 'No description'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(log.start_date).toLocaleDateString()}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div className="flex space-x-2">
                  <button
                    onClick={() => openMaintenanceModal(log)}
                    className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                    title="View/Edit Maintenance"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-xs">Actions</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {enrichedMaintenanceLogs.length === 0 && (
      <div className="text-center py-8 text-gray-500">
        No maintenance requests found matching the current filters.
      </div>
    )}
  </div>
);

export default MaintenanceRequestsTable; 