import React, { useState, useEffect } from 'react';
import { Equipment, EquipmentMaintenanceLog } from '../../types';
import { CheckSquare, Edit, X, AlertCircle } from 'lucide-react';

interface MaintenanceActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  maintenanceLog: EquipmentMaintenanceLog | null;
  equipment: Equipment | null;
  onAction: (action: 'complete' | 'cancel' | 'edit' | 'status_update', data?: any) => Promise<void>;
}

interface FormData {
  actual_duration_hours: string;
  cost: string;
  technician_notes: string;
  parts_used: string;
  description: string;
}

interface ActionData {
  actual_duration_hours?: number;
  cost?: number;
  technician_notes?: string;
  parts_used?: string;
  description?: string;
}

const MaintenanceActionModal: React.FC<MaintenanceActionModalProps> = ({
  isOpen,
  onClose,
  maintenanceLog,
  equipment,
  onAction
}) => {
  const [action, setAction] = useState<'complete' | 'cancel' | 'edit'>('complete');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    actual_duration_hours: '',
    cost: '',
    technician_notes: '',
    parts_used: '',
    description: maintenanceLog?.description || ''
  });

  useEffect(() => {
    if (maintenanceLog) {
      setFormData({
        actual_duration_hours: maintenanceLog.actual_duration_hours?.toString() || '',
        cost: maintenanceLog.cost?.toString() || '',
        technician_notes: maintenanceLog.technician_notes || '',
        parts_used: maintenanceLog.parts_used || '',
        description: maintenanceLog.description || ''
      });
    }
  }, [maintenanceLog]);

  const handleSubmit = async () => {
    if (!maintenanceLog) return;
    setLoading(true);
    try {
      const data: ActionData = {};
      if (action === 'complete') {
        data.actual_duration_hours = formData.actual_duration_hours ? parseFloat(formData.actual_duration_hours) : undefined;
        data.cost = formData.cost ? parseFloat(formData.cost) : undefined;
        data.technician_notes = formData.technician_notes || undefined;
        data.parts_used = formData.parts_used || undefined;
      } else if (action === 'edit') {
        data.description = formData.description || undefined;
        data.technician_notes = formData.technician_notes || undefined;
      }
      await onAction(action, data);
      onClose();
    } catch (error: any) {
      console.error('Action failed:', error);
      alert('Failed to ' + action + ' maintenance: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !maintenanceLog || !equipment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {action === 'complete' ? 'Complete Maintenance' : 
             action === 'cancel' ? 'Cancel Maintenance' : 'Edit Maintenance'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        {/* Equipment Info */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="font-medium text-gray-900 mb-2">Equipment Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Name:</span>
              <span className="ml-2 font-medium">{equipment.name}</span>
            </div>
            <div>
              <span className="text-gray-600">Type:</span>
              <span className="ml-2 font-medium">{equipment.type}</span>
            </div>
            <div>
              <span className="text-gray-600">Maintenance Type:</span>
              <span className="ml-2 font-medium">{maintenanceLog.maintenance_type}</span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <span className="ml-2 font-medium">{maintenanceLog.status}</span>
            </div>
          </div>
        </div>
        {/* Action Tabs */}
        <div className="flex space-x-1 mb-4">
          <button
            onClick={() => setAction('complete')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              action === 'complete' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <CheckSquare className="w-4 h-4 inline mr-1" />
            Complete
          </button>
          <button
            onClick={() => setAction('edit')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              action === 'edit' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Edit className="w-4 h-4 inline mr-1" />
            Edit
          </button>
          <button
            onClick={() => setAction('cancel')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              action === 'cancel' 
                ? 'bg-red-100 text-red-800' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <X className="w-4 h-4 inline mr-1" />
            Cancel
          </button>
        </div>
        {/* Quick Status Update */}
        {maintenanceLog.status !== 'completed' && maintenanceLog.status !== 'cancelled' && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Quick Status Update</h3>
            <div className="flex space-x-2">
              {maintenanceLog.status === 'scheduled' && (
                <button
                  onClick={async () => {
                    try {
                      await onAction('status_update', { status: 'in_progress' });
                      onClose();
                    } catch (error: any) {
                      console.error('Status update failed:', error);
                      alert(`Status update failed: ${error.message || 'Unknown error'}`);
                    }
                  }}
                  className="px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-md hover:bg-orange-200"
                >
                  Start Work
                </button>
              )}
              {maintenanceLog.status === 'in_progress' && (
                <button
                  onClick={async () => {
                    try {
                      await onAction('status_update', { status: 'completed' });
                      onClose();
                    } catch (error: any) {
                      console.error('Status update failed:', error);
                      alert(`Status update failed: ${error.message || 'Unknown error'}`);
                    }
                  }}
                  className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-md hover:bg-green-200"
                >
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        )}
        {/* Form Fields */}
        {action === 'complete' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Actual Duration (hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.actual_duration_hours}
                  onChange={(e) => setFormData({...formData, actual_duration_hours: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 2.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({...formData, cost: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 150.00"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parts Used
              </label>
              <textarea
                value={formData.parts_used}
                onChange={(e) => setFormData({...formData, parts_used: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="List parts used in maintenance..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Technician Notes
              </label>
              <textarea
                value={formData.technician_notes}
                onChange={(e) => setFormData({...formData, technician_notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Detailed notes about the maintenance work..."
              />
            </div>
          </div>
        )}
        {action === 'edit' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Update maintenance description..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Technician Notes
              </label>
              <textarea
                value={formData.technician_notes}
                onChange={(e) => setFormData({...formData, technician_notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Update technician notes..."
              />
            </div>
          </div>
        )}
        {action === 'cancel' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-yellow-400 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Cancel Maintenance</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Are you sure you want to cancel this maintenance request? This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`px-4 py-2 text-white rounded-md ${
              action === 'complete' ? 'bg-green-600 hover:bg-green-700' :
              action === 'edit' ? 'bg-blue-600 hover:bg-blue-700' :
              'bg-red-600 hover:bg-red-700'
            } disabled:opacity-50`}
          >
            {loading ? 'Processing...' : 
             action === 'complete' ? 'Complete Maintenance' :
             action === 'edit' ? 'Update Maintenance' :
             'Cancel Maintenance'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceActionModal; 