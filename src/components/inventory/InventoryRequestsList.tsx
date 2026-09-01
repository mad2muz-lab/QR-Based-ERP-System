import React, { useState, useEffect } from 'react';
import { Search, Filter, FileText, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { InventoryService } from '../../utils/inventoryService';
import { CMInventoryMaterialRequest, InventoryRequestFilter } from '../../types/inventory';
import { useNavigate } from 'react-router-dom';

const InventoryRequestsList: React.FC = () => {
  const [requests, setRequests] = useState<CMInventoryMaterialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<InventoryRequestFilter>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadRequests();
  }, [filters]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const result = await InventoryService.getInventoryMaterialRequests(filters);
      if (result.success && result.data) {
        setRequests(result.data);
      }
    } catch (error) {
      console.error('Error loading inventory requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    const newFilters: InventoryRequestFilter = {};
    if (searchTerm) newFilters.search = searchTerm;
    if (selectedStatus) newFilters.status = selectedStatus;
    if (selectedPriority) newFilters.priority = selectedPriority;
    if (selectedSite) newFilters.site = selectedSite;
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('');
    setSelectedPriority('');
    setSelectedSite('');
    setFilters({});
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
        return <FileText className="w-4 h-4" />;
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
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

  const handleRequestClick = (requestId: string) => {
    navigate(`/inventory/requests/${requestId}`);
  };

  // Get unique values for filters
  const requestStatuses = Array.from(new Set(requests.map(r => r.status))).sort();
  const requestPriorities = Array.from(new Set(requests.map(r => r.priority))).sort();
  const requestSites = Array.from(new Set(requests.map(r => r.site))).sort();

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700 flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </h3>
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {requestStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              {requestPriorities.map(priority => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
          </div>

          {/* Site Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site
            </label>
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Sites</option>
              {requestSites.map(site => (
                <option key={site} value={site}>{site}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={applyFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Material Requests ({requests.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No material requests found matching your criteria.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {requests.map((request) => (
              <div
                key={request.id}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleRequestClick(request.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <h4 className="text-lg font-medium text-gray-900">
                        {request.equipment_name}
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1">{request.status}</span>
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(request.priority)}`}>
                        {request.priority}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Site:</span> {request.site}
                      </div>
                      <div>
                        <span className="font-medium">Materials:</span> {request.materials_requested?.length || 0} items
                      </div>
                      <div>
                        <span className="font-medium">Total Cost:</span> ${request.total_estimated_cost?.toFixed(2) || '0.00'}
                      </div>
                    </div>

                    {request.inventory_notes && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {request.inventory_notes}
                      </div>
                    )}
                  </div>

                  <div className="text-right text-sm text-gray-500">
                    <div>Requested: {formatDate(request.requested_at)}</div>
                    {request.issued_at && (
                      <div>Issued: {formatDate(request.issued_at)}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryRequestsList; 