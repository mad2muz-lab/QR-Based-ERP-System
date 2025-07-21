import React from 'react';
import { Equipment, EquipmentMaintenanceSchedule } from '../../types';

interface MaintenanceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: EquipmentMaintenanceSchedule;
  equipment: Equipment | null;
  detectedClass: 'A' | 'B' | 'C' | undefined;
}

const MaintenanceDetailsModal: React.FC<MaintenanceDetailsModalProps> = ({
  isOpen,
  onClose,
  schedule,
  equipment,
  detectedClass
}) => {
  if (!isOpen || !schedule) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Maintenance Details</h2>
        <div className="mb-2"><b>Equipment:</b> {equipment?.name || schedule.equipment_id}</div>
        <div className="mb-2"><b>Type:</b> {schedule.maintenance_type}</div>
        <div className="mb-2"><b>Class:</b> {detectedClass || 'N/A'}</div>
        <div className="mb-2"><b>Next Due:</b> {new Date(schedule.next_maintenance_date).toLocaleString()}</div>
        <div className="mb-2"><b>Priority:</b> {schedule.priority}</div>
        <div className="mb-2"><b>Description:</b> {schedule.description}</div>
        <div className="mb-2"><b>Status:</b> {schedule.is_active ? 'Active' : 'Inactive'}</div>
        <div className="flex justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded">Close</button>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceDetailsModal; 