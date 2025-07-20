import React, { useState } from 'react';
import { 
  X, 
  Wrench, 
  Settings, 
  AlertTriangle, 
  Clock, 
  User, 
  Calendar,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  Hammer,
  HardHat,
  Cog
} from 'lucide-react';
import type { Equipment } from '../../types';

interface MaintenanceTypeSelectionModalProps {
  equipment: Equipment;
  isOpen: boolean;
  onClose: () => void;
  onMaintenanceTypeSelected: (maintenanceData: {
    equipment_id: string;
    maintenance_type: 'repair' | 'service';
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    estimated_duration_hours: number;
  }) => Promise<void>;
}

const MaintenanceTypeSelectionModal: React.FC<MaintenanceTypeSelectionModalProps> = ({
  equipment,
  isOpen,
  onClose,
  onMaintenanceTypeSelected
}) => {
  const [selectedType, setSelectedType] = useState<'repair' | 'service' | null>(null);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [estimatedHours, setEstimatedHours] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedType || !description.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      await onMaintenanceTypeSelected({
        equipment_id: equipment.id,
        maintenance_type: selectedType,
        description: description.trim(),
        priority,
        estimated_duration_hours: estimatedHours
      });
      
      // Reset form
      setSelectedType(null);
      setDescription('');
      setPriority('medium');
      setEstimatedHours(1);
      onClose();
    } catch (error) {
      console.error('Failed to mark equipment for maintenance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setSelectedType(null);
      setDescription('');
      setPriority('medium');
      setEstimatedHours(1);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Wrench className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Mark for Maintenance
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Equipment Info */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center space-x-3">
            <Cog className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-medium text-gray-900">{equipment.name}</h3>
              <p className="text-sm text-gray-600">
                {equipment.type} • {equipment.custom_equipment_id}
              </p>
              <p className="text-sm text-gray-600">Site: {equipment.site}</p>
            </div>
          </div>
        </div>

        {/* Maintenance Type Selection */}
        <div className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Maintenance Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedType('service')}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  selectedType === 'service'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Regular Service</span>
                </div>
                <p className="text-sm text-gray-600">
                  Scheduled maintenance, routine service, preventive maintenance
                </p>
              </button>

              <button
                onClick={() => setSelectedType('repair')}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  selectedType === 'repair'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">Need Repair</span>
                </div>
                <p className="text-sm text-gray-600">
                  Equipment malfunction, breakdown, requires immediate attention
                </p>
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`Describe the ${selectedType === 'service' ? 'service needed' : 'repair required'}...`}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          {/* Priority */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Estimated Duration */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Duration (hours)
            </label>
            <input
              type="number"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(Number(e.target.value))}
              min="0.5"
              step="0.5"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedType || !description.trim() || isLoading}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4" />
                  <span>Mark for Maintenance</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceTypeSelectionModal; 