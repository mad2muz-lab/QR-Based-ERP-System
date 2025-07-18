import React, { useState, useEffect } from 'react';
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
  HardHat
} from 'lucide-react';
import type { Equipment, EquipmentMaintenanceLog, EquipmentMaintenanceSchedule } from '../../types';

interface EquipmentMaintenanceModalProps {
  equipment: Equipment;
  isOpen: boolean;
  onClose: () => void;
  onMaintenanceStart: (maintenanceData: any) => Promise<void>;
  onMaintenanceComplete: (maintenanceData: any) => Promise<void>;
}

const EquipmentMaintenanceModal: React.FC<EquipmentMaintenanceModalProps> = ({
  equipment,
  isOpen,
  onClose,
  onMaintenanceStart,
  onMaintenanceComplete
}) => {
  const [maintenanceType, setMaintenanceType] = useState<'repair' | 'service'>('repair');
  const [repairType, setRepairType] = useState<'on_site' | 'yard_repair'>('on_site');
  const [serviceType, setServiceType] = useState<'type_a' | 'type_b' | 'type_c'>('type_a');
  const [description, setDescription] = useState('');
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [partsUsed, setPartsUsed] = useState('');
  const [estimatedHours, setEstimatedHours] = useState<number>(1);
  const [cost, setCost] = useState<number>(0);
  const [assignedTechnician, setAssignedTechnician] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setMaintenanceType('repair');
      setRepairType('on_site');
      setServiceType('type_a');
      setDescription('');
      setTechnicianNotes('');
      setPartsUsed('');
      setEstimatedHours(1);
      setCost(0);
      setAssignedTechnician('');
      setPriority('medium');
      setIsScheduled(false);
      setScheduleDate('');
    }
  }, [isOpen]);

  const handleStartMaintenance = async () => {
    if (!description.trim()) {
      alert('Please provide a description for the maintenance');
      return;
    }

    setIsLoading(true);
    try {
      const maintenanceData = {
        equipment_id: equipment.id,
        maintenance_type: maintenanceType,
        repair_type: maintenanceType === 'repair' ? repairType : undefined,
        service_type: maintenanceType === 'service' ? serviceType : undefined,
        status: 'in_progress' as const,
        description: description.trim(),
        technician_notes: technicianNotes.trim(),
        parts_used: partsUsed.trim(),
        start_date: new Date().toISOString(),
        estimated_duration_hours: estimatedHours,
        cost: cost,
        assigned_technician: assignedTechnician.trim(),
        priority,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        equipment // <-- pass the full equipment object
      };

      await onMaintenanceStart(maintenanceData);
      onClose();
    } catch (error) {
      console.error('Failed to start maintenance:', error);
      alert('Failed to start maintenance. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleMaintenance = async () => {
    if (!description.trim()) {
      alert('Please provide a description for the maintenance');
      return;
    }

    if (!scheduleDate) {
      alert('Please select a schedule date');
      return;
    }

    setIsLoading(true);
    try {
      const scheduleData = {
        equipment_id: equipment.id,
        schedule_type: 'preventive' as const,
        maintenance_type: maintenanceType,
        frequency_days: 30, // Default 30 days
        next_maintenance_date: scheduleDate,
        assigned_technician: assignedTechnician.trim(),
        priority,
        description: description.trim(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        equipment // <-- pass the full equipment object
      };

      await onMaintenanceStart(scheduleData);
      onClose();
    } catch (error) {
      console.error('Failed to schedule maintenance:', error);
      alert('Failed to schedule maintenance. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Wrench className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Equipment Maintenance</h2>
              <p className="text-sm text-gray-600">{equipment.name} - {equipment.custom_equipment_id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Maintenance Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Maintenance Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMaintenanceType('repair')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  maintenanceType === 'repair'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5" />
                  <div>
                    <div className="font-medium">Repair</div>
                    <div className="text-sm opacity-75">Fix equipment issues</div>
                  </div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setMaintenanceType('service')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  maintenanceType === 'service'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Settings className="w-5 h-5" />
                  <div>
                    <div className="font-medium">Service</div>
                    <div className="text-sm opacity-75">Regular maintenance</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Repair Type (if repair selected) */}
          {maintenanceType === 'repair' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Repair Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRepairType('on_site')}
                  className={`p-3 border-2 rounded-lg text-left transition-all ${
                    repairType === 'on_site'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <HardHat className="w-4 h-4" />
                    <span className="font-medium">On-Site</span>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setRepairType('yard_repair')}
                  className={`p-3 border-2 rounded-lg text-left transition-all ${
                    repairType === 'yard_repair'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                                   <div className="flex items-center space-x-2">
                   <Hammer className="w-4 h-4" />
                   <span className="font-medium">Yard Repair</span>
                 </div>
                </button>
              </div>
            </div>
          )}

          {/* Service Type (if service selected) */}
          {maintenanceType === 'service' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Service Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'type_a', label: 'Type A', desc: 'Basic Service' },
                  { value: 'type_b', label: 'Type B', desc: 'Standard Service' },
                  { value: 'type_c', label: 'Type C', desc: 'Premium Service' }
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setServiceType(type.value as any)}
                    className={`p-3 border-2 rounded-lg text-left transition-all ${
                      serviceType === type.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{type.label}</div>
                    <div className="text-sm opacity-75">{type.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Priority Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Priority Level
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'low', label: 'Low', color: 'green' },
                { value: 'medium', label: 'Medium', color: 'yellow' },
                { value: 'high', label: 'High', color: 'orange' },
                { value: 'critical', label: 'Critical', color: 'red' }
              ].map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setPriority(level.value as any)}
                  className={`p-2 border-2 rounded-lg text-center transition-all ${
                    priority === level.value
                      ? `border-${level.color}-500 bg-${level.color}-50 text-${level.color}-700`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm">{level.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the maintenance issue or service required..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          {/* Technician Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Technician Notes
            </label>
            <textarea
              value={technicianNotes}
              onChange={(e) => setTechnicianNotes(e.target.value)}
              placeholder="Additional notes for technicians..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
            />
          </div>

          {/* Parts Used */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Parts Used
            </label>
            <input
              type="text"
              value={partsUsed}
              onChange={(e) => setPartsUsed(e.target.value)}
              placeholder="List parts used (comma separated)"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Estimated Duration and Cost */}
          <div className="grid grid-cols-2 gap-4">
            <div>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Cost (SAR)
              </label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                min="0"
                step="0.01"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Assigned Technician */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned Technician
            </label>
            <input
              type="text"
              value={assignedTechnician}
              onChange={(e) => setAssignedTechnician(e.target.value)}
              placeholder="Enter technician name"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Schedule Option */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="schedule"
              checked={isScheduled}
              onChange={(e) => setIsScheduled(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="schedule" className="text-sm font-medium text-gray-700">
              Schedule for later
            </label>
          </div>

          {/* Schedule Date */}
          {isScheduled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule Date
              </label>
              <input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={isScheduled ? handleScheduleMaintenance : handleStartMaintenance}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                {isScheduled ? <Calendar className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
                <span>{isScheduled ? 'Schedule Maintenance' : 'Start Maintenance'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EquipmentMaintenanceModal; 