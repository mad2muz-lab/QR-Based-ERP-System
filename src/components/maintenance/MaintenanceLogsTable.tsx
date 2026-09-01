import React from 'react';
import { EquipmentMaintenanceLog } from '../../types';

interface Equipment {
  id: string;
  name: string;
  [key: string]: any;
}

interface MaintenanceLogsTableProps {
  logs: EquipmentMaintenanceLog[];
  equipment: Equipment[];
  onAction?: (log: EquipmentMaintenanceLog, action: string) => void;
}

const MaintenanceLogsTable: React.FC<MaintenanceLogsTableProps> = ({ logs, equipment, onAction }) => (
  <div className="bg-white rounded-lg shadow p-6 mb-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Maintenance Logs</h3>
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto border">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-2 text-left">Equipment</th>
            <th className="px-4 py-2 text-left">Type</th>
            <th className="px-4 py-2 text-left">Class</th>
            <th className="px-4 py-2 text-left">Technician</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-left">Description</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {logs.length > 0 ? logs.map(log => {
            const eq = equipment.find(e => e.id === log.equipment_id);
            return (
              <tr key={log.id} className="border-b">
                <td className="px-4 py-2">{eq?.name || 'Unknown Equipment'}</td>
                <td className="px-4 py-2">{log.maintenance_type}</td>
                <td className="px-4 py-2">{log.maintenance_class || '-'}</td>
                <td className="px-4 py-2">{log.assigned_technician || '-'}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                    log.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                    log.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    log.status === 'completed' ? 'bg-green-100 text-green-800' :
                    log.status === 'overdue' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {log.status ? (log.status.charAt(0).toUpperCase() + log.status.slice(1)) : 'Unknown'}
                  </span>
                </td>
                <td className="px-4 py-2">{log.description || '-'}</td>
                <td className="px-4 py-2">
                  {onAction && (
                    <>
                      <button
                        className="text-blue-600 hover:underline mr-2"
                        onClick={() => onAction(log, 'edit')}
                      >Edit</button>
                      <button
                        className="text-green-600 hover:underline"
                        onClick={() => onAction(log, 'complete')}
                      >Complete</button>
                    </>
                  )}
                </td>
              </tr>
            );
          }) : (
            <tr>
              <td colSpan={7} className="text-center text-gray-500 py-4">No maintenance logs found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default MaintenanceLogsTable; 