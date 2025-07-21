import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Package, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Eye, 
  X,
  RefreshCw,
  TrendingUp,
  Calendar,
  MapPin,
  User,
  DollarSign
} from 'lucide-react';
import { MaintenanceWorkflowService } from '../../utils/maintenanceWorkflowService';
import { MaintenanceMaterialRequest } from '../../types';
import MaintenanceDetailsModal from './MaintenanceDetailsModal';

interface MaintenanceNotificationsProps {
  className?: string;
  maxNotifications?: number;
}

export default function MaintenanceNotifications({ 
  className = '', 
  maxNotifications = 5 
}: MaintenanceNotificationsProps) {
  const [notifications, setNotifications] = useState<MaintenanceMaterialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceMaterialRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadNotifications();
    // Set up interval to refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const requests = await MaintenanceWorkflowService.getInstance().getAllMaintenanceMaterialRequests();
      
      // Filter for notifications (pending, awaiting inventory, urgent priority)
      const notificationRequests = requests.filter(request => 
        request.status === 'pending' || 
        request.status === 'awaiting_inventory' ||
        request.priority === 'urgent' ||
        request.priority === 'high'
      );

      // Sort by priority and date
      const sortedNotifications = notificationRequests.sort((a, b) => {
        // Priority order: urgent > high > medium > low
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        // Then sort by date (newest first)
        const aDate = new Date(a.requested_at || 0).getTime();
        const bDate = new Date(b.requested_at || 0).getTime();
        return bDate - aDate;
      });

      setNotifications(sortedNotifications);
    } catch (error) {
      console.error('Error loading maintenance notifications:', error);
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
    await loadNotifications(); // Refresh notifications
  };

  const getNotificationIcon = (request: MaintenanceMaterialRequest) => {
    if (request.priority === 'urgent') {
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
    if (request.priority === 'high') {
      return <AlertTriangle className="w-5 h-5 text-orange-500" />;
    }
    if (request.status === 'awaiting_inventory') {
      return <Package className="w-5 h-5 text-blue-500" />;
    }
    return <Clock className="w-5 h-5 text-yellow-500" />;
  };

  const getNotificationColor = (request: MaintenanceMaterialRequest) => {
    if (request.priority === 'urgent') {
      return 'bg-red-50 border-red-200 hover:bg-red-100';
    }
    if (request.priority === 'high') {
      return 'bg-orange-50 border-orange-200 hover:bg-orange-100';
    }
    if (request.status === 'awaiting_inventory') {
      return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
    }
    return 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100';
  };

  const getNotificationTitle = (request: MaintenanceMaterialRequest) => {
    if (request.priority === 'urgent') {
      return 'Urgent Maintenance Request';
    }
    if (request.priority === 'high') {
      return 'High Priority Maintenance Request';
    }
    if (request.status === 'awaiting_inventory') {
      return 'Materials Awaiting Inventory';
    }
    return 'Maintenance Request Pending';
  };

  const getNotificationMessage = (request: MaintenanceMaterialRequest) => {
    return `${request.equipment_name} - ${request.maintenance_type} (Class ${request.maintenance_class})`;
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const displayedNotifications = expanded ? notifications : notifications.slice(0, maxNotifications);
  const hasMoreNotifications = notifications.length > maxNotifications;

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Maintenance Notifications</h3>
          </div>
          <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Maintenance Notifications</h3>
          {notifications.length > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {notifications.length}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadNotifications}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh notifications"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center">
            <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No maintenance notifications</p>
            <p className="text-gray-400 text-xs mt-1">All maintenance requests are up to date</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {displayedNotifications.map((request) => (
              <div
                key={request.id}
                className={`p-4 cursor-pointer transition-colors ${getNotificationColor(request)}`}
                onClick={() => handleViewDetails(request)}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(request)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900">
                        {getNotificationTitle(request)}
                      </p>
                      <span className="text-xs text-gray-500">
                        {request.requested_at ? getTimeAgo(request.requested_at) : 'N/A'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      {getNotificationMessage(request)}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{request.site}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>{request.requested_by}</span>
                      </div>
                      {request.total_estimated_cost && (
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-3 h-3" />
                          <span>SAR {request.total_estimated_cost.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        request.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        request.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {request.priority}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'awaiting_inventory' ? 'bg-orange-100 text-orange-800' :
                        request.status === 'pending_service' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {request.status_display || request.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Eye className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Show More/Less Button */}
      {hasMoreNotifications && (
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            {expanded ? 'Show Less' : `Show ${notifications.length - maxNotifications} More`}
          </button>
        </div>
      )}

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