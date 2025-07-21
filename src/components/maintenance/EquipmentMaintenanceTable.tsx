import React from 'react';
import ActivityTimer from '../common/ActivityTimer';
import TotalDurationDisplay from '../common/TotalDurationDisplay';

const EquipmentMaintenanceTable = ({ enrichedEquipment, getStatusColor }: {
  enrichedEquipment: any[];
  getStatusColor: (status: string) => string;
}) => (
  <div className="bg-white rounded-lg shadow">
    <div className="px-6 py-4 border-b border-gray-200">
      <h2 className="text-lg font-medium text-gray-900">Equipment Requiring Maintenance</h2>
      <p className="text-sm text-gray-600">Equipment currently under maintenance, scheduled for maintenance, or with active maintenance requests</p>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Maintenance</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last/Next</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {enrichedEquipment.map((eq) => (
            <tr key={eq.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">{eq.name}</div>
                  <div className="text-sm text-gray-500">ID: {eq.custom_equipment_id}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{eq.type}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(eq.status)}`}>{eq.status}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {eq.currentMaintenance ? (
                  <div>
                    <div className="font-medium">{eq.currentMaintenance.maintenance_type}</div>
                    <div className="text-gray-500">{eq.currentMaintenance.description}</div>
                    {eq.currentMaintenance.status === 'in_progress' && (
                      <div className="mt-1">
                        <ActivityTimer startTime={eq.currentMaintenance.start_date} variant="compact" showIcon={true} />
                      </div>
                    )}
                    {eq.currentMaintenance.status === 'completed' && eq.currentMaintenance.completion_date && (
                      <div className="mt-1">
                        <TotalDurationDisplay startTime={eq.currentMaintenance.start_date} endTime={eq.currentMaintenance.completion_date} variant="compact" showIcon={true} />
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400">No active maintenance</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div>
                  {eq.lastMaintenance && (
                    <div className="text-gray-500">Last: {new Date(eq.lastMaintenance).toLocaleDateString()}</div>
                  )}
                  {eq.nextMaintenance && (
                    <div className="text-blue-600">Next: {new Date(eq.nextMaintenance).toLocaleDateString()}</div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {enrichedEquipment.length === 0 && (
      <div className="text-center py-8 text-gray-500">
        No equipment currently requires maintenance.
      </div>
    )}
  </div>
);

export default EquipmentMaintenanceTable; 