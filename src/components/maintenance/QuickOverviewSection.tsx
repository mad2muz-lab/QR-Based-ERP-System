import React from 'react';

interface QuickOverviewSectionProps {
  maintenanceSchedules: any[];
  equipment: any[];
  onSeeAll: () => void;
}

const QuickOverviewSection: React.FC<QuickOverviewSectionProps> = ({ maintenanceSchedules, equipment, onSeeAll }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
    {/* Upcoming Maintenance */}
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <span className="w-5 h-5 text-blue-600 mr-2">📅</span>
          Next 5 Scheduled
        </h3>
        <button onClick={onSeeAll} className="text-blue-600 hover:underline text-sm">See All</button>
      </div>
      <div className="space-y-3">
        {maintenanceSchedules
          .filter(schedule => schedule.is_active && new Date(schedule.next_maintenance_date) > new Date() && schedule.status !== 'completed')
          .slice(0, 5)
          .map((schedule) => {
            const relatedEquipment = equipment.find(eq => eq.id === schedule.equipment_id);
            return (
              <div key={schedule.id} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{relatedEquipment?.name || 'Unknown Equipment'}</h4>
                    <p className="text-sm text-gray-600">{schedule.maintenance_type} Maintenance</p>
                    <p className="text-xs text-gray-500">Due: {new Date(schedule.next_maintenance_date).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    schedule.priority === 'high' ? 'bg-red-100 text-red-800' :
                    schedule.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {schedule.priority}
                  </span>
                </div>
              </div>
            );
          })}
        {maintenanceSchedules.filter(schedule => schedule.is_active && new Date(schedule.next_maintenance_date) > new Date() && schedule.status !== 'completed').length === 0 && (
          <p className="text-gray-500 text-center py-4">No upcoming maintenance scheduled</p>
        )}
      </div>
    </div>
  </div>
);

export default QuickOverviewSection; 