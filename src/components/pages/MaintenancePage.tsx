import React, { useState, useEffect, useCallback } from 'react';
import { MaintenanceDataLoader } from '../../utils/maintenanceDataLoader';
import { AuthManager } from '../../utils/authUtils';
import { DataStorage } from '../../utils/dataStorage';
import { Equipment, EquipmentMaintenanceLog, EquipmentMaintenanceSchedule } from '../../types';
import { EquipmentMaintenanceService } from '../../utils/equipmentMaintenanceService';
import { RefreshCw, AlertCircle, CheckCircle, Database, Wrench, Clock, Search, Filter, Edit, X, CheckSquare, Square, Eye, BarChart3, Calendar, TrendingUp } from 'lucide-react';
import ActivityTimer from '../common/ActivityTimer';
import TotalDurationDisplay from '../common/TotalDurationDisplay';

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
    if (!maintenanceLog) return;
    
    setLoading(true);
    try {
      let data = {};
      
      if (action === 'complete') {
        data = {
          actual_duration_hours: parseFloat(formData.actual_duration_hours) || undefined,
          cost: parseFloat(formData.cost) || undefined,
          technician_notes: formData.technician_notes,
          parts_used: formData.parts_used
        };
      } else if (action === 'edit') {
        data = {
          description: formData.description,
          technician_notes: formData.technician_notes
        };
      }
      
      await onAction(action, data);
      onClose();
    } catch (error) {
      console.error('Action failed:', error);
      alert(`Failed to ${action} maintenance: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !maintenanceLog || !equipment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {action === 'complete' ? 'Complete Maintenance' : 
             action === 'cancel' ? 'Cancel Maintenance' : 'Edit Maintenance'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Equipment Info */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="font-medium text-gray-900 mb-2">Equipment Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Name:</span>
              <span className="ml-2 font-medium">{equipment.name}</span>
            </div>
            <div>
              <span className="text-gray-600">Type:</span>
              <span className="ml-2 font-medium">{equipment.type}</span>
            </div>
            <div>
              <span className="text-gray-600">Maintenance Type:</span>
              <span className="ml-2 font-medium">{maintenanceLog.maintenance_type}</span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <span className="ml-2 font-medium">{maintenanceLog.status}</span>
            </div>
          </div>
        </div>

        {/* Action Tabs */}
        <div className="flex space-x-1 mb-4">
          <button
            onClick={() => setAction('complete')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              action === 'complete' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <CheckSquare className="w-4 h-4 inline mr-1" />
            Complete
          </button>
          <button
            onClick={() => setAction('edit')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              action === 'edit' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Edit className="w-4 h-4 inline mr-1" />
            Edit
          </button>
          <button
            onClick={() => setAction('cancel')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              action === 'cancel' 
                ? 'bg-red-100 text-red-800' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <X className="w-4 h-4 inline mr-1" />
            Cancel
          </button>
        </div>

        {/* Quick Status Update */}
        {maintenanceLog.status !== 'completed' && maintenanceLog.status !== 'cancelled' && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Quick Status Update</h3>
            <div className="flex space-x-2">
              {maintenanceLog.status === 'scheduled' && (
                <button
                  onClick={async () => {
                    try {
                      await onAction('status_update', { status: 'in_progress' });
                      onClose();
                    } catch (error) {
                      console.error('Status update failed:', error);
                    }
                  }}
                  className="px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-md hover:bg-orange-200"
                >
                  Start Work
                </button>
              )}
              {maintenanceLog.status === 'in_progress' && (
                <button
                  onClick={async () => {
                    try {
                      await onAction('status_update', { status: 'completed' });
                      onClose();
                    } catch (error) {
                      console.error('Status update failed:', error);
                    }
                  }}
                  className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-md hover:bg-green-200"
                >
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        )}

        {/* Form Fields */}
        {action === 'complete' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Actual Duration (hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.actual_duration_hours}
                  onChange={(e) => setFormData({...formData, actual_duration_hours: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 2.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({...formData, cost: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 150.00"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parts Used
              </label>
              <textarea
                value={formData.parts_used}
                onChange={(e) => setFormData({...formData, parts_used: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="List parts used in maintenance..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Technician Notes
              </label>
              <textarea
                value={formData.technician_notes}
                onChange={(e) => setFormData({...formData, technician_notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Detailed notes about the maintenance work..."
              />
            </div>
          </div>
        )}

        {action === 'edit' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Update maintenance description..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Technician Notes
              </label>
              <textarea
                value={formData.technician_notes}
                onChange={(e) => setFormData({...formData, technician_notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Update technician notes..."
              />
            </div>
          </div>
        )}

        {action === 'cancel' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-yellow-400 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Cancel Maintenance</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Are you sure you want to cancel this maintenance request? This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`px-4 py-2 text-white rounded-md ${
              action === 'complete' ? 'bg-green-600 hover:bg-green-700' :
              action === 'edit' ? 'bg-blue-600 hover:bg-blue-700' :
              'bg-red-600 hover:bg-red-700'
            } disabled:opacity-50`}
          >
            {loading ? 'Processing...' : 
             action === 'complete' ? 'Complete Maintenance' :
             action === 'edit' ? 'Update Maintenance' :
             'Cancel Maintenance'}
          </button>
        </div>
      </div>
    </div>
  );
};

const MaintenancePage: React.FC = () => {
  // Removed activeTab state - no longer needed with unified design
  const [departments, setDepartments] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<EquipmentMaintenanceLog[]>([]);
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<EquipmentMaintenanceSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [forceRefreshLoading, setForceRefreshLoading] = useState(false);
  
  // Maintenance action modal state
  const [maintenanceModal, setMaintenanceModal] = useState<{
    isOpen: boolean;
    maintenanceLog: EquipmentMaintenanceLog | null;
    equipment: Equipment | null;
  }>({
    isOpen: false,
    maintenanceLog: null,
    equipment: null
  });

  // Enhanced data loading with comprehensive error handling
  const loadData = useCallback(async (forceRefresh = false) => {
    console.log('🔄 [DepartmentsPage] Starting data load...', { forceRefresh });
    setLoading(true);
    setError(null);

    try {
      // Run comprehensive diagnostic if needed
      if (forceRefresh || !diagnosticData) {
        console.log('🔍 [DepartmentsPage] Running comprehensive diagnostic...');
        const diagnostic = await MaintenanceDataLoader.comprehensiveDiagnostic();
        setDiagnosticData(diagnostic);
        
        if (diagnostic.recommendations.length > 0) {
          console.warn('⚠️ [DepartmentsPage] Diagnostic recommendations:', diagnostic.recommendations);
        }
      }

      // Load departments
      console.log('🏢 [DepartmentsPage] Loading departments...');
      const departmentsData = DataStorage.loadDepartments();
      setDepartments(departmentsData);

      // Load equipment with enhanced error handling
      console.log('🔧 [DepartmentsPage] Loading equipment...');
      let equipmentData: Equipment[] = [];
      try {
        const useSupabase = await AuthManager.useSupabase();
        if (useSupabase) {
          const { supabase } = await import('../../utils/supabaseClient');
          if (supabase) {
            const { data, error } = await supabase.from('equipment').select('*');
            if (error) {
              console.error('❌ [DepartmentsPage] Supabase equipment error:', error);
              equipmentData = DataStorage.loadEquipment();
            } else {
              equipmentData = data || [];
            }
          } else {
            equipmentData = DataStorage.loadEquipment();
          }
        } else {
          equipmentData = DataStorage.loadEquipment();
        }
      } catch (error: any) {
        console.error('❌ [DepartmentsPage] Equipment load error:', error);
        equipmentData = DataStorage.loadEquipment();
      }
      setEquipment(equipmentData);

      // Load maintenance logs with enhanced loader
      console.log('📊 [DepartmentsPage] Loading maintenance logs...');
      const maintenanceLogsResult = await MaintenanceDataLoader.loadMaintenanceLogs(forceRefresh);
      if (maintenanceLogsResult.success) {
        setMaintenanceLogs(maintenanceLogsResult.data || []);
        console.log('✅ [DepartmentsPage] Maintenance logs loaded:', maintenanceLogsResult.data?.length || 0);
      } else {
        console.error('❌ [DepartmentsPage] Maintenance logs failed:', maintenanceLogsResult.error);
        setMaintenanceLogs([]);
      }

      // Load maintenance schedules with enhanced loader
      console.log('📅 [DepartmentsPage] Loading maintenance schedules...');
      const maintenanceSchedulesResult = await MaintenanceDataLoader.loadMaintenanceSchedules(forceRefresh);
      if (maintenanceSchedulesResult.success) {
        setMaintenanceSchedules(maintenanceSchedulesResult.data || []);
        console.log('✅ [DepartmentsPage] Maintenance schedules loaded:', maintenanceSchedulesResult.data?.length || 0);
      } else {
        console.error('❌ [DepartmentsPage] Maintenance schedules failed:', maintenanceSchedulesResult.error);
        setMaintenanceSchedules([]);
      }

      setLastRefresh(new Date());
      console.log('✅ [DepartmentsPage] Data load completed successfully');

    } catch (error: any) {
      console.error('❌ [DepartmentsPage] Data load error:', error);
      setError(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [diagnosticData]);

  // Force refresh function
  const handleForceRefresh = async () => {
    console.log('🔄 [DepartmentsPage] Force refresh requested...');
    setForceRefreshLoading(true);
    try {
      const refreshResult = await MaintenanceDataLoader.forceRefresh();
      console.log('✅ [DepartmentsPage] Force refresh completed:', refreshResult);
      
      // Update state with fresh data
      setMaintenanceLogs(refreshResult.maintenanceLogs.data || []);
      setMaintenanceSchedules(refreshResult.maintenanceSchedules.data || []);
      setEquipment(refreshResult.equipment.data || []);
      setLastRefresh(new Date());
      
      // Show success message
      alert('Force refresh completed successfully!');
    } catch (error: any) {
      console.error('❌ [DepartmentsPage] Force refresh error:', error);
      alert(`Force refresh failed: ${error.message}`);
    } finally {
      setForceRefreshLoading(false);
    }
  };

  // Maintenance action handlers
  const handleMaintenanceAction = async (action: 'complete' | 'cancel' | 'edit' | 'status_update', data?: any) => {
    if (!maintenanceModal.maintenanceLog) return;

    try {
      console.log(`🔄 [DepartmentsPage] Performing maintenance action: ${action}`, data);

      if (action === 'complete') {
        const result = await EquipmentMaintenanceService.completeMaintenance(
          maintenanceModal.maintenanceLog.id,
          data
        );
        if (!result.success) {
          throw new Error(result.error);
        }
        alert('Maintenance completed successfully!');
      } else if (action === 'cancel') {
        const result = await EquipmentMaintenanceService.updateMaintenanceLog(
          maintenanceModal.maintenanceLog.id,
          { status: 'cancelled' }
        );
        if (!result.success) {
          throw new Error(result.error);
        }
        alert('Maintenance cancelled successfully!');
      } else if (action === 'edit') {
        const result = await EquipmentMaintenanceService.updateMaintenanceLog(
          maintenanceModal.maintenanceLog.id,
          data
        );
        if (!result.success) {
          throw new Error(result.error);
        }
        alert('Maintenance updated successfully!');
      } else if (action === 'status_update') {
        const result = await EquipmentMaintenanceService.updateMaintenanceStatus(
          maintenanceModal.maintenanceLog.id,
          data.status
        );
        if (!result.success) {
          throw new Error(result.error);
        }
        alert(`Maintenance status updated to ${data.status} successfully!`);
      }

      // Refresh data after action
      await loadData(true);
      
    } catch (error: any) {
      console.error(`❌ [DepartmentsPage] Maintenance action failed:`, error);
      alert(`Failed to ${action} maintenance: ${error.message}`);
    }
  };

  const openMaintenanceModal = (maintenanceLog: EquipmentMaintenanceLog) => {
    const relatedEquipment = equipment.find(eq => eq.id === maintenanceLog.equipment_id);
    setMaintenanceModal({
      isOpen: true,
      maintenanceLog,
      equipment: relatedEquipment || null
    });
  };

  const closeMaintenanceModal = () => {
    setMaintenanceModal({
      isOpen: false,
      maintenanceLog: null,
      equipment: null
    });
  };

  // Auto-refresh setup
  useEffect(() => {
    // Initial load
    loadData();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      console.log('🔄 [DepartmentsPage] Auto-refresh triggered...');
      loadData();
    }, 30000);

    setAutoRefreshInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [loadData]);

  // Enhanced filtering and enrichment
  const getFilteredAndEnrichedData = () => {
    let filteredEquipment = equipment;
    let filteredMaintenanceLogs = maintenanceLogs;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredEquipment = equipment.filter(eq => 
        eq.name.toLowerCase().includes(term) ||
        eq.type.toLowerCase().includes(term) ||
        eq.custom_equipment_id?.toLowerCase().includes(term)
      );
      filteredMaintenanceLogs = maintenanceLogs.filter(log => 
        log.description?.toLowerCase().includes(term) ||
        log.equipment_name?.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filteredEquipment = filteredEquipment.filter(eq => eq.status === statusFilter);
      filteredMaintenanceLogs = filteredMaintenanceLogs.filter(log => log.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filteredEquipment = filteredEquipment.filter(eq => eq.type === typeFilter);
      filteredMaintenanceLogs = filteredMaintenanceLogs.filter(log => log.maintenance_type === typeFilter);
    }

    // Enrich equipment with maintenance information
    const enrichedEquipment = filteredEquipment.map(eq => {
      const equipmentMaintenanceLogs = maintenanceLogs.filter(log => log.equipment_id === eq.id);
      const equipmentSchedules = maintenanceSchedules.filter(schedule => schedule.equipment_id === eq.id);
      const lastMaintenance = equipmentMaintenanceLogs
        .filter(log => log.status === 'completed')
        .sort((a, b) => new Date(b.completion_date || '').getTime() - new Date(a.completion_date || '').getTime())[0];
      const upcomingMaintenance = equipmentSchedules
        .filter(schedule => schedule.is_active && new Date(schedule.next_maintenance_date) > new Date())
        .sort((a, b) => new Date(a.next_maintenance_date).getTime() - new Date(b.next_maintenance_date).getTime())[0];

      return {
        ...eq,
        maintenanceCount: equipmentMaintenanceLogs.length,
        scheduleCount: equipmentSchedules.length,
        lastMaintenance: lastMaintenance?.completion_date,
        nextMaintenance: upcomingMaintenance?.next_maintenance_date,
        currentMaintenance: equipmentMaintenanceLogs.find(log => log.status === 'in_progress')
      };
    });

    // Filter equipment to only show those that need maintenance
    const equipmentNeedingMaintenance = enrichedEquipment.filter(eq => {
      // Equipment with 'maintenance' status
      const hasMaintenanceStatus = eq.status === 'maintenance';
      
      // Equipment with active maintenance logs (in_progress or scheduled)
      const hasActiveMaintenance = eq.currentMaintenance || 
        maintenanceLogs.some((log: EquipmentMaintenanceLog) => 
          log.equipment_id === eq.id && 
          (log.status === 'in_progress' || log.status === 'scheduled')
        );
      
      // Equipment with upcoming maintenance schedules
      const hasUpcomingMaintenance = maintenanceSchedules.some((schedule: EquipmentMaintenanceSchedule) => 
        schedule.equipment_id === eq.id && 
        schedule.is_active && 
        new Date(schedule.next_maintenance_date) > new Date()
      );

      return hasMaintenanceStatus || hasActiveMaintenance || hasUpcomingMaintenance;
    });

    // Enrich maintenance logs with equipment information
    const enrichedMaintenanceLogs = filteredMaintenanceLogs.map(log => {
      const relatedEquipment = equipment.find((eq: Equipment) => eq.id === log.equipment_id);
      return {
        ...log,
        equipment_name: relatedEquipment?.name || log.equipment_name || 'Unknown Equipment',
        equipment_type: relatedEquipment?.type || log.equipment_type || 'Unknown Type',
        equipment_site: relatedEquipment?.site || 'Unknown Site'
      };
    });

    return {
      equipment: equipmentNeedingMaintenance,
      maintenanceLogs: enrichedMaintenanceLogs
    };
  };

  const { equipment: enrichedEquipment, maintenanceLogs: enrichedMaintenanceLogs } = getFilteredAndEnrichedData();

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-100';
      case 'in-use': return 'text-blue-600 bg-blue-100';
      case 'maintenance': return 'text-yellow-600 bg-yellow-100';
      case 'down': return 'text-red-600 bg-red-100';
      case 'scheduled': return 'text-purple-600 bg-purple-100';
      case 'in_progress': return 'text-orange-600 bg-orange-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getEquipmentTypes = () => {
    const types = new Set(equipment.map(eq => eq.type));
    return Array.from(types).sort();
  };

  const getStatusOptions = () => {
    const statuses = new Set([
      ...equipment.map(eq => eq.status),
      ...maintenanceLogs.map(log => log.status)
    ]);
    return Array.from(statuses).sort();
  };

  if (loading && !lastRefresh) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading maintenance department data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with diagnostic and refresh controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Maintenance Dashboard</h1>
            <p className="text-gray-600">Comprehensive view of equipment maintenance, schedules, and activity</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowDiagnostic(!showDiagnostic)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center space-x-2"
            >
              <Database className="w-4 h-4" />
              <span>Diagnostic</span>
            </button>
            <button
              onClick={handleForceRefresh}
              disabled={forceRefreshLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${forceRefreshLoading ? 'animate-spin' : ''}`} />
              <span>{forceRefreshLoading ? 'Refreshing...' : 'Force Refresh'}</span>
            </button>
            <button
              onClick={() => loadData(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Enhanced Status indicators */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Wrench className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm text-blue-600">Total Equipment</p>
                <p className="text-2xl font-bold text-blue-900">{equipment.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-yellow-600 mr-2" />
              <div>
                <p className="text-sm text-yellow-600">Maintenance Logs</p>
                <p className="text-2xl font-bold text-yellow-900">{maintenanceLogs.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-purple-600 mr-2" />
              <div>
                <p className="text-sm text-purple-600">Schedules</p>
                <p className="text-2xl font-bold text-purple-900">{maintenanceSchedules.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-orange-600 mr-2" />
              <div>
                <p className="text-sm text-orange-600">Requiring Maintenance</p>
                <p className="text-2xl font-bold text-orange-900">{enrichedEquipment.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm text-green-600">Last Refresh</p>
                <p className="text-sm font-bold text-green-900">
                  {lastRefresh ? lastRefresh.toLocaleTimeString() : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Diagnostic panel */}
        {showDiagnostic && diagnosticData && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">System Diagnostic</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Authentication:</strong> {diagnosticData.authentication.isAuthenticated ? '✅' : '❌'}</p>
                <p><strong>Data Source:</strong> {diagnosticData.dataSource.current}</p>
                <p><strong>Supabase:</strong> {diagnosticData.supabaseConnection.reachable ? '✅' : '❌'}</p>
              </div>
              <div>
                <p><strong>Equipment:</strong> {diagnosticData.equipment.count} ({diagnosticData.equipment.source})</p>
                <p><strong>Maintenance Logs:</strong> {diagnosticData.maintenanceLogs.count} ({diagnosticData.maintenanceLogs.source})</p>
                <p><strong>Schedules:</strong> {diagnosticData.maintenanceSchedules.count} ({diagnosticData.maintenanceSchedules.source})</p>
              </div>
            </div>
            {diagnosticData.recommendations.length > 0 && (
              <div className="mt-3">
                <p className="font-medium text-yellow-800">Recommendations:</p>
                <ul className="list-disc list-inside text-sm text-yellow-700">
                  {diagnosticData.recommendations.map((rec: string, index: number) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Unified Maintenance Dashboard Content */}
        <>
          {/* Quick Overview Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Upcoming Maintenance */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                Upcoming Maintenance
              </h3>
              <div className="space-y-3">
                {maintenanceSchedules
                  .filter(schedule => schedule.is_active && new Date(schedule.next_maintenance_date) > new Date())
                  .slice(0, 5)
                  .map((schedule) => {
                    const relatedEquipment = equipment.find(eq => eq.id === schedule.equipment_id);
                    return (
                      <div key={schedule.id} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{relatedEquipment?.name || 'Unknown Equipment'}</h4>
                            <p className="text-sm text-gray-600">{schedule.maintenance_type} Maintenance</p>
                            <p className="text-xs text-gray-500">Due: {new Date(schedule.next_maintenance_date).toLocaleDateString()}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            schedule.priority === 'high' ? 'bg-red-100 text-red-800' :
                            schedule.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {schedule.priority}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                {maintenanceSchedules.filter(schedule => schedule.is_active && new Date(schedule.next_maintenance_date) > new Date()).length === 0 && (
                  <p className="text-gray-500 text-center py-4">No upcoming maintenance scheduled</p>
                )}
              </div>
            </div>

            {/* Recent Maintenance Activity */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                Recent Maintenance Activity
              </h3>
              <div className="space-y-3">
                {maintenanceLogs
                  .filter(log => log.status === 'completed')
                  .sort((a, b) => new Date(b.completion_date || '').getTime() - new Date(a.completion_date || '').getTime())
                  .slice(0, 5)
                  .map((log) => (
                    <div key={log.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{log.equipment_name || 'Unknown Equipment'}</h4>
                          <p className="text-sm text-gray-600">{log.maintenance_type} - {log.description || 'No description'}</p>
                          <p className="text-xs text-gray-500">Completed: {new Date(log.completion_date || '').toLocaleDateString()}</p>
                        </div>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Completed
                        </span>
                      </div>
                    </div>
                  ))}
                {maintenanceLogs.filter(log => log.status === 'completed').length === 0 && (
                  <p className="text-gray-500 text-center py-4">No recent maintenance activity</p>
                )}
              </div>
            </div>
          </div>

          {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search equipment or maintenance..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              {getStatusOptions().map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              {getEquipmentTypes().map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setTypeFilter('all');
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center justify-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Equipment Under Maintenance */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Equipment Requiring Maintenance</h2>
          <p className="text-sm text-gray-600">Equipment currently under maintenance, scheduled for maintenance, or with active maintenance requests</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Maintenance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last/Next</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {enrichedEquipment.map((eq) => (
                <tr key={eq.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{eq.name}</div>
                      <div className="text-sm text-gray-500">ID: {eq.custom_equipment_id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{eq.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(eq.status)}`}>
                      {eq.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {eq.currentMaintenance ? (
                      <div>
                        <div className="font-medium">{eq.currentMaintenance.maintenance_type}</div>
                        <div className="text-gray-500">{eq.currentMaintenance.description}</div>
                        {eq.currentMaintenance.status === 'in_progress' && (
                          <div className="mt-1">
                            <ActivityTimer 
                              startTime={eq.currentMaintenance.start_date} 
                              variant="compact" 
                              showIcon={true}
                            />
                          </div>
                        )}
                        {eq.currentMaintenance.status === 'completed' && eq.currentMaintenance.completion_date && (
                          <div className="mt-1">
                            <TotalDurationDisplay 
                              startTime={eq.currentMaintenance.start_date}
                              endTime={eq.currentMaintenance.completion_date}
                              variant="compact" 
                              showIcon={true}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">No active maintenance</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      {eq.lastMaintenance && (
                        <div className="text-gray-500">Last: {new Date(eq.lastMaintenance).toLocaleDateString()}</div>
                      )}
                      {eq.nextMaintenance && (
                        <div className="text-blue-600">Next: {new Date(eq.nextMaintenance).toLocaleDateString()}</div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {enrichedEquipment.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No equipment currently requires maintenance.
          </div>
        )}
      </div>

      {/* Maintenance Requests */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Maintenance Requests</h2>
          <p className="text-sm text-gray-600">All maintenance logs and scheduled maintenance</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {enrichedMaintenanceLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{log.equipment_name}</div>
                      <div className="text-sm text-gray-500">{log.equipment_type}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.maintenance_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                      {log.status === 'in_progress' && (
                        <ActivityTimer 
                          startTime={log.start_date} 
                          variant="compact" 
                          showIcon={false}
                        />
                      )}
                      {log.status === 'completed' && log.completion_date && (
                        <TotalDurationDisplay 
                          startTime={log.start_date}
                          endTime={log.completion_date}
                          variant="compact" 
                          showIcon={false}
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate">{log.description || 'No description'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(log.start_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openMaintenanceModal(log)}
                        className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                        title="View/Edit Maintenance"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-xs">Actions</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {enrichedMaintenanceLogs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No maintenance requests found matching the current filters.
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
        </>
    </div>
  );
};

export default MaintenancePage; 