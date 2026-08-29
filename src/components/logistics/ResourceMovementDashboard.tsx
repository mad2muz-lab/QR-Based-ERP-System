// Resource Movement Dashboard Component
// Unified system for managing fleet, equipment, employee, and material movement

import React, { useState, useEffect } from 'react';
import { Plus, Clock, CheckCircle, XCircle, AlertTriangle, Users, Wrench, Package, Truck, Bell, Filter, Search } from 'lucide-react';
import NewMovementModal from './NewMovementModal';
import { getMovementRequests, getMovementNotifications, updateMovementRequestStatus, createMovementExecution } from '../../utils/resourceMovementDataService';

interface MovementRequest {
  id?: string;
  reference_id?: string;
  request_type: 'fleet' | 'equipment' | 'employee' | 'material';
  entity_id: string;
  entity_name: string;
  entity_type: string;
  quantity: number;
  unit: string;
  location_from: string;
  location_to: string;
  requested_by: string;
  requested_at?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  estimated_duration?: number;
  estimated_cost?: number;
  actual_duration?: number;
  actual_cost?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface MovementNotification {
  id?: string;
  movement_request_id: string;
  notification_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const ResourceMovementDashboard: React.FC = () => {
  const [showNewMovementModal, setShowNewMovementModal] = useState(false);
  const [movementRequests, setMovementRequests] = useState<MovementRequest[]>([]);
  const [notifications, setNotifications] = useState<MovementNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [requests, notifs] = await Promise.all([
        getMovementRequests(),
        getMovementNotifications() // Will get current user from auth
      ]);
      setMovementRequests(requests);
      setNotifications(notifs);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'in_progress':
        return <AlertTriangle className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMovementTypeIcon = (type: string) => {
    switch (type) {
      case 'equipment':
        return <Wrench className="w-4 h-4" />;
      case 'crew':
        return <Users className="w-4 h-4" />;
      case 'material':
        return <Package className="w-4 h-4" />;
      case 'fleet':
        return <Truck className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const filteredRequests = movementRequests.filter(request => {
    const matchesFilter = filter === 'all' || request.status === filter;
    const matchesSearch = searchTerm === '' || 
      (request.reference_id?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      request.location_from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.location_to.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.entity_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: movementRequests.length,
            pending: movementRequests.filter(r => r.status === 'pending').length,
    approved: movementRequests.filter(r => r.status === 'approved').length,
    in_progress: movementRequests.filter(r => r.status === 'in_progress').length,
    completed: movementRequests.filter(r => r.status === 'completed').length,
    unread_notifications: notifications.filter(n => !n.is_read).length
  };

  const handleNewMovementSuccess = () => {
    loadData(); // Reload data after creating new movement
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const result = await updateMovementRequestStatus(requestId, 'approved', {
        notes: 'Approved by Logistics Manager'
      });

      if (result.success) {
        // Create execution record when approved
        const execution = {
          id: `EXEC-${Date.now()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
          request_id: requestId,
          execution_type: 'material' as const, // TODO: Get from request
          executed_by: 'current_user_id', // TODO: Get from auth
          status: 'in_progress' as const,
          notes: 'Execution started after approval'
        };

        await createMovementExecution(execution);
        loadData(); // Reload data
        alert('Request approved successfully! Execution record created.');
      } else {
        alert('Failed to approve request: ' + result.error);
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Error approving request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const reason = prompt('Please provide rejection reason:');
    if (!reason) return;

    try {
      const result = await updateMovementRequestStatus(requestId, 'cancelled', {
        notes: `Cancelled by Logistics Manager. Reason: ${reason}`
      });

      if (result.success) {
        loadData(); // Reload data
        alert('Request rejected successfully!');
      } else {
        alert('Failed to reject request: ' + result.error);
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Error rejecting request');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resource Movement Management</h1>
          <p className="text-gray-600">Manage equipment, crew, material, and fleet movements across sites</p>
        </div>
        <button
          onClick={() => setShowNewMovementModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Movement</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Approval</p>
                              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{stats.in_progress}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Notifications</p>
              <p className="text-2xl font-bold text-red-600">{stats.unread_notifications}</p>
            </div>
            <Bell className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
                            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2 flex-1">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by reference ID, location, or requester..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Movement Requests Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Movement Requests</h2>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading movement requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-6 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No movement requests found</p>
            <button
              onClick={() => setShowNewMovementModal(true)}
              className="mt-2 text-blue-600 hover:text-blue-700"
            >
              Create your first movement request
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requester
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
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
                      <div className="text-sm font-medium text-gray-900">{request.reference_id}</div>
                    </td>
                                         <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex items-center space-x-2">
                         {getMovementTypeIcon(request.request_type)}
                         <span className="text-sm text-gray-900 capitalize">{request.request_type}</span>
                       </div>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                       <div className="text-sm text-gray-900">
                         <div>{request.location_from}</div>
                         <div className="text-gray-500">→ {request.location_to}</div>
                       </div>
                     </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(request.priority)}`}>
                        {request.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(request.status)}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(request.status)}`}>
                          {request.status.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                                         <td className="px-6 py-4 whitespace-nowrap">
                       <div className="text-sm text-gray-900">{request.entity_name}</div>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                       <div className="text-sm text-gray-900">
                         {request.created_at ? new Date(request.created_at).toLocaleDateString() : 'N/A'}
                       </div>
                       <div className="text-xs text-gray-500">
                         {request.created_at ? new Date(request.created_at).toLocaleTimeString() : 'N/A'}
                       </div>
                     </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">
                        View
                      </button>
                                             {request.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleApproveRequest(request.id!)}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleRejectRequest(request.id!)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Notifications Panel */}
      {notifications.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Bell className="w-5 h-5 text-red-500" />
              <span>Recent Notifications</span>
            </h2>
          </div>
          <div className="p-4 space-y-3">
            {notifications.slice(0, 5).map((notification) => (
              <div key={notification.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <Bell className="w-4 h-4 text-blue-500 mt-1" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
                {!notification.is_read && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Movement Modal */}
      <NewMovementModal
        isOpen={showNewMovementModal}
        onClose={() => setShowNewMovementModal(false)}
        onSuccess={handleNewMovementSuccess}
      />
    </div>
  );
};

export default ResourceMovementDashboard; 