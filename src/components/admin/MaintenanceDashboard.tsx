import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  User,
  DollarSign,
  Settings,
  RefreshCw,
  Download,
  Upload,
  HardHat
} from 'lucide-react';
import { 
  Equipment, 
  EquipmentMaintenanceLog, 
  EquipmentMaintenanceSchedule,
  Notification 
} from '../../types';
import { EquipmentMaintenanceService } from '../../utils/equipmentMaintenanceService';
import { AuthManager } from '../../utils/authUtils';
import { fetchData } from '../../utils/dataProxy';
import { MaintenanceDataLoader } from '../../utils/maintenanceDataLoader';
import TechnicianMaintenanceForm from './TechnicianMaintenanceForm';
import ActivityTimer from '../common/ActivityTimer';
import TotalDurationDisplay from '../common/TotalDurationDisplay';

interface MaintenanceDashboardProps {
  onClose?: () => void;
}

type FilterStatus = 'all' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
type FilterType = 'all' | 'repair' | 'service';

const MaintenanceDashboard: React.FC<MaintenanceDashboardProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'schedules' | 'notifications'>('logs');
  const [maintenanceLogs, setMaintenanceLogs] = useState<EquipmentMaintenanceLog[]>([]);
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<EquipmentMaintenanceSchedule[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // User role and permissions
  const [userRole, setUserRole] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  // Modal states
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showTechnicianForm, setShowTechnicianForm] = useState(false);
  const [selectedMaintenanceLog, setSelectedMaintenanceLog] = useState<EquipmentMaintenanceLog | null>(null);
  const [completionForm, setCompletionForm] = useState({
    actual_duration_hours: 0,
    cost: 0,
    technician_notes: '',
    parts_used: ''
  });
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);

  useEffect(() => {
    loadData();
    checkUserPermissions();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const currentUser = AuthManager.getCurrentUserSync();
      if (!currentUser) {
        setError('User not authenticated');
        return;
      }

      // Load equipment data
      const equipmentData = await fetchData('equipment');
      setEquipment(equipmentData);

      // Load maintenance data using the new data loader
      console.log('Loading maintenance data using MaintenanceDataLoader...');
      const [logsResult, schedulesResult] = await Promise.all([
        MaintenanceDataLoader.loadMaintenanceLogs(),
        MaintenanceDataLoader.loadMaintenanceSchedules()
      ]);

      console.log('Maintenance logs result:', {
        success: logsResult.success,
        count: logsResult.data?.length || 0,
        source: logsResult.source,
        error: logsResult.error
      });

      console.log('Maintenance schedules result:', {
        success: schedulesResult.success,
        count: schedulesResult.data?.length || 0,
        source: schedulesResult.source,
        error: schedulesResult.error
      });

      // Set the data
      setMaintenanceLogs(logsResult.data || []);
      setMaintenanceSchedules(schedulesResult.data || []);

      // Load notifications if Supabase is available
      const useSupabase = await AuthManager.useSupabase();
      if (useSupabase) {
        try {
          const notificationsResult = await EquipmentMaintenanceService.getNotifications(currentUser.id);
          if (notificationsResult.success) {
            setNotifications(notificationsResult.data || []);
          }
        } catch (error) {
          console.error('Error loading notifications:', error);
        }
      }

      // Show any errors in the UI
      const allErrors = [logsResult.error, schedulesResult.error].filter(Boolean);
      if (allErrors.length > 0) {
        console.warn('Some data sources had errors:', allErrors);
      }

    } catch (error: any) {
      console.error('Error loading maintenance data:', error);
      setError('Failed to load maintenance data');
    } finally {
      setLoading(false);
    }
  };

  const checkUserPermissions = async () => {
    const currentUser = AuthManager.getCurrentUserSync();
    if (!currentUser) return;

    try {
      const role = await EquipmentMaintenanceService.getUserRole(currentUser.id);
      setUserRole(role);

      const canEditPermission = await EquipmentMaintenanceService.checkUserPermission(
        currentUser.id, 
        'maintenance_dashboard', 
        'edit'
      );
      setCanEdit(canEditPermission);

      const canDeletePermission = await EquipmentMaintenanceService.checkUserPermission(
        currentUser.id, 
        'maintenance_dashboard', 
        'delete'
      );
      setCanDelete(canDeletePermission);
    } catch (error) {
      console.error('Error checking user permissions:', error);
    }
  };

  const handleTechnicianFormSubmit = async (formData: any) => {
    if (!selectedMaintenanceLog) return;

    setLoading(true);
    setError('');

    try {
      // Update maintenance log with technician data
      const result = await EquipmentMaintenanceService.updateMaintenanceLog(
        selectedMaintenanceLog.id,
        {
          status: formData.status,
          actual_duration_hours: formData.actual_duration_hours,
          cost: formData.cost,
          technician_notes: formData.technician_notes,
          parts_used: formData.parts_used,
          completed_by: formData.completed_by,
          completion_date: formData.status === 'completed' ? new Date().toISOString() : undefined
        }
      );

      if (result.success) {
        setShowTechnicianForm(false);
        setSelectedMaintenanceLog(null);
        await loadData(); // Refresh data
      } else {
        setError(result.error || 'Failed to update maintenance');
      }
    } catch (error: any) {
      console.error('Error updating maintenance:', error);
      setError('Failed to update maintenance');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteMaintenance = async () => {
    if (!selectedMaintenanceLog) return;

    setLoading(true);
    setError('');

    try {
      const result = await EquipmentMaintenanceService.completeMaintenance(
        selectedMaintenanceLog.id,
        completionForm
      );

      if (result.success) {
        setShowCompletionModal(false);
        setSelectedMaintenanceLog(null);
        setCompletionForm({
          actual_duration_hours: 0,
          cost: 0,
          technician_notes: '',
          parts_used: ''
        });
        await loadData(); // Refresh data
      } else {
        setError(result.error || 'Failed to complete maintenance');
      }
    } catch (error: any) {
      console.error('Error completing maintenance:', error);
      setError('Failed to complete maintenance');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkNotificationRead = async (notificationId: string) => {
    try {
      await EquipmentMaintenanceService.markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getEquipmentName = (equipmentId: string) => {
    const eq = equipment.find(e => e.id === equipmentId);
    return eq ? eq.name : 'Unknown Equipment';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'repair': return 'bg-red-100 text-red-800 border-red-200';
      case 'service': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredLogs = maintenanceLogs.filter(log => {
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesType = typeFilter === 'all' || log.maintenance_type === typeFilter;
    const matchesSearch = searchQuery === '' || 
      getEquipmentName(log.equipment_id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesType && matchesSearch;
  });

  const filteredSchedules = maintenanceSchedules.filter(schedule => {
    const matchesType = typeFilter === 'all' || schedule.maintenance_type === typeFilter;
    const matchesSearch = searchQuery === '' || 
      getEquipmentName(schedule.equipment_id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesType && matchesSearch;
  });

  const unreadNotifications = notifications.filter(n => !n.is_read);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading maintenance data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Wrench className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Maintenance Dashboard</h2>
            <p className="text-gray-600">Manage equipment maintenance and schedules</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-800 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      {/* Debug Information */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setShowDebugInfo(!showDebugInfo)}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          {showDebugInfo ? 'Hide Debug Info' : 'Show Debug Info'}
        </button>
        <button
          onClick={loadData}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Refresh Data
        </button>
        <button
          onClick={async () => {
            const debug = await MaintenanceDataLoader.debugDataSources();
            setDebugData(debug);
            console.log('Debug data:', debug);
          }}
          className="text-sm text-green-600 hover:text-green-800"
        >
          Debug Data Sources
        </button>
      </div>

      {showDebugInfo && (
        <div className="p-4 bg-gray-100 border border-gray-200 rounded-lg mb-4">
          <h3 className="font-medium text-gray-900 mb-2">Debug Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Total Maintenance Logs:</strong> {maintenanceLogs.length}</p>
              <p><strong>Total Equipment:</strong> {equipment.length}</p>
              <p><strong>Filtered Logs:</strong> {filteredLogs.length}</p>
            </div>
            <div>
              <p><strong>Status Filter:</strong> {statusFilter}</p>
              <p><strong>Type Filter:</strong> {typeFilter}</p>
              <p><strong>Search Query:</strong> "{searchQuery}"</p>
            </div>
          </div>
          
          {debugData && (
            <div className="mt-4">
              <p className="font-medium text-gray-900 mb-2">Data Source Debug:</p>
              <div className="text-xs bg-white p-2 rounded border mb-2">
                <p><strong>Auth Status:</strong> {debugData.authStatus.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</p>
                <p><strong>Using Supabase:</strong> {debugData.authStatus.useSupabase ? 'Yes' : 'No'}</p>
                <p><strong>Maintenance Logs Sources:</strong> {debugData.maintenanceLogs.sources.join(', ') || 'None'}</p>
                <p><strong>Maintenance Logs Errors:</strong> {debugData.maintenanceLogs.errors.join(', ') || 'None'}</p>
                <p><strong>Equipment Data:</strong> {debugData.equipment.success ? `${debugData.equipment.data.length} items` : 'Failed'}</p>
              </div>
            </div>
          )}
          
          {maintenanceLogs.length > 0 && (
            <div className="mt-4">
              <p className="font-medium text-gray-900 mb-2">Recent Maintenance Logs:</p>
              <div className="max-h-40 overflow-y-auto">
                {maintenanceLogs.slice(0, 5).map((log, index) => (
                  <div key={log.id} className="text-xs bg-white p-2 rounded border mb-1">
                    <p><strong>ID:</strong> {log.id}</p>
                    <p><strong>Equipment ID:</strong> {log.equipment_id}</p>
                    <p><strong>Status:</strong> {log.status}</p>
                    <p><strong>Type:</strong> {log.maintenance_type}</p>
                    <p><strong>Description:</strong> {log.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'logs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Maintenance Logs ({filteredLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('schedules')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'schedules'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Schedules ({filteredSchedules.length})
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'notifications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Notifications ({unreadNotifications.length})
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search equipment or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as FilterType)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="repair">Repair</option>
            <option value="service">Service</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Wrench className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No maintenance logs found</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {getEquipmentName(log.equipment_id)}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(log.status)}`}>
                        {log.status.replace('_', ' ')}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(log.maintenance_type)}`}>
                        {log.maintenance_type}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{log.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Started: {new Date(log.start_date).toLocaleDateString()}</span>
                      {log.status === 'in_progress' && (
                        <>
                          <span>•</span>
                          <ActivityTimer 
                            startTime={log.start_date} 
                            variant="short" 
                            showIcon={true}
                          />
                        </>
                      )}
                      {log.status === 'completed' && log.completion_date && (
                        <>
                          <span>•</span>
                          <TotalDurationDisplay 
                            startTime={log.start_date}
                            endTime={log.completion_date}
                            variant="short" 
                            showIcon={true}
                          />
                        </>
                      )}
                      {log.completion_date && (
                        <span>Completed: {new Date(log.completion_date).toLocaleDateString()}</span>
                      )}
                      {(log.actual_duration_hours || 0) > 0 && (
                        <span>Duration: {log.actual_duration_hours}h</span>
                      )}
                      {(log.cost || 0) > 0 && (
                        <span>Cost: SAR {log.cost}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Technician Actions */}
                    {(log.status === 'scheduled' || log.status === 'in_progress') && canEdit && (
                      <button
                        onClick={() => {
                          setSelectedMaintenanceLog(log);
                          setShowTechnicianForm(true);
                        }}
                        className="flex items-center space-x-1 px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors"
                      >
                        <HardHat className="w-4 h-4" />
                        <span>{log.status === 'scheduled' ? 'Start Work' : 'Update Progress'}</span>
                      </button>
                    )}
                    
                    {/* Legacy Complete Button */}
                    {log.status === 'in_progress' && canEdit && (
                      <button
                        onClick={() => {
                          setSelectedMaintenanceLog(log);
                          setShowCompletionModal(true);
                        }}
                        className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Complete</span>
                      </button>
                    )}
                    
                    <button className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors">
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'schedules' && (
        <div className="space-y-4">
          {filteredSchedules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No maintenance schedules found</p>
            </div>
          ) : (
            filteredSchedules.map((schedule) => (
              <div key={schedule.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {getEquipmentName(schedule.equipment_id)}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(schedule.maintenance_type)}`}>
                        {schedule.maintenance_type}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        schedule.priority === 'critical' ? 'bg-red-100 text-red-800 border-red-200' :
                        schedule.priority === 'high' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                        schedule.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                        'bg-green-100 text-green-800 border-green-200'
                      }`}>
                        {schedule.priority}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{schedule.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Next: {new Date(schedule.next_maintenance_date).toLocaleDateString()}</span>
                      {schedule.last_maintenance_date && (
                        <span>Last: {new Date(schedule.last_maintenance_date).toLocaleDateString()}</span>
                      )}
                      {schedule.frequency_days && (
                        <span>Frequency: {schedule.frequency_days} days</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors">
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No notifications found</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div key={notification.id} className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
                notification.is_read ? 'border-gray-200' : 'border-blue-200 bg-blue-50'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                      {!notification.is_read && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{notification.message}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{new Date(notification.created_at).toLocaleString()}</span>
                      {notification.type && (
                        <span className="capitalize">{notification.type}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!notification.is_read && (
                      <button
                        onClick={() => handleMarkNotificationRead(notification.id)}
                        className="flex items-center space-x-1 px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Mark Read</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Completion Modal */}
      {showCompletionModal && selectedMaintenanceLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Maintenance</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Actual Duration (hours)
                  </label>
                  <input
                    type="number"
                    value={completionForm.actual_duration_hours}
                    onChange={(e) => setCompletionForm(prev => ({ ...prev, actual_duration_hours: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost (SAR)
                  </label>
                  <input
                    type="number"
                    value={completionForm.cost}
                    onChange={(e) => setCompletionForm(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parts Used
                  </label>
                  <input
                    type="text"
                    value={completionForm.parts_used}
                    onChange={(e) => setCompletionForm(prev => ({ ...prev, parts_used: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="List parts used..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Technician Notes
                  </label>
                  <textarea
                    value={completionForm.technician_notes}
                    onChange={(e) => setCompletionForm(prev => ({ ...prev, technician_notes: e.target.value }))}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add any additional notes..."
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowCompletionModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteMaintenance}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Completing...' : 'Complete Maintenance'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Technician Maintenance Form Modal */}
      {showTechnicianForm && selectedMaintenanceLog && (
        <TechnicianMaintenanceForm
          maintenanceLog={selectedMaintenanceLog}
          equipment={equipment.find(eq => eq.id === selectedMaintenanceLog.equipment_id) || {} as Equipment}
          isOpen={showTechnicianForm}
          onClose={() => {
            setShowTechnicianForm(false);
            setSelectedMaintenanceLog(null);
          }}
          onSubmit={handleTechnicianFormSubmit}
        />
      )}
    </div>
  );
};

export default MaintenanceDashboard; 