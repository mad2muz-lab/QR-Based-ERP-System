import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { InventoryService } from '../../utils/inventoryService';
import { CMInventoryMaterialRequest, MaterialRequestItem } from '../../types/inventory';
import { AuthManager } from '../../utils/authUtils';

const InventoryRequestDetail: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<CMInventoryMaterialRequest | null>(null);
  const [materialItems, setMaterialItems] = useState<MaterialRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [inventoryNotes, setInventoryNotes] = useState('');
  const [currentUser, setCurrentUser] = useState<string>('');

  useEffect(() => {
    if (requestId) {
      loadRequestDetails();
      getCurrentUser();
    }
  }, [requestId]);

  const loadRequestDetails = async () => {
    if (!requestId) return;
    
    setLoading(true);
    try {
      const requestResult = await InventoryService.getInventoryMaterialRequestById(requestId);
      if (requestResult.success && requestResult.data) {
        setRequest(requestResult.data);
      }

      const itemsResult = await InventoryService.getMaterialRequestItems(requestId);
      if (itemsResult.success && itemsResult.data) {
        setMaterialItems(itemsResult.data);
      }
    } catch (error) {
      console.error('Error loading request details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUser = async () => {
    try {
      const user = await AuthManager.getCurrentUser();
      if (user) {
        setCurrentUser(user.id);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const handleStatusUpdate = async () => {
    if (!requestId || !newStatus) return;

    setProcessing(true);
    try {
      const result = await InventoryService.updateInventoryMaterialRequestStatus(
        requestId,
        newStatus,
        newStatus === 'issued' ? currentUser : undefined,
        inventoryNotes
      );

      if (result.success) {
        setRequest(result.data || null);
        setNewStatus('');
        setInventoryNotes('');
        // Reload the page to show updated data
        window.location.reload();
      }
    } catch (error) {
      console.error('Error updating request status:', error);
    } finally {
      setProcessing(false);
    }
  };

  const updateItemQuantity = async (itemId: string, issuedQuantity: number) => {
    try {
      const result = await InventoryService.updateMaterialRequestItemQuantity(itemId, issuedQuantity);
      if (result.success) {
        setMaterialItems(prev => 
          prev.map(item => 
            item.id === itemId ? { ...item, issued_quantity: issuedQuantity } : item
          )
        );
      }
    } catch (error) {
      console.error('Error updating item quantity:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'reviewed':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'approved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'issued':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'reviewed':
        return <AlertTriangle className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'issued':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading request details...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Request Not Found</h2>
          <p className="text-gray-600 mb-4">The requested inventory material request could not be found.</p>
          <button
            onClick={() => navigate('/inventory')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Inventory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/inventory')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Material Request: {request.equipment_name}
                  </h1>
                  <p className="mt-1 text-sm text-gray-600">
                    Request ID: {request.id}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(request.status)}`}>
                  {getStatusIcon(request.status)}
                  <span className="ml-1">{request.status}</span>
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                  {request.priority}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Request Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Equipment Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Equipment Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Equipment Name</label>
                  <p className="mt-1 text-sm text-gray-900">{request.equipment_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Site</label>
                  <p className="mt-1 text-sm text-gray-900">{request.site}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Requested By</label>
                  <p className="mt-1 text-sm text-gray-900">{request.requested_by}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Requested At</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(request.requested_at)}</p>
                </div>
                {request.issued_by && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Issued By</label>
                    <p className="mt-1 text-sm text-gray-900">{request.issued_by}</p>
                  </div>
                )}
                {request.issued_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Issued At</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(request.issued_at)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Material Items */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Requested Materials ({materialItems.length})
              </h2>
              
              {materialItems.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No materials requested</p>
              ) : (
                <div className="space-y-4">
                  {materialItems.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900">{item.material_name}</h3>
                          <p className="text-sm text-gray-600">{item.material_type}</p>
                        </div>
                        <span className="text-sm text-gray-500">{item.unit}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Requested Quantity
                          </label>
                          <p className="text-sm text-gray-900">{item.requested_quantity}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Issued Quantity
                          </label>
                          {request.status === 'issued' ? (
                            <p className="text-sm text-gray-900">{item.issued_quantity}</p>
                          ) : (
                            <input
                              type="number"
                              min="0"
                              max={item.requested_quantity}
                              value={item.issued_quantity}
                              onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            />
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Quality Grade
                          </label>
                          <p className="text-sm text-gray-900 capitalize">{item.quality_grade}</p>
                        </div>
                      </div>
                      
                      {item.notes && (
                        <div className="mt-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                          <p className="text-sm text-gray-600">{item.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Panel */}
          <div className="space-y-6">
            {/* Status Update */}
            {request.status !== 'issued' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Update Status</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Status</option>
                      {request.status === 'pending' && (
                        <>
                          <option value="reviewed">Reviewed</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </>
                      )}
                      {request.status === 'reviewed' && (
                        <>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </>
                      )}
                      {request.status === 'approved' && (
                        <option value="issued">Issue Materials</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Inventory Notes
                    </label>
                    <textarea
                      value={inventoryNotes}
                      onChange={(e) => setInventoryNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Add any notes about this request..."
                    />
                  </div>

                  <button
                    onClick={handleStatusUpdate}
                    disabled={!newStatus || processing}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Updating...' : 'Update Status'}
                  </button>
                </div>
              </div>
            )}

            {/* Request Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Request Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Materials:</span>
                  <span className="text-sm font-medium text-gray-900">{materialItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Cost:</span>
                  <span className="text-sm font-medium text-gray-900">
                    ${request.total_estimated_cost?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Priority:</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">{request.priority}</span>
                </div>
              </div>

              {request.inventory_notes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Inventory Notes</label>
                  <p className="text-sm text-gray-600">{request.inventory_notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryRequestDetail; 