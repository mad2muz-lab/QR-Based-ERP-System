import React from 'react';

interface EquipmentMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment?: any;
}

const EquipmentMaintenanceModal: React.FC<EquipmentMaintenanceModalProps> = ({ isOpen, onClose, equipment }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Equipment Maintenance</h2>
        <p className="text-gray-600 mb-4">Equipment: {equipment?.name || 'N/A'}</p>
        <p className="text-gray-600 mb-4">Maintenance form coming soon.</p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default EquipmentMaintenanceModal;
