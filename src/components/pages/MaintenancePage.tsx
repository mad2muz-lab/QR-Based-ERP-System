import React, { useState, useEffect } from 'react';
import { MaintenanceDataLoader } from '../../utils/maintenanceDataLoader';
import { AuthManager } from '../../utils/authUtils';
import { DataStorage } from '../../utils/dataStorage';
import { Equipment, EquipmentMaintenanceLog, EquipmentMaintenanceSchedule } from '../../types';
import { EquipmentMaintenanceService } from '../../utils/equipmentMaintenanceService';
import { MaintenanceLogisticsIntegration } from '../../utils/maintenanceLogisticsIntegration';
import { RefreshCw, AlertCircle, CheckCircle, Database, Wrench, Clock, Search, Filter, Edit, X, CheckSquare, Square, Eye, BarChart3, Calendar, TrendingUp, Plus, Settings, Users, FileText, AlertTriangle } from 'lucide-react';
import ActivityTimer from '../common/ActivityTimer';
import TotalDurationDisplay from '../common/TotalDurationDisplay';
import { getPreventiveMaintenanceLogs } from '../../utils/supabaseDataService';
import { supabase } from '../../utils/supabaseClient';
import PMDashboard from '../maintenance/PMDashboard';
import PMConfigurationManager from '../maintenance/PMConfigurationManager';
import PMWorkflowManager from '../maintenance/PMWorkflowManager';
import PMEnrollmentManager from '../maintenance/PMEnrollmentManager';

// Maintenance Action Modal Component
interface MaintenanceActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  maintenanceLog: EquipmentMaintenanceLog | null;
  equipment: Equipment | null;
  onAction: (action: 'complete' | 'cancel' | 'edit' | 'status_update', data?: any) => Promise<void>;
}

const MaintenanceActionModal: React.FC<MaintenanceActionModalProps> = ({
  isOpen,
  onClose,
  maintenanceLog,
  equipment,
  onAction
}) => {
  const [action, setAction] = useState<'complete' | 'cancel' | 'edit'>('complete');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    actual_duration_hours: '',
    cost: '',
    technician_notes: '',
    parts_used: '',
    description: maintenanceLog?.description || ''
  });

  useEffect(() => {
    if (maintenanceLog) {
      setFormData({
        actual_duration_hours: maintenanceLog.actual_duration_hours?.toString() || '',
        cost: maintenanceLog.cost?.toString() || '',
        technician_notes: maintenanceLog.technician_notes || '',
        parts_used: maintenanceLog.parts_used || '',
        description: maintenanceLog.description || ''
      });
    }
  }, [maintenanceLog]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onAction(action, formData);
      onClose();
    } catch (error) {
      console.error('Error performing maintenance action:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Maintenance Action</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Action Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="complete"
                  checked={action === 'complete'}
                  onChange={(e) => setAction(e.target.value as 'complete' | 'cancel' | 'edit')}
                  className="mr-2"
                />
                Complete
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="cancel"
                  checked={action === 'cancel'}
                  onChange={(e) => setAction(e.target.value as 'complete' | 'cancel' | 'edit')}
                  className="mr-2"
                />
                Cancel
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="edit"
                  checked={action === 'edit'}
                  onChange={(e) => setAction(e.target.value as 'complete' | 'cancel' | 'edit')}
                  className="mr-2"
                />
                Edit
              </label>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Actual Duration (hours)</label>
              <input
                type="number"
                value={formData.actual_duration_hours}
                onChange={(e) => setFormData({ ...formData, actual_duration_hours: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cost</label>
              <input
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Technician Notes</label>
            <textarea
              value={formData.technician_notes}
              onChange={(e) => setFormData({ ...formData, technician_notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter technician notes..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Parts Used</label>
            <input
              type="text"
              value={formData.parts_used}
              onChange={(e) => setFormData({ ...formData, parts_used: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="List parts used..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter maintenance description..."
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            <span>{loading ? 'Processing...' : 'Submit'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const MaintenancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('corrective');
  const [pmSubTab, setPmSubTab] = useState<string>('overview');
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<EquipmentMaintenanceLog[]>([]);
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<EquipmentMaintenanceSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [maintenanceModal, setMaintenanceModal] = useState<{
    isOpen: boolean;
    maintenanceLog: EquipmentMaintenanceLog | null;
    equipment: Equipment | null;
  }>({
    isOpen: false,
    maintenanceLog: null,
    equipment: null
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      // Load maintenance logs from your existing PM system
      const logsData = await MaintenanceDataLoader.loadMaintenanceLogs(force);
      setEquipment(DataStorage.loadEquipment());
      setMaintenanceLogs(logsData.data || []);
      
      // Load PM configurations directly from preventive_maintenance_configs table
      // This table already contains all the schedules by equipment type with hours, checklist and spare parts
      try {
        if (!supabase) {
          console.warn('Supabase client not available');
          setMaintenanceSchedules([]);
        } else {
          const { data: pmConfigs, error: pmError } = await supabase
            .from('preventive_maintenance_configs')
            .select('*')
            .eq('is_active', true);
          
          if (pmError) {
            console.warn('Could not fetch PM configs:', pmError);
            setMaintenanceSchedules([]);
          } else {
            // Use PM configs directly as they already contain all the schedule information
            // Convert to EquipmentMaintenanceSchedule format for compatibility
            const schedules = pmConfigs?.map(config => ({
              id: config.id,
              equipment_id: config.equipment_type,
              schedule_type: 'preventive' as const,
              maintenance_type: 'service' as const,
              maintenance_class: config.maintenance_class as 'A' | 'B' | 'C',
              next_maintenance_date: new Date().toISOString(), // Would need calculation based on last PM date
              priority: 'medium' as const,
              description: `${config.equipment_type} PM Schedule - Class A: ${config.class_a_hours}h, Class B: ${config.class_b_hours}h, Class C: ${config.class_c_hours}h`,
              is_active: config.is_active,
              created_at: config.created_at,
              updated_at: config.updated_at
            })) || [];
            setMaintenanceSchedules(schedules);
          }
        }
      } catch (scheduleError) {
        console.warn('Could not load maintenance schedules:', scheduleError);
        setMaintenanceSchedules([]);
      }
    } catch (err) {
      console.error('Error loading maintenance data:', err);
      setError('Failed to load maintenance data');
    } finally {
      setLoading(false);
    }
  };

  const handleMaintenanceAction = async (action: 'complete' | 'cancel' | 'edit' | 'status_update', data?: any) => {
    if (!maintenanceModal.maintenanceLog) return;

    try {
      await EquipmentMaintenanceService.updateMaintenanceLog(maintenanceModal.maintenanceLog.id, {
        status: action === 'complete' ? 'completed' : action === 'cancel' ? 'cancelled' : 'in_progress',
        actual_duration_hours: data?.actual_duration_hours ? parseFloat(data.actual_duration_hours) : undefined,
        cost: data?.cost ? parseFloat(data.cost) : undefined,
        technician_notes: data?.technician_notes,
        parts_used: data?.parts_used,
        description: data?.description,
        completed_date: action === 'complete' ? new Date().toISOString() : undefined
      });

      // Refresh data
        await loadData(true);
    } catch (error) {
      console.error('Error updating maintenance log:', error);
      throw error;
    }
  };

  const openMaintenanceModal = (maintenanceLog: EquipmentMaintenanceLog) => {
    const equipmentItem = equipment.find(eq => eq.id === maintenanceLog.equipment_id);
    setMaintenanceModal({
      isOpen: true,
      maintenanceLog,
      equipment: equipmentItem || null
    });
  };

  const closeMaintenanceModal = () => {
    setMaintenanceModal({
      isOpen: false,
      maintenanceLog: null,
      equipment: null
    });
  };

  const handleForceRefresh = async () => {
    await loadData(true);
  };

  const getFilteredAndEnrichedData = () => {
    let filtered = maintenanceLogs;

    // Filter by search term
     if (searchTerm) {
      filtered = filtered.filter(log => {
        const equipmentItem = equipment.find(eq => eq.id === log.equipment_id);
        return equipmentItem?.equipment_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               log.technician_notes?.toLowerCase().includes(searchTerm.toLowerCase());
       });
     }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(log => log.status === filterStatus);
    }

    // Filter by month
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      filtered = filtered.filter(log => {
        const logDate = new Date(log.start_date);
        return logDate.getFullYear() === parseInt(year) && logDate.getMonth() === parseInt(month) - 1;
      });
    }

    // Enrich with equipment data
    return filtered.map(log => ({
      ...log,
      equipment: equipment.find(eq => eq.id === log.equipment_id)
    }));
  };

  const getStats = (logs: EquipmentMaintenanceLog[], schedules: EquipmentMaintenanceSchedule[]) => ({
    totalEquipment: equipment.length,
    totalLogs: logs.length,
    totalSchedules: schedules.length,
    completedLogs: logs.filter(log => log.status === 'completed').length,
    pendingLogs: logs.filter(log => log.status === 'scheduled' || log.status === 'in_progress').length,
    equipmentUnderMaintenance: equipment.filter(eq => eq.status === 'maintenance').length
  });

  const getMonthOptions = () => {
    const months = new Set<string>();
    maintenanceLogs.forEach(log => {
      const date = new Date(log.start_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
    });
    return Array.from(months).sort().reverse();
  };

  const getMonthLabel = (date: Date) => date.toLocaleString('default', { month: 'short', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading maintenance data...</p>
        </div>
      </div>
    );
  }

  const stats = getStats(maintenanceLogs, maintenanceSchedules);
  const filteredData = getFilteredAndEnrichedData();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Maintenance Department</h1>
            <p className="text-gray-600">Comprehensive view of equipment maintenance, schedules, and activity</p>
          </div>
          <button
            onClick={handleForceRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 p-1 bg-gray-50 rounded-lg overflow-x-auto">
          <button
            onClick={() => setActiveTab('corrective')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'corrective'
                ? 'bg-blue-800 text-white shadow-lg'
                : 'text-gray-600 hover:text-blue-800 hover:bg-blue-50'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Corrective Maintenance</span>
          </button>
          <button
            onClick={() => setActiveTab('preventive')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'preventive'
                ? 'bg-blue-800 text-white shadow-lg'
                : 'text-gray-600 hover:text-blue-800 hover:bg-blue-50'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Preventive Maintenance</span>
          </button>
        </div>
        
        {/* PM Sub-tabs (only show when preventive tab is active) */}
        {activeTab === 'preventive' && (
          <div className="flex space-x-1 p-1 bg-gray-100 rounded-lg overflow-x-auto mt-4">
            <button
              onClick={() => setPmSubTab('overview')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                pmSubTab === 'overview'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setPmSubTab('configuration')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                pmSubTab === 'configuration'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>PM Configuration</span>
            </button>
                            <button
                  onClick={() => setPmSubTab('workflow')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    pmSubTab === 'workflow'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>PM Workflow</span>
                </button>
                <button
                  onClick={() => setPmSubTab('enrollment')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    pmSubTab === 'enrollment'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>PM Enrollment</span>
                </button>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'corrective' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Equipment</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalEquipment}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Settings className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Maintenance Logs</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalLogs}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Under Maintenance</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.equipmentUnderMaintenance}</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <Wrench className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Equipment Under Maintenance */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Equipment Under Maintenance</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {equipment.filter(eq => eq.status === 'maintenance').map((eq) => (
                      <tr key={eq.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {eq.equipment_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {eq.equipment_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {eq.site}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                            Under Maintenance
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          </div>

            {/* Maintenance Logs */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Maintenance Logs</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search maintenance logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Months</option>
                  {getMonthOptions().map(month => {
                    const [year, monthNum] = month.split('-');
                    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
                    return (
                      <option key={month} value={month}>
                        {getMonthLabel(date)}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((log) => (
                      <tr key={log.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {log.equipment?.equipment_name || 'Unknown Equipment'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.maintenance_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            log.status === 'completed' ? 'bg-green-100 text-green-800' :
                            log.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                            log.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(log.start_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openMaintenanceModal(log)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preventive' && (
          <div className="space-y-6">
            {pmSubTab === 'overview' && (
              <PMDashboard />
            )}
            {pmSubTab === 'configuration' && (
              <PMConfigurationManager />
            )}
                            {pmSubTab === 'workflow' && (
                  <PMWorkflowManager />
                )}
                {pmSubTab === 'enrollment' && (
                  <PMEnrollmentManager />
                )}
          </div>
        )}




      </div>

      {/* Maintenance Action Modal */}
      <MaintenanceActionModal
        isOpen={maintenanceModal.isOpen}
        onClose={closeMaintenanceModal}
        maintenanceLog={maintenanceModal.maintenanceLog}
        equipment={maintenanceModal.equipment}
        onAction={handleMaintenanceAction}
      />
    </div>
  );
};

export default MaintenancePage; 