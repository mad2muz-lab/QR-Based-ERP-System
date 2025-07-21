import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Eye, 
  Truck, 
  Filter,
  Search,
  RefreshCw,
  TrendingUp,
  Calendar,
  MapPin,
  User,
  DollarSign,
  Database
} from 'lucide-react';
import { MaintenanceWorkflowService } from '../../utils/maintenanceWorkflowService';
import { DataStorage } from '../../utils/dataStorage';
import { MaintenanceMaterialRequest, MaintenanceMaterialRequestItem } from '../../types';
import MaintenanceDetailsModal from './MaintenanceDetailsModal';

interface InventoryMaintenanceRequestsProps {
  className?: string;
}

export default function InventoryMaintenanceRequests({ className = '' }: InventoryMaintenanceRequestsProps) {
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceMaterialRequest[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceMaterialRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [updating, setUpdating] = useState(false);
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [requests, materialsData, stats] = await Promise.all([
        MaintenanceWorkflowService.getInstance().getAllMaintenanceMaterialRequests(),
        Promise.resolve(DataStorage.loadMaterials()),
        MaintenanceWorkflowService.getInstance().getMaintenanceStatistics()
      ]);

      setMaintenanceRequests(requests);
      setMaterials(materialsData);
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading inventory maintenance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (request: MaintenanceMaterialRequest) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const handleRequestUpdated = async () => {
    setShowDetailsModal(false);
    await loadData(); // Refresh data
  };

  const handleIssueMaterials = async (request: MaintenanceMaterialRequest) => {
    try {
      setUpdating(true);
      
      const currentUser = await import('../../utils/authUtils').then(m => m.AuthManager.getCurrentUserSync());
      const issuedBy = currentUser?.name || currentUser?.username || 'Inventory Staff';

      // Get request items
      const requestItems = await MaintenanceWorkflowService.getInstance().getMaintenanceMaterialRequestItems(request.id!);
      
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
        await loadData(); // Refresh data
      } else {
        console.error('Failed to issue materials:', result.error);
      }
    } catch (error) {
      console.error('Error issuing materials:', error);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'awaiting_inventory': return <Package className="w-4 h-4" />;
      case 'pending_service': return <Truck className="w-4 h-4" />;
      case 'in_progress': return <AlertTriangle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <AlertTriangle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const filteredRequests = maintenanceRequests.filter(request => {
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || request.priority === filterPriority;
    const matchesSearch = searchTerm === '' || 
      request.equipment_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.maintenance_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.site.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const canIssueMaterials = (request: MaintenanceMaterialRequest) => {
    return request.status === 'awaiting_inventory';
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-green-600" />
              Inventory - Maintenance Requests
            </h1>
            <p className="text-gray-600 mt-1">
              Manage and issue materials for maintenance requests
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={updating}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {updating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Requests</p>
                <p className="text-2xl font-bold">{statistics.totalRequests || 0}</p>
              </div>
              <Package className="w-8 h-8 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Awaiting Inventory</p>
                <p className="text-2xl font-bold">{statistics.awaitingInventory || 0}</p>
              </div>
              <Clock className="w-8 h-8 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Pending Service</p>
                <p className="text-2xl font-bold">{statistics.pendingService || 0}</p>
              </div>
              <Truck className="w-8 h-8 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Value</p>
                <p className="text-2xl font-bold">${(statistics.totalEstimatedCost || 0).toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 opacity-80" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search equipment, maintenance type, or site..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="awaiting_inventory">Awaiting Inventory</option>
            <option value="pending_service">Pending Service</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Maintenance Requests Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Maintenance Material Requests</h2>
        </div>
        
        {filteredRequests.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No maintenance material requests found</p>
            <p className="text-sm text-gray-400 mt-1">
              {maintenanceRequests.length === 0 
                ? "Click 'Initialize Sample Data' to create test data, or create material requests from the maintenance dashboard"
                : "Requests will appear here when maintenance teams create material requests"
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Maintenance Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Site
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {request.equipment_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.equipment_type} • {request.equipment_model}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {request.maintenance_type}
                        </div>
                        <div className="text-sm text-gray-500">
                          Class {request.maintenance_class}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1">{request.status_display || request.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                        {request.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                        {request.site}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.requested_at ? new Date(request.requested_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDetails(request)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canIssueMaterials(request) && (
                          <button
                            onClick={() => handleIssueMaterials(request)}
                            disabled={updating}
                            className="text-green-600 hover:text-green-900 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Issue Materials"
                          >
                            <Truck className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showDetailsModal && selectedRequest && (
        <MaintenanceDetailsModal
          request={selectedRequest}
          onClose={() => setShowDetailsModal(false)}
          onUpdated={handleRequestUpdated}
        />
      )}
    </div>
  );
} 