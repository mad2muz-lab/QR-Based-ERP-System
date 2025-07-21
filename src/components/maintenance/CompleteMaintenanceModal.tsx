import React from 'react';
import { Equipment, EquipmentMaintenanceSchedule } from '../../types';

interface CompleteMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: EquipmentMaintenanceSchedule;
  equipment: Equipment | null;
  onComplete: () => Promise<void>;
}

const CompleteMaintenanceModal: React.FC<CompleteMaintenanceModalProps> = ({
  isOpen,
  onClose,
  schedule,
  equipment,
  onComplete
}) => {
  if (!isOpen || !schedule) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Complete Maintenance</h2>
        <p>Are you sure you want to mark maintenance as complete for <b>{equipment?.name || schedule.equipment_id}</b>?</p>
        <div className="flex justify-end space-x-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
          <button onClick={onComplete} className="px-4 py-2 bg-purple-600 text-white rounded">Complete</button>
        </div>
      </div>
    </div>
  );
};

export default CompleteMaintenanceModal; 