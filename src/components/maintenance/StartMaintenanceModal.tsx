import React from 'react';
import { Equipment, EquipmentMaintenanceSchedule } from '../../types';

interface StartMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: EquipmentMaintenanceSchedule;
  detectedClass: 'A' | 'B' | 'C' | undefined;
  classMaterials: any[];
  equipment: Equipment | null;
  onComplete: () => Promise<void>;
}

const StartMaintenanceModal: React.FC<StartMaintenanceModalProps> = ({
  isOpen,
  onClose,
  schedule,
  detectedClass,
  classMaterials,
  equipment,
  onComplete
}) => {
  if (!isOpen || !schedule) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Start Preventive Maintenance</h2>
        <p>Detected Maintenance Class: <b>{detectedClass}</b></p>
        <h3 className="mt-4 font-semibold">Materials for Class {detectedClass}</h3>
        <ul className="mb-4">
          {classMaterials.length === 0 && <li className="text-gray-500">No materials configured for this class.</li>}
          {classMaterials.map((mat, idx) => (
            <li key={idx} className="text-sm text-gray-800">{mat.spare_part} ({mat.estimated_quantity} {mat.uom})</li>
          ))}
        </ul>
        <div className="flex justify-end space-x-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
          <button onClick={onComplete} className="px-4 py-2 bg-green-600 text-white rounded">Request Materials</button>
        </div>
      </div>
    </div>
  );
};

export default StartMaintenanceModal; 