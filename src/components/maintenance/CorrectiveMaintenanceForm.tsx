import React, { useState, useEffect } from 'react';
import { X, Wrench, Clock, MapPin, AlertTriangle, Upload, CheckCircle } from 'lucide-react';
import { Equipment } from '../../types';
import { CorrectiveMaintenanceFormData, PRIORITY_OPTIONS, REPAIR_LOCATION_OPTIONS } from '../../types/correctiveMaintenance';
import { CorrectiveMaintenanceService } from '../../utils/correctiveMaintenanceService';
import { AuthManager } from '../../utils/authUtils';
import { supabase } from '../../utils/supabaseClient';
import { logManager } from '../../utils/logManager';
import { DataStorage } from '../../utils/dataStorage';
import MaterialSelectionWithQuantity from '../common/MaterialSelectionWithQuantity';
import { MaterialSelection } from '../../types/inventory';

interface CorrectiveMaintenanceFormProps {
  equipment?: Equipment;
  onClose: () => void;
  onSubmitted: (request: any) => void;
}

const CorrectiveMaintenanceForm: React.FC<CorrectiveMaintenanceFormProps> = ({
  equipment,
  onClose,
  onSubmitted
}) => {
  const [formData, setFormData] = useState<CorrectiveMaintenanceFormData>({
    issue_description: '',
    priority: 'medium',
    estimated_duration_hours: 1,
    safety_concerns: '',
    attachments: [],
    repair_location: 'site',
    geo_coordinates: undefined,
    materials_selected: []
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [maintenanceStartTime, setMaintenanceStartTime] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [locationError, setLocationError] = useState<string>('');

  // Load maintenance start time from equipment logs
  useEffect(() => {
    if (equipment) {
      loadMaintenanceStartTime();
    }
  }, [equipment]);

  // Timer for maintenance duration
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load the actual maintenance start time from equipment logs
  const loadMaintenanceStartTime = async () => {
    if (!equipment) return;

    try {
      // Try to find the maintenance-start log for this equipment
      const { data: logs, error } = await supabase
        .from('equipment_logs')
        .select('timestamp')
        .eq('equipment_id', equipment.id)
        .eq('action', 'maintenance-start')
        .order('timestamp', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error loading maintenance start time:', error);
        // Fallback to current time if we can't load the log
        setMaintenanceStartTime(new Date());
        return;
      }

      if (logs && logs.length > 0) {
        // Use the actual maintenance start time from the log
        setMaintenanceStartTime(new Date(logs[0].timestamp));
        console.log('✅ Loaded maintenance start time from log:', logs[0].timestamp);
      } else {
        // If no maintenance-start log found, try to find it in local storage
        const { DataStorage } = await import('../../utils/dataStorage');
        const equipmentLogs = DataStorage.loadEquipmentLogs();
        const maintenanceStartLog = equipmentLogs
          .filter(log => (log.equipment_id || log.equipmentId) === equipment.id && log.action === 'maintenance-start')
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

        if (maintenanceStartLog) {
          setMaintenanceStartTime(new Date(maintenanceStartLog.timestamp));
          console.log('✅ Loaded maintenance start time from local storage:', maintenanceStartLog.timestamp);
        } else {
          // Fallback to current time if no log found
          console.warn('⚠️ No maintenance-start log found, using current time as fallback');
          setMaintenanceStartTime(new Date());
        }
      }
    } catch (error) {
      console.error('Error loading maintenance start time:', error);
      // Fallback to current time
      setMaintenanceStartTime(new Date());
    }
  };

  // Calculate maintenance duration
  const getMaintenanceDuration = () => {
    if (!maintenanceStartTime) {
      return 'Loading...';
    }
    const diff = currentTime.getTime() - maintenanceStartTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Get current location when repair location is selected
  const handleRepairLocationChange = async (location: 'site' | 'yard') => {
    setFormData({ ...formData, repair_location: location });
    setLocationError('');
    
    try {
      const locationResult = await CorrectiveMaintenanceService.getCurrentLocation();
      if (locationResult.success && locationResult.coordinates) {
        setFormData({
          ...formData,
          repair_location: location,
          geo_coordinates: locationResult.coordinates
        });
      } else {
        setLocationError('Could not get location automatically. Please ensure location services are enabled.');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Could not get location automatically.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setFormData({ ...formData, attachments: filesArray });
    }
  };

  const handleMaterialsChange = (materials: MaterialSelection[]) => {
    setFormData({ ...formData, materials_selected: materials });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!equipment) {
      setError('Equipment information is required');
      return;
    }

    if (!formData.issue_description.trim()) {
      setError('Issue description is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const currentUser = AuthManager.getCurrentUserSync();
      if (!currentUser) {
        setError('User not authenticated');
        return;
      }

      const result = await CorrectiveMaintenanceService.createMaintenanceRequest(
        equipment,
        formData,
        currentUser.id
      );

      if (result.success && result.data) {
        onSubmitted(result.data);
      } else {
        setError(result.error || 'Failed to create maintenance request');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsWorking = async () => {
    if (!equipment) {
      setError('Equipment information is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const currentUser = AuthManager.getCurrentUserSync();
      if (!currentUser) {
        setError('User not authenticated');
        return;
      }

      // Update equipment status to 'available' in Supabase
      const { error: updateError } = await supabase
        .from('equipment')
        .update({ 
          status: 'available', 
          operational_status: 'working',
          last_updated: new Date().toISOString()
        })
        .eq('id', equipment.id);

      if (updateError) {
        throw new Error(`Failed to update equipment status: ${updateError.message}`);
      }

      // Create equipment log entry for maintenance-end
      await logManager.createEquipmentLog(
        equipment,
        'maintenance-end',
        equipment.site || 'Unknown',
        'available',
        'Equipment marked as working from corrective maintenance form'
      );

      // Close the form and notify parent
      onClose();
      onSubmitted({ type: 'mark_as_working', equipment });
    } catch (error) {
      console.error('Error marking equipment as working:', error);
      setError(`Failed to mark equipment as working: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!equipment) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Equipment Not Found</h3>
            <p className="text-gray-600 mb-4">Equipment information is required to create a maintenance request.</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Corrective Maintenance Form</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Equipment Information (Read-only) */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-2 flex items-center">
            <Wrench className="w-4 h-4 mr-2" />
            Equipment Information
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Name:</strong> {equipment.name}</div>
            <div><strong>ID:</strong> {equipment.custom_equipment_id}</div>
            <div><strong>Type:</strong> {equipment.type}</div>
            <div><strong>Site:</strong> {equipment.site}</div>
          </div>
        </div>

        {/* Maintenance Timer */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-2 flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Maintenance Duration
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Started:</strong> {maintenanceStartTime ? maintenanceStartTime.toLocaleString() : 'Loading...'}
            </div>
            <div>
              <strong>Duration:</strong> {getMaintenanceDuration()}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Issue Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Issue Description *
            </label>
            <textarea
              value={formData.issue_description}
              onChange={(e) => setFormData({...formData, issue_description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Describe the issue in detail..."
              required
            />
          </div>

          {/* Priority Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority Level *
            </label>
            <div className="grid grid-cols-1 gap-3">
              {PRIORITY_OPTIONS.map(option => (
                <label key={option.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="priority"
                    value={option.value}
                    checked={formData.priority === option.value}
                    onChange={(e) => setFormData({...formData, priority: e.target.value as any})}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Repair Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Repair Location *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {REPAIR_LOCATION_OPTIONS.map(option => (
                <label key={option.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="repair_location"
                    value={option.value}
                    checked={formData.repair_location === option.value}
                    onChange={() => handleRepairLocationChange(option.value)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
            {formData.geo_coordinates && (
              <div className="mt-2 text-sm text-gray-600 flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                <strong>Location captured:</strong> {formData.geo_coordinates[0].toFixed(6)}, {formData.geo_coordinates[1].toFixed(6)}
              </div>
            )}
            {locationError && (
              <div className="mt-2 text-sm text-red-600">
                {locationError}
              </div>
            )}
          </div>

          {/* Material Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Required Materials
            </label>
            <MaterialSelectionWithQuantity
              selectedMaterials={formData.materials_selected || []}
              onMaterialsChange={handleMaterialsChange}
              disabled={isSubmitting}
            />
          </div>

          {/* File Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Upload className="w-4 h-4 mr-2" />
              Attachments
            </label>
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload photos or documents related to the issue
            </p>
            {formData.attachments.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">Selected files:</p>
                <ul className="text-xs text-gray-500">
                  {formData.attachments.map((file, index) => (
                    <li key={index}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleMarkAsWorking}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              disabled={isSubmitting}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark as Working
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Maintenance Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CorrectiveMaintenanceForm; 