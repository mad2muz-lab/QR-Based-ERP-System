import React, { useState, useEffect } from 'react';
import { 
  X, 
  Wrench, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  HardHat,
  Package,
  Save,
  Play,
  Pause,
  StopCircle
} from 'lucide-react';
import { MaintenanceSchedule } from '../../utils/preventiveMaintenanceService';
import { DataStorage } from '../../utils/dataStorage';

interface PreventiveServiceModalProps {
  schedule: MaintenanceSchedule;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (completionData: {
    actual_duration_hours: number;
    cost: number;
    technician_notes: string;
    parts_used: string;
    completed_by: string;
  }) => Promise<void>;
}

const PreventiveServiceModal: React.FC<PreventiveServiceModalProps> = ({
  schedule,
  isOpen,
  onClose,
  onComplete
}) => {
  const [formData, setFormData] = useState({
    actual_duration_hours: schedule.estimated_hours,
    cost: 0,
    technician_notes: '',
    parts_used: '',
    completed_by: ''
  });
  const [materials, setMaterials] = useState<any[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>(schedule.materials_required || []);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerStart, setTimerStart] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setFormData({
        actual_duration_hours: schedule.estimated_hours,
        cost: 0,
        technician_notes: '',
        parts_used: '',
        completed_by: ''
      });
      setSelectedMaterials(schedule.materials_required || []);
    }
  }, [isOpen, schedule]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning && timerStart) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = (now.getTime() - timerStart.getTime()) / (1000 * 60 * 60); // Convert to hours
        setElapsedTime(elapsed);
        setFormData(prev => ({ ...prev, actual_duration_hours: Math.round(elapsed * 100) / 100 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerStart]);

  const loadData = async () => {
    try {
      // Load materials
      const allMaterials = DataStorage.loadMaterials();
      setMaterials(allMaterials);

      // Load current user
      const users = DataStorage.loadUsers();
      const currentUser = users.find(u => u.role === 'admin' || u.role === 'manager');
      if (currentUser) {
        setCurrentUser(currentUser);
        setFormData(prev => ({ ...prev, completed_by: currentUser.name || currentUser.username }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const startTimer = () => {
    setTimerRunning(true);
    setTimerStart(new Date());
  };

  const pauseTimer = () => {
    setTimerRunning(false);
  };

  const stopTimer = () => {
    setTimerRunning(false);
    setTimerStart(null);
  };

  const handleSubmit = async () => {
    if (!formData.technician_notes.trim() || !formData.completed_by.trim()) {
      alert('Please provide technician notes and completed by information');
      return;
    }

    setIsLoading(true);
    try {
      await onComplete({
        ...formData,
        parts_used: selectedMaterials.join(', ')
      });
    } catch (error) {
      console.error('Error completing maintenance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setTimerRunning(false);
      setTimerStart(null);
      setElapsedTime(0);
      onClose();
    }
  };

  const getMaintenanceClassColor = (maintenanceClass: string) => {
    switch (maintenanceClass) {
      case 'A': return 'bg-green-100 text-green-800 border-green-200';
      case 'B': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'C': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Wrench className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Preventive Maintenance Service</h2>
              <p className="text-sm text-gray-600">{schedule.equipment_name} - {schedule.equipment_type}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Schedule Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Class</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium border ${getMaintenanceClassColor(schedule.maintenance_class)}`}>
                  Class {schedule.maintenance_class}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium border ${getPriorityColor(schedule.priority)}`}>
                  {schedule.priority}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                <span className="text-sm text-gray-900">
                  {new Date(schedule.scheduled_date).toLocaleDateString()}
                </span>
              </div>
            </div>
            {schedule.description && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-sm text-gray-900">{schedule.description}</p>
              </div>
            )}
          </div>

          {/* Timer Section */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Service Timer</h3>
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {Math.floor(elapsedTime)}:{(elapsedTime % 1 * 60).toFixed(0).padStart(2, '0')}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {!timerRunning ? (
                <button
                  onClick={startTimer}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Timer</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={pauseTimer}
                    className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Pause</span>
                  </button>
                  <button
                    onClick={stopTimer}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <StopCircle className="w-4 h-4" />
                    <span>Stop</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Materials Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Materials Used
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {materials.map((material) => (
                <label key={material.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMaterials.includes(material.name)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMaterials(prev => [...prev, material.name]);
                      } else {
                        setSelectedMaterials(prev => prev.filter(m => m !== material.name));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{material.name}</div>
                      <div className="text-xs text-gray-500">{material.type} • {material.unit}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Service Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Actual Duration (hours)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.actual_duration_hours}
                onChange={(e) => setFormData(prev => ({ ...prev, actual_duration_hours: parseFloat(e.target.value) || 0 }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter actual duration"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cost (SAR)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter cost"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Technician Notes *
            </label>
            <textarea
              value={formData.technician_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, technician_notes: e.target.value }))}
              placeholder="Describe the maintenance work performed, issues found, recommendations..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Completed By *
            </label>
            <input
              type="text"
              value={formData.completed_by}
              onChange={(e) => setFormData(prev => ({ ...prev, completed_by: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter technician name"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !formData.technician_notes.trim() || !formData.completed_by.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Completing...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Complete Maintenance</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreventiveServiceModal; 