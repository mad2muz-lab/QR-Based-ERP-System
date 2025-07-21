import React, { useState, useEffect } from 'react';
import { X, Save, Package, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { MaintenanceWorkflowService } from '../../utils/maintenanceWorkflowService';
import { Equipment, EquipmentMaintenanceLog, ClassMaintenanceType } from '../../types';

interface MaintenanceMaterialRequestModalProps {
  equipment: Equipment;
  maintenanceLog: EquipmentMaintenanceLog;
  onClose: () => void;
  onCreated: () => void;
}

export default function MaintenanceMaterialRequestModal({
  equipment,
  maintenanceLog,
  onClose,
  onCreated
}: MaintenanceMaterialRequestModalProps) {
  const [maintenanceClass, setMaintenanceClass] = useState<'A' | 'B' | 'C'>('A');
  const [materials, setMaterials] = useState<ClassMaintenanceType[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    determineMaintenanceClass();
  }, [equipment]);

  const determineMaintenanceClass = async () => {
    try {
      setLoading(true);
      const workflowService = MaintenanceWorkflowService.getInstance();
      const classType = await workflowService.determineMaintenanceClass(equipment);
      setMaintenanceClass(classType);
      
      // Load materials for this class
      const classMaterials = await workflowService.getMaterialsForMaintenanceClass(classType);
      setMaterials(classMaterials);
    } catch (error) {
      console.error('Error determining maintenance class:', error);
      setError('Failed to determine maintenance class');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    try {
      setCreating(true);
      setError('');

      const workflowService = MaintenanceWorkflowService.getInstance();
      const result = await workflowService.createMaintenanceMaterialRequest(
        equipment,
        maintenanceLog.id,
        maintenanceClass,
        maintenanceLog.maintenance_type,
        maintenanceLog.estimated_duration_hours
      );

      if (result.success) {
        onCreated();
      } else {
        setError(result.error || 'Failed to create maintenance material request');
      }
    } catch (error) {
      console.error('Error creating maintenance material request:', error);
      setError('Failed to create maintenance material request');
    } finally {
      setCreating(false);
    }
  };

  const getClassDescription = (classType: 'A' | 'B' | 'C') => {
    switch (classType) {
      case 'A': return 'Basic Service - Light maintenance and checks';
      case 'B': return 'Standard Service - Regular maintenance and parts replacement';
      case 'C': return 'Major Service - Comprehensive maintenance and overhaul';
      default: return '';
    }
  };

  const getClassColor = (classType: 'A' | 'B' | 'C') => {
    switch (classType) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-yellow-100 text-yellow-800';
      case 'C': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Create Maintenance Material Request</h2>
            <p className="text-sm text-gray-600 mt-1">
              Equipment: {equipment.name} • {equipment.type}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Equipment Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Equipment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Equipment Name</p>
                <p className="text-sm text-gray-900">{equipment.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Type</p>
                <p className="text-sm text-gray-900">{equipment.type}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Model</p>
                <p className="text-sm text-gray-900">{equipment.model}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Site</p>
                <p className="text-sm text-gray-900">{equipment.site}</p>
              </div>
            </div>
          </div>

          {/* Maintenance Information */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Maintenance Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Maintenance Type</p>
                <p className="text-sm text-gray-900">{maintenanceLog.maintenance_type}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Description</p>
                <p className="text-sm text-gray-900">{maintenanceLog.description || 'No description'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Estimated Duration</p>
                <p className="text-sm text-gray-900">
                  {maintenanceLog.estimated_duration_hours || 'Not specified'} hours
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Start Date</p>
                <p className="text-sm text-gray-900">
                  {new Date(maintenanceLog.start_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Maintenance Class Selection */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Maintenance Class</h3>
            {loading ? (
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 animate-spin" />
                <span className="text-sm text-gray-600">Determining maintenance class...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getClassColor(maintenanceClass)}`}>
                    Class {maintenanceClass}
                  </span>
                  <span className="text-sm text-gray-600">{getClassDescription(maintenanceClass)}</span>
                </div>
                
                {/* Class Selection Buttons */}
                <div className="flex space-x-2">
                  {(['A', 'B', 'C'] as const).map((classType) => (
                    <button
                      key={classType}
                      onClick={() => setMaintenanceClass(classType)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        maintenanceClass === classType
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Class {classType}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Materials List */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Required Materials</h3>
            {materials.length === 0 ? (
              <div className="text-center py-4">
                <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No materials configured for this maintenance class</p>
              </div>
            ) : (
              <div className="space-y-3">
                {materials.map((material, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{material.spare_part}</p>
                      <p className="text-xs text-gray-500">{material.maintenance_type}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {material.estimated_quantity} {material.uom}
                        </p>
                        <p className="text-xs text-gray-500">Required</p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={creating}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateRequest}
              disabled={creating || loading || materials.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {creating ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Create Material Request</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 