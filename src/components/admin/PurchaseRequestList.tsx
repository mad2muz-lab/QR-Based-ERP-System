import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  Edit, 
  Trash2,
  Filter,
  Search,
  Calendar,
  DollarSign,
  User,
  Building
} from 'lucide-react';
import { PurchaseRequest } from '../../types';
import { PurchaseRequestService } from '../../utils/purchaseRequestService';

interface PurchaseRequestListProps {
  onClose?: () => void;
}

const PurchaseRequestList: React.FC<PurchaseRequestListProps> = ({ onClose }) => {
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PurchaseRequest['status'] | 'all'>('all');
  const [selectedPR, setSelectedPR] = useState<PurchaseRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadPurchaseRequests();
  }, []);

  const loadPurchaseRequests = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await PurchaseRequestService.getPurchaseRequests();
      if (result.success && result.data) {
        setPurchaseRequests(result.data);
      } else {
        setError(result.error || 'Failed to load purchase requests');
      }
    } catch (error) {
      console.error('Error loading purchase requests:', error);
      setError('Failed to load purchase requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (prId: string, newStatus: PurchaseRequest['status']) => {
    try {
      const result = await PurchaseRequestService.updatePurchaseRequestStatus(prId, newStatus);
      if (result.success) {
        await loadPurchaseRequests(); // Refresh the list
      } else {
        setError(result.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating PR status:', error);
      setError('Failed to update status');
    }
  };

  const handleDeletePR = async (prId: string) => {
    if (!confirm('Are you sure you want to delete this purchase request?')) {
      return;
    }

    try {
      const result = await PurchaseRequestService.deletePurchaseRequest(prId);
      if (result.success) {
        await loadPurchaseRequests(); // Refresh the list
      } else {
        setError(result.error || 'Failed to delete purchase request');
      }
    } catch (error) {
      console.error('Error deleting PR:', error);
      setError('Failed to delete purchase request');
    }
  };

  const filteredPRs = purchaseRequests.filter(pr => {
    const matchesSearch = pr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         pr.pr_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         pr.requested_by.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || pr.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: PurchaseRequest['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'submitted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'ordered': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'received': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'closed': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: PurchaseRequest['status']) => {
    switch (status) {
      case 'draft': return <Edit className="w-4 h-4" />;
      case 'submitted': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'ordered': return <Package className="w-4 h-4" />;
      case 'received': return <CheckCircle className="w-4 h-4" />;
      case 'closed': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2 text-gray-600">Loading purchase requests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Package className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Purchase Requests</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search PRs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as PurchaseRequest['status'] | 'all')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="ordered">Ordered</option>
          <option value="received">Received</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* PR List */}
      <div className="space-y-4">
        {filteredPRs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No purchase requests found</p>
          </div>
        ) : (
          filteredPRs.map((pr) => (
            <div key={pr.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{pr.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(pr.status)}`}>
                      {getStatusIcon(pr.status)}
                      <span className="ml-1">{pr.status}</span>
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Package className="w-4 h-4" />
                      <span>{pr.pr_number}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>{pr.requested_by}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4" />
                      <span>{pr.department}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4" />
                      <span>SAR {pr.total_estimated_cost.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span>Requested: {formatDate(pr.requested_date)}</span>
                      {pr.required_date && <span>Required: {formatDate(pr.required_date)}</span>}
                      {pr.items && <span>{pr.items.length} item(s)</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => {
                      setSelectedPR(pr);
                      setShowDetails(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  
                  {pr.status === 'draft' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(pr.id, 'submitted')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Submit"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePR(pr.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* PR Details Modal */}
      {showDetails && selectedPR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Purchase Request Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* PR Header Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">PR Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">PR Number:</span> {selectedPR.pr_number}</p>
                      <p><span className="font-medium">Title:</span> {selectedPR.title}</p>
                      <p><span className="font-medium">Status:</span> 
                        <span className={`ml-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedPR.status)}`}>
                          {selectedPR.status}
                        </span>
                      </p>
                      <p><span className="font-medium">Priority:</span> {selectedPR.priority}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Request Details</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Requested By:</span> {selectedPR.requested_by}</p>
                      <p><span className="font-medium">Department:</span> {selectedPR.department}</p>
                      <p><span className="font-medium">Site:</span> {selectedPR.site}</p>
                      <p><span className="font-medium">Total Cost:</span> SAR {selectedPR.total_estimated_cost.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedPR.description && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-sm text-gray-600">{selectedPR.description}</p>
                  </div>
                )}

                {/* Items */}
                {selectedPR.items && selectedPR.items.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Requested Items</h4>
                    <div className="space-y-2">
                      {selectedPR.items.map((item) => (
                        <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">{item.material_name}</div>
                              <div className="text-sm text-gray-500">{item.material_type}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-gray-900">
                                {item.quantity_required} {item.unit}
                              </div>
                              <div className="text-sm text-gray-500">
                                SAR {item.total_estimated_cost.toFixed(2)}
                              </div>
                            </div>
                          </div>
                          {item.specifications && (
                            <div className="mt-2 text-sm text-gray-600">
                              {item.specifications}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-900">Requested Date:</span>
                    <p className="text-gray-600">{formatDate(selectedPR.requested_date)}</p>
                  </div>
                  {selectedPR.required_date && (
                    <div>
                      <span className="font-medium text-gray-900">Required Date:</span>
                      <p className="text-gray-600">{formatDate(selectedPR.required_date)}</p>
                    </div>
                  )}
                  {selectedPR.approved_date && (
                    <div>
                      <span className="font-medium text-gray-900">Approved Date:</span>
                      <p className="text-gray-600">{formatDate(selectedPR.approved_date)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseRequestList; 