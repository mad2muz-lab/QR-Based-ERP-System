import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar, 
  Wrench, 
  TrendingUp, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Play,
  Eye,
  Filter,
  Search
} from 'lucide-react';
import { DataStorage } from '../../utils/dataStorage';
import { PreventiveMaintenanceService } from '../../utils/preventiveMaintenanceService';
import { Equipment, EquipmentMaintenanceLog } from '../../types';
import MaintenanceDetailsModal from './MaintenanceDetailsModal';
import ActivityTimer from '../common/ActivityTimer';
import TotalDurationDisplay from '../common/TotalDurationDisplay';

interface EnhancedMaintenanceDashboardProps {
  isStandalone?: boolean;
}

const EnhancedMaintenanceDashboard: React.FC<EnhancedMaintenanceDashboardProps> = ({ isStandalone = false }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'schedules' | 'equipment' | 'statistics'>('overview');
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<any[]>([]);
  const [upcomingSchedules, setUpcomingSchedules] = useState<any[]>([]);
  const [overdueSchedules, setOverdueSchedules] = useState<any[]>([]);
  const [equipmentUsage, setEquipmentUsage] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Load equipment data
      const equipmentData = DataStorage.loadEquipment();
      setEquipment(equipmentData);

      // Load maintenance schedules
      const service = PreventiveMaintenanceService.getInstance();
      const schedules = await service.generateMaintenanceSchedules();
      setMaintenanceSchedules(schedules);

      // Get upcoming and overdue schedules
      const upcoming = await service.getUpcomingMaintenanceSchedules(30);
      const overdue = await service.getOverdueMaintenanceSchedules();
      setUpcomingSchedules(upcoming);
      setOverdueSchedules(overdue);

      // Calculate equipment usage
      const usageData = await Promise.all(
        equipmentData.map(async (eq) => {
          const usage = await service.calculateEquipmentUsageHours(eq.id);
          const allUsageData = await service.getAllEquipmentUsageData();
          const eqUsageData = allUsageData.find(u => u.equipment_id === eq.id);
          return {
            ...eq,
            usage_hours: usage,
            next_maintenance_class: eqUsageData?.next_maintenance_class || null
          };
        })
      );
      setEquipmentUsage(usageData);

    } catch (error) {
      console.error('Error loading maintenance dashboard data:', error);
      setError('Failed to load maintenance data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSchedules = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Generate schedules for all equipment
      const service = PreventiveMaintenanceService.getInstance();
      await service.generateMaintenanceSchedules();
      
      // Reload data
      await loadData();
      setSuccess('Maintenance schedules generated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error generating schedules:', error);
      setError('Failed to generate maintenance schedules');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartMaintenance = (schedule: any) => {
    setSelectedRequest(schedule);
    setShowDetailsModal(true);
  };

  const handleDetailsModalUpdated = async () => {
    setShowDetailsModal(false);
    await loadData();
    setNotification({ type: 'success', message: 'Maintenance updated successfully.' });
    setTimeout(() => setNotification(null), 3000);
  };

  const getFilteredSchedules = () => {
    let filtered = [...upcomingSchedules, ...overdueSchedules];
    
    if (searchTerm) {
      filtered = filtered.filter(schedule => 
        schedule.equipment_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.equipment_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(schedule => schedule.status === statusFilter);
    }
    
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(schedule => schedule.priority === priorityFilter);
    }
    
    return filtered;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading maintenance dashboard...</p>
        </div>
      </div>
    );
  }

  const totalEquipment = equipment.length;
  const scheduledMaintenance = upcomingSchedules.length;
  const overdueMaintenance = overdueSchedules.length;
  const completedThisMonth = maintenanceSchedules.filter(s => 
    s.status === 'completed' && 
    new Date(s.completed_at).getMonth() === new Date().getMonth()
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      {isStandalone && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Wrench className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-green-600">Maintenance Dashboard</h1>
                <p className="text-gray-600">View and manage scheduled maintenance, track equipment usage, and execute maintenance tasks.</p>
              </div>
            </div>
            <button
              onClick={handleGenerateSchedules}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Generate Schedules</span>
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Wrench className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Equipment</p>
              <p className="text-2xl font-bold text-blue-600">{totalEquipment}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Scheduled Maintenance</p>
              <p className="text-2xl font-bold text-yellow-600">{scheduledMaintenance}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue Maintenance</p>
              <p className="text-2xl font-bold text-red-600">{overdueMaintenance}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed This Month</p>
              <p className="text-2xl font-bold text-green-600">{completedThisMonth}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'schedules', label: 'Schedules', icon: Calendar },
              { id: 'equipment', label: 'Equipment', icon: Wrench },
              { id: 'statistics', label: 'Statistics', icon: TrendingUp }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Notifications */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 text-red-800 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-100 text-green-800 border border-green-200 rounded-lg flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>{success}</span>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Maintenance */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Maintenance</h3>
                  <div className="space-y-3">
                    {upcomingSchedules.slice(0, 5).map((schedule) => (
                      <div key={schedule.id} className="bg-white p-4 rounded-lg border">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{schedule.equipment_name}</h4>
                            <p className="text-sm text-gray-600">{schedule.maintenance_class} Maintenance</p>
                            <p className="text-xs text-gray-500">Due: {new Date(schedule.due_date).toLocaleDateString()}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(schedule.priority)}`}>
                            {schedule.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                    {upcomingSchedules.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No upcoming maintenance scheduled</p>
                    )}
                  </div>
                </div>

                {/* Overdue Maintenance */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Overdue Maintenance</h3>
                  <div className="space-y-3">
                    {overdueSchedules.slice(0, 5).map((schedule) => (
                      <div key={schedule.id} className="bg-white p-4 rounded-lg border border-red-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{schedule.equipment_name}</h4>
                            <p className="text-sm text-gray-600">{schedule.maintenance_class} Maintenance</p>
                            <p className="text-xs text-red-600">Overdue since: {new Date(schedule.due_date).toLocaleDateString()}</p>
                          </div>
                          <button
                            onClick={() => handleStartMaintenance(schedule)}
                            className="px-3 py-1 bg-red-100 text-red-800 text-xs rounded-md hover:bg-red-200"
                          >
                            Start Now
                          </button>
                        </div>
                      </div>
                    ))}
                    {overdueSchedules.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No overdue maintenance</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'schedules' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search equipment..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
                
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setPriorityFilter('all');
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center space-x-2"
                >
                  <Filter className="w-4 h-4" />
                  <span>Clear</span>
                </button>
              </div>

              {/* Schedules Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Maintenance Class</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getFilteredSchedules().map((schedule) => (
                      <tr key={schedule.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{schedule.equipment_name}</div>
                            <div className="text-sm text-gray-500">{schedule.equipment_type}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Class {schedule.maintenance_class}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(schedule.due_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(schedule.status)}`}>
                              {schedule.status}
                            </span>
                            {schedule.status === 'in_progress' && schedule.start_date && (
                              <ActivityTimer 
                                startTime={schedule.start_date} 
                                variant="compact" 
                                showIcon={false}
                              />
                            )}
                            {schedule.status === 'completed' && schedule.start_date && schedule.completion_date && (
                              <TotalDurationDisplay 
                                startTime={schedule.start_date}
                                endTime={schedule.completion_date}
                                variant="compact" 
                                showIcon={false}
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(schedule.priority)}`}>
                            {schedule.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleStartMaintenance(schedule)}
                              className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                            >
                              <Play className="w-4 h-4" />
                              <span>Start</span>
                            </button>
                            <button
                              onClick={() => {/* View details */}}
                              className="text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                            >
                              <Eye className="w-4 h-4" />
                              <span>View</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {getFilteredSchedules().length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No maintenance schedules found matching the current filters.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'equipment' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage Hours</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Maintenance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {equipmentUsage.map((eq) => (
                      <tr key={eq.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{eq.name}</div>
                            <div className="text-sm text-gray-500">ID: {eq.custom_equipment_id}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{eq.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {eq.usage_hours}h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {eq.next_maintenance_class ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Class {eq.next_maintenance_class}
                            </span>
                          ) : (
                            <span className="text-gray-400">No maintenance due</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(eq.status)}`}>
                            {eq.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'statistics' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Usage Statistics */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Usage Statistics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Usage Hours</span>
                    <span className="font-semibold">{equipmentUsage.reduce((sum, eq) => sum + eq.usage_hours, 0)}h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Average Usage Hours</span>
                    <span className="font-semibold">
                      {equipmentUsage.length > 0 
                        ? Math.round(equipmentUsage.reduce((sum, eq) => sum + eq.usage_hours, 0) / equipmentUsage.length)
                        : 0}h
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Equipment</span>
                    <span className="font-semibold">{totalEquipment}</span>
                  </div>
                </div>
              </div>

              {/* Maintenance Statistics */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Maintenance Statistics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Scheduled Maintenance</span>
                    <span className="font-semibold text-yellow-600">{scheduledMaintenance}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Overdue Maintenance</span>
                    <span className="font-semibold text-red-600">{overdueMaintenance}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Completed This Month</span>
                    <span className="font-semibold text-green-600">{completedThisMonth}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preventive Service Modal (replaced with MaintenanceDetailsModal) */}
      {showDetailsModal && selectedRequest && (
        <MaintenanceDetailsModal
          request={selectedRequest}
          onClose={() => setShowDetailsModal(false)}
          onUpdated={handleDetailsModalUpdated}
        />
      )}
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded shadow-lg text-white ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default EnhancedMaintenanceDashboard; 