import React from 'react';

interface DrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  classType: string;
  month: string;
  schedules: any[];
  getMonthLabel: (date: Date) => string;
}

const DrilldownModal: React.FC<DrilldownModalProps> = ({ isOpen, onClose, classType, month, schedules, getMonthLabel }) => {
  if (!isOpen) return null;
  console.log('DrilldownModal schedules:', schedules);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h3 className="text-lg font-semibold mb-4">
          {`Equipment Due for Class ${classType} in ${getMonthLabel(new Date(month + '-01'))}`}
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Equipment</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Model</th>
                <th className="px-4 py-2 text-left">Site</th>
                <th className="px-4 py-2 text-left">Due Date</th>
                <th className="px-4 py-2 text-left">Technician</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {schedules.length > 0 ? schedules.map(({ log, equipment }) => (
                <tr key={log.id} className="border-b">
                  <td className="px-4 py-2">{equipment?.name || 'Unknown Equipment'}</td>
                  <td className="px-4 py-2">{equipment?.type || '-'}</td>
                  <td className="px-4 py-2">{equipment?.model || '-'}</td>
                  <td className="px-4 py-2">{equipment?.site || '-'}</td>
                  <td className="px-4 py-2">{new Date(log.scheduled_date).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{log.technician_id || '-'}</td>
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
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="text-center text-gray-500 py-4">No equipment due for this selection</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DrilldownModal; 