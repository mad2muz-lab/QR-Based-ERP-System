import React from 'react';

interface RecentMaintenanceActivityProps {
  maintenanceLogs: any[];
  onSeeAll: () => void;
}

const RecentMaintenanceActivity: React.FC<RecentMaintenanceActivityProps> = ({ maintenanceLogs, onSeeAll }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-medium text-gray-900 flex items-center">
        <span className="w-5 h-5 text-green-600 mr-2">📈</span>
        Last 5 Completed
      </h3>
      <button onClick={onSeeAll} className="text-blue-600 hover:underline text-sm">See All</button>
    </div>
    <div className="space-y-3">
      {maintenanceLogs
        .filter(log => log.status === 'completed')
        .sort((a, b) => new Date(b.completed_date || '').getTime() - new Date(a.completed_date || '').getTime()) // Fixed: was completion_date, should be completed_date
        .slice(0, 5)
        .map((log) => (
          <div key={log.id} className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-gray-900">{log.equipment_name || 'Unknown Equipment'}</h4>
                <p className="text-sm text-gray-600">{log.maintenance_type} - {log.description || 'No description'}</p>
                <p className="text-xs text-gray-500">Completed: {new Date(log.completed_date || '').toLocaleDateString()}</p> // Fixed: was completion_date, should be completed_date
              </div>
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                Completed
              </span>
            </div>
          </div>
        ))}
      {maintenanceLogs.filter(log => log.status === 'completed').length === 0 && (
        <p className="text-gray-500 text-center py-4">No recent maintenance activity</p>
      )}
    </div>
  </div>
);

export default RecentMaintenanceActivity; 