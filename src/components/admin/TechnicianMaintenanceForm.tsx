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
  HardHat,
  Cog,
  Package,
  ClipboardList,
  Timer
} from 'lucide-react';
import type { Equipment, EquipmentMaintenanceLog, MaterialSelection } from '../../types';
import MaterialSelectionWithQuantity from '../common/MaterialSelectionWithQuantity';
import { calculateTotalDuration, formatElapsedTime } from '../../utils/timeUtils';
import { PurchaseRequestService } from '../../utils/purchaseRequestService';

interface TechnicianMaintenanceFormProps {
  maintenanceLog: EquipmentMaintenanceLog;
  equipment: Equipment;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: {
    actual_duration_hours: number;
    technician_notes: string;
    parts_used: string;
    completed_by: string;
    status: 'in_progress' | 'completed';
    selected_materials?: MaterialSelection[];
  }) => Promise<void>;
}

const TechnicianMaintenanceForm: React.FC<TechnicianMaintenanceFormProps> = ({
  maintenanceLog,
  equipment,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    actual_duration_hours: maintenanceLog.estimated_duration_hours || 1,
    technician_notes: '',
    parts_used: '',
    completed_by: '',
    status: 'in_progress' as 'in_progress' | 'completed'
  });
  const [selectedMaterials, setSelectedMaterials] = useState<MaterialSelection[]>([]);
  const [showPRNotification, setShowPRNotification] = useState(false);
  const [prGenerated, setPrGenerated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Get current user for completed_by field
    const loadCurrentUser = async () => {
      try {
        const { AuthManager } = await import('../../utils/authUtils');
        const user = AuthManager.getCurrentUserSync();
        if (user) {
          setCurrentUser(user);
          setFormData(prev => ({
            ...prev,
            completed_by: user.name || user.username || ''
          }));
        }
      } catch (error) {
        console.error('Failed to load current user:', error);
      }
    };
    
    if (isOpen) {
      loadCurrentUser();
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!formData.technician_notes.trim() || !formData.completed_by.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      // Auto-generate PR if there are materials requiring procurement
      if (selectedMaterials.length > 0 && !prGenerated) {
        const materialsNeedingPR = selectedMaterials.filter(m => m.quantity > m.availableStock);
        if (materialsNeedingPR.length > 0) {
          const prResult = await PurchaseRequestService.autoGeneratePRFromMaintenance(
            equipment.id,
            equipment.name,
            maintenanceLog.maintenance_type,
            selectedMaterials,
            equipment.site,
            'Maintenance'
          );
          
          if (prResult.success && prResult.data) {
            setShowPRNotification(true);
            setPrGenerated(true);
          }
        }
      }

      // Prepare parts used string from selected materials
      const partsUsedString = selectedMaterials.length > 0 
        ? selectedMaterials.map(m => `${m.materialName} (${m.quantity} ${m.unit})`).join(', ')
        : formData.parts_used;

      await onSubmit({
        ...formData,
        parts_used: partsUsedString,
        selected_materials: selectedMaterials
      });
      onClose();
    } catch (error) {
      console.error('Failed to submit maintenance form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        actual_duration_hours: maintenanceLog.estimated_duration_hours || 1,
        technician_notes: '',
        parts_used: '',
        completed_by: currentUser?.name || currentUser?.username || '',
        status: 'in_progress'
      });
      setSelectedMaterials([]);
      setShowPRNotification(false);
      setPrGenerated(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <HardHat className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Technician Maintenance Form
              </h2>
              <p className="text-sm text-gray-600">
                Complete maintenance inspection and work details
              </p>
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

        {/* Equipment and Maintenance Info */}
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Equipment Details</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Name:</span> {equipment.name}</p>
                <p><span className="font-medium">ID:</span> {equipment.custom_equipment_id}</p>
                <p><span className="font-medium">Type:</span> {equipment.type}</p>
                <p><span className="font-medium">Site:</span> {equipment.site}</p>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Maintenance Request</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Type:</span> 
                  <span className={`ml-1 px-2 py-1 rounded text-xs font-medium ${
                    maintenanceLog.maintenance_type === 'repair' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {maintenanceLog.maintenance_type === 'repair' ? 'Repair' : 'Service'}
                  </span>
                </p>
                <p><span className="font-medium">Priority:</span> {maintenanceLog.status}</p>
                <p><span className="font-medium">Description:</span> {maintenanceLog.description}</p>
                <p><span className="font-medium">Estimated Hours:</span> {maintenanceLog.estimated_duration_hours}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Maintenance Status
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormData(prev => ({ ...prev, status: 'in_progress' }))}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  formData.status === 'in_progress'
                    ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">In Progress</span>
                </div>
                <p className="text-sm text-gray-600">
                  Work has started, equipment is being serviced
                </p>
              </button>

              <button
                onClick={() => setFormData(prev => ({ ...prev, status: 'completed' }))}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  formData.status === 'completed'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Completed</span>
                </div>
                <p className="text-sm text-gray-600">
                  Work is finished, equipment is ready for use
                </p>
              </button>
            </div>
          </div>

          {/* Technician Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Technician Notes *
            </label>
            <textarea
              value={formData.technician_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, technician_notes: e.target.value }))}
              placeholder="Describe the work performed, issues found, and any recommendations..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>

          {/* Smart Material Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Spare Parts Selection
            </label>
            <MaterialSelectionWithQuantity
              selectedMaterials={selectedMaterials}
              onMaterialsChange={setSelectedMaterials}
              site={equipment.site}
              equipmentType={equipment.type}
              onPRGenerated={(prId) => {
                setShowPRNotification(true);
                setPrGenerated(true);
              }}
            />
          </div>

          {/* Manual Parts Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={formData.parts_used}
              onChange={(e) => setFormData(prev => ({ ...prev, parts_used: e.target.value }))}
              placeholder="Additional notes about parts used, work performed, or special instructions..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          {/* Duration and Cost */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Actual Duration (hours)
              </label>
              <input
                type="number"
                value={formData.actual_duration_hours}
                onChange={(e) => setFormData(prev => ({ ...prev, actual_duration_hours: Number(e.target.value) }))}
                min="0.1"
                step="0.1"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auto-Calculated Duration
              </label>
              <div className="flex items-center space-x-2 p-3 bg-gray-50 border border-gray-300 rounded-lg">
                <Timer className="w-5 h-5 text-blue-600" />
                <span className="text-lg font-semibold text-gray-900">
                  {maintenanceLog.start_date ? 
                    formatElapsedTime(calculateTotalDuration(maintenanceLog.start_date, new Date().toISOString())) :
                    'N/A'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Completed By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Completed By *
            </label>
            <input
              type="text"
              value={formData.completed_by}
              onChange={(e) => setFormData(prev => ({ ...prev, completed_by: e.target.value }))}
              placeholder="Enter technician name"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* PR Notification */}
          {showPRNotification && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <h4 className="font-medium text-green-800">Purchase Request Generated</h4>
                  <p className="text-sm text-green-700">
                    A purchase request has been automatically generated for parts requiring procurement.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.technician_notes.trim() || !formData.completed_by.trim() || isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>{formData.status === 'completed' ? 'Complete Maintenance' : 'Update Progress'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicianMaintenanceForm; 