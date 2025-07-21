import React, { useState, useEffect } from 'react';
import { X, Package, CheckCircle, Clock, AlertTriangle, Wrench, MapPin, User, Calendar } from 'lucide-react';
import { MaintenanceWorkflowService } from '../../utils/maintenanceWorkflowService';
import { MaintenanceMaterialRequest, MaintenanceMaterialRequestItem, Equipment, EquipmentMaintenanceLog, ClassMaintenanceType } from '../../types';

interface MaintenanceDetailsModalProps {
  request: MaintenanceMaterialRequest;
  onClose: () => void;
  onUpdated: () => void;
}

export default function MaintenanceDetailsModal({
  request,
  onClose,
  onUpdated
}: MaintenanceDetailsModalProps) {
  const [requestItems, setRequestItems] = useState<MaintenanceMaterialRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string>('');
  const [requiredMaterials, setRequiredMaterials] = useState<ClassMaintenanceType[]>([]);
  const [showRequestMaterials, setShowRequestMaterials] = useState(false);
  const [creatingRequest, setCreatingRequest] = useState(false);

  // Helper: Check if material request exists (requestItems.length > 0)
  const hasMaterialRequest = requestItems.length > 0;

  // Helper: Show 'Request Materials' if status is 'pending' and no material request exists
  useEffect(() => {
    if (request.status === 'pending' && !hasMaterialRequest) {
      setShowRequestMaterials(true);
      fetchRequiredMaterials();
    } else {
      setShowRequestMaterials(false);
    }
    // eslint-disable-next-line
  }, [request.status, hasMaterialRequest, request.maintenance_class]);

  // Fetch required materials for the maintenance class
  const fetchRequiredMaterials = async () => {
    try {
      setLoading(true);
      const workflowService = MaintenanceWorkflowService.getInstance();
      const classMaterials = await workflowService.getMaterialsForMaintenanceClass(request.maintenance_class);
      setRequiredMaterials(classMaterials);
    } catch (error) {
      setError('Failed to load required materials');
    } finally {
      setLoading(false);
    }
  };

  // Handle creating material request
  const handleCreateMaterialRequest = async () => {
    try {
      setCreatingRequest(true);
      setError('');
      // Only use fields that exist on request, fallback to empty string for required Equipment fields
      const equipmentObj = {
        id: request.equipment_id || '',
        name: request.equipment_name || '',
        type: request.equipment_type || '',
        model: request.equipment_model || '',
        site: request.site || '',
        custom_equipment_id: '', // fallback, not available on request
        qrCode: '', // fallback, not available on request
        status: 'available' as 'available', // valid Equipment status
        operational_status: 'working' as 'working', // valid Equipment operational_status
        manufacturer: '', // fallback, not available on request
        serial_number: '', // fallback, not available on request
        purchase_date: '', // fallback, not available on request
        warranty_expiry: '', // fallback, not available on request
        location: '', // fallback, not available on request
        department: '', // fallback, not available on request
        createdAt: '', // fallback, not available on request
        lastUpdated: '', // fallback, not available on request
      };
      const workflowService = MaintenanceWorkflowService.getInstance();
      const result = await workflowService.createMaintenanceMaterialRequest(
        equipmentObj,
        request.maintenance_log_id || '',
        request.maintenance_class || '',
        request.maintenance_type || '',
        request.estimated_duration_hours || 0
      );
      if (result.success) {
        await loadRequestItems(); // Refresh to show new material request
        setShowRequestMaterials(false);
        onUpdated();
      } else {
        setError(result.error || 'Failed to create material request');
      }
    } catch (error) {
      setError('Failed to create material request');
    } finally {
      setCreatingRequest(false);
    }
  };

  useEffect(() => {
    loadRequestItems();
  }, [request.id]);

  const loadRequestItems = async () => {
    try {
      setLoading(true);
      const items = await MaintenanceWorkflowService.getInstance().getMaintenanceMaterialRequestItems(request.id!);
      setRequestItems(items);
    } catch (error) {
      console.error('Error loading request items:', error);
      setError('Failed to load request items');
    } finally {
      setLoading(false);
    }
  };

  const handleIssueMaterials = async () => {
    try {
      setUpdating(true);
      setError('');

      const currentUser = await import('../../utils/authUtils').then(m => m.AuthManager.getCurrentUserSync());
      const issuedBy = currentUser?.name || currentUser?.username || 'System';

      const result = await MaintenanceWorkflowService.getInstance().issueMaterials(
        request.id!,
        issuedBy,
        requestItems.map(item => ({
          itemId: item.id!,
          quantityIssued: item.quantity_requested,
          actualUnitCost: item.estimated_unit_cost
        }))
      );

      if (result.success) {
        onUpdated();
      } else {
        setError(result.error || 'Failed to issue materials');
      }
    } catch (error) {
      console.error('Error issuing materials:', error);
      setError('Failed to issue materials');
    } finally {
      setUpdating(false);
    }
  };

  const handleCompleteMaintenance = async () => {
    try {
      setUpdating(true);
      setError('');

      const currentUser = await import('../../utils/authUtils').then(m => m.AuthManager.getCurrentUserSync());
      const completedBy = currentUser?.name || currentUser?.username || 'System';

      const result = await MaintenanceWorkflowService.getInstance().completeMaintenance(
        request.id!,
        completedBy,
        request.estimated_duration_hours || 0,
        request.total_estimated_cost || 0
      );

      if (result.success) {
        onUpdated();
      } else {
        setError(result.error || 'Failed to complete maintenance');
      }
    } catch (error) {
      console.error('Error completing maintenance:', error);
      setError('Failed to complete maintenance');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'awaiting_inventory': return 'bg-orange-100 text-orange-800';
      case 'pending_service': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getItemStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'available': return 'bg-green-100 text-green-800';
      case 'issued': return 'bg-blue-100 text-blue-800';
      case 'unavailable': return 'bg-red-100 text-red-800';
      case 'pr_generated': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canIssueMaterials = request.status === 'awaiting_inventory' && 
    requestItems.every(item => item.status === 'available' || item.status === 'issued');

  const canCompleteMaintenance = request.status === 'pending_service';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Maintenance Request Details</h2>
            <p className="text-sm text-gray-600 mt-1">
              ID: {request.id} • {request.equipment_name}
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
          {/* Request Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Equipment Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Equipment Information
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">Equipment Name</p>
                  <p className="text-sm text-gray-900">{request.equipment_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Equipment Type</p>
                  <p className="text-sm text-gray-900">{request.equipment_type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Model</p>
                  <p className="text-sm text-gray-900">{request.equipment_model}</p>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{request.site}</span>
                </div>
              </div>
            </div>

            {/* Request Information */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Request Information
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">Maintenance Type</p>
                  <p className="text-sm text-gray-900">{request.maintenance_type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Maintenance Class</p>
                  <p className="text-sm text-gray-900">Class {request.maintenance_class}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                    {request.status_display || request.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Priority</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                    {request.priority}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Information */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Timeline
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Requested</p>
                <p className="text-sm text-gray-900">
                  {request.requested_at ? new Date(request.requested_at).toLocaleString() : 'N/A'}
                </p>
                <p className="text-xs text-gray-500">by {request.requested_by}</p>
              </div>
              {request.issued_at && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Materials Issued</p>
                  <p className="text-sm text-gray-900">
                    {new Date(request.issued_at).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">by {request.issued_by}</p>
                </div>
              )}
              {request.completed_at && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Completed</p>
                  <p className="text-sm text-gray-900">
                    {new Date(request.completed_at).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">by {request.completed_by}</p>
                </div>
              )}
            </div>
          </div>

          {/* Show required materials and request button if needed */}
          {showRequestMaterials && (
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Required Materials for Class {request.maintenance_class}</h3>
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-gray-600">Loading required materials...</span>
                </div>
              ) : requiredMaterials.length === 0 ? (
                <div className="text-center py-4">
                  <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No materials configured for this maintenance class</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requiredMaterials.map((material, index) => (
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
              <div className="flex items-center justify-end mt-4">
                <button
                  onClick={handleCreateMaterialRequest}
                  disabled={creatingRequest || loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {creatingRequest ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Requesting...</span>
                    </>
                  ) : (
                    <>
                      <Package className="w-4 h-4" />
                      <span>Request Materials</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Materials List */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Requested Materials</h3>
            </div>
            
            {loading ? (
              <div className="p-6 text-center">
                <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
                <p className="text-sm text-gray-500">Loading materials...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Material
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requestItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.material_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.material_type}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {item.quantity_requested} {item.uom}
                          </div>
                          {item.quantity_issued > 0 && (
                            <div className="text-sm text-gray-500">
                              Issued: {item.quantity_issued} {item.uom}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getItemStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.inventory_notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
              disabled={updating}
            >
              Close
            </button>
            
            {canIssueMaterials && (
              <button
                onClick={handleIssueMaterials}
                disabled={updating}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {updating ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Issuing...</span>
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4" />
                    <span>Issue Materials</span>
                  </>
                )}
              </button>
            )}

            {canCompleteMaintenance && (
              <button
                onClick={handleCompleteMaintenance}
                disabled={updating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {updating ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Completing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Complete Maintenance</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 