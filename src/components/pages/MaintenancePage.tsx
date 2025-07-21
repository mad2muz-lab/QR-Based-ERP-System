import React, { useState, useEffect, useCallback } from 'react';
import { MaintenanceDataLoader } from '../../utils/maintenanceDataLoader';
import { AuthManager } from '../../utils/authUtils';
import { DataStorage } from '../../utils/dataStorage';
import { Equipment, EquipmentMaintenanceLog, EquipmentMaintenanceSchedule, MaintenanceMaterialRequest } from '../../types';
import { EquipmentMaintenanceService } from '../../utils/equipmentMaintenanceService';
import { PreventiveMaintenanceService } from '../../utils/preventiveMaintenanceService';
import { Bell, RefreshCw, AlertCircle, CheckCircle, Database, Wrench, Clock, Search, Filter, Edit, X, CheckSquare, Eye, BarChart3, Calendar, TrendingUp } from 'lucide-react';
import ActivityTimer from '../common/ActivityTimer';
import TotalDurationDisplay from '../common/TotalDurationDisplay';
import { OfflineDataManager } from '../../utils/offlineDataManager';
import MaintenanceActionModal from '../maintenance/MaintenanceActionModal';
import StartMaintenanceModal from '../maintenance/StartMaintenanceModal';
import MaintenanceDetailsModal from '../maintenance/MaintenanceDetailsModal';
import CompleteMaintenanceModal from '../maintenance/CompleteMaintenanceModal';
import EquipmentMaintenanceTable from '../maintenance/EquipmentMaintenanceTable';
import MaintenanceRequestsTable from '../maintenance/MaintenanceRequestsTable';
import InventoryMaterialRequests from '../maintenance/InventoryMaterialRequests';

// Maintenance Action Modal Component


const MaintenancePage: React.FC = () => {
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
  const [materialRequests, setMaterialRequests] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
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

  // Add state for modals
  const [activeSchedule, setActiveSchedule] = useState<EquipmentMaintenanceSchedule | null>(null);
  const [modalType, setModalType] = useState<'start' | 'details' | 'complete' | null>(null);

  // Add state for class materials
  const [classMaterials, setClassMaterials] = useState<any[]>([]);
  const [detectedClass, setDetectedClass] = useState<'A' | 'B' | 'C' | null>(null);

  // Handler functions
  const handleStartMaintenance = async (schedule: EquipmentMaintenanceSchedule) => {
    try {
      let maintenanceClass: 'A' | 'B' | 'C' = 'A';
      if (schedule.description?.match(/Class B/i)) maintenanceClass = 'B';
      if (schedule.description?.match(/Class C/i)) maintenanceClass = 'C';
      setDetectedClass(maintenanceClass);
      const allClassTypes = await OfflineDataManager.getAllClassMaintenanceTypes();
      const materialsForClass = allClassTypes.filter((item: any) => {
        return (
          (item.maintenance_type && item.maintenance_type.match(new RegExp(`Class ${maintenanceClass}`, 'i'))) ||
          (item.maintenance_type && item.maintenance_type.trim().toUpperCase() === maintenanceClass)
        );
      });
      setClassMaterials(materialsForClass);
      setActiveSchedule(schedule);
      setModalType('start');
    } catch (error: any) {
      console.error('Failed to start maintenance:', error);
      addNotification({
        type: 'error',
        message: `Failed to start maintenance: ${error.message || 'Unknown error'}`,
        action: 'error'
      });
    }
  };

  const handleViewDetails = (schedule: EquipmentMaintenanceSchedule) => {
    setActiveSchedule(schedule);
    setModalType('details');
  };

  const handleCompleteMaintenance = async (schedule: EquipmentMaintenanceSchedule) => {
    try {
      setActiveSchedule(schedule);
      setModalType('complete');
    } catch (error: any) {
      console.error('Failed to open complete maintenance modal:', error);
      addNotification({
        type: 'error',
        message: `Failed to open complete maintenance: ${error.message || 'Unknown error'}`,
        action: 'error'
      });
    }
  };

  const closeModal = () => {
    setActiveSchedule(null);
    setModalType(null);
  };

  // Helper to add a notification
  const addNotification = (notif: any) => {
    setNotifications(prev => [{ ...notif, id: Date.now() }, ...prev]);
  };

  // Enhanced data loading with comprehensive error handling
  const loadData = useCallback(async (forceRefresh = false) => {
    console.log('🔄 [MaintenancePage] Starting data load...', { forceRefresh });
    setLoading(true);
    setError(null);

    try {
      // Run comprehensive diagnostic if needed
      if (forceRefresh || !diagnosticData) {
        console.log('🔍 [MaintenancePage] Running comprehensive diagnostic...');
        const diagnostic = await MaintenanceDataLoader.comprehensiveDiagnostic();
        setDiagnosticData(diagnostic);
        
        if (diagnostic.recommendations.length > 0) {
          console.warn('⚠️ [MaintenancePage] Diagnostic recommendations:', diagnostic.recommendations);
        }
      }

      // Load departments
      console.log('🏢 [MaintenancePage] Loading departments...');
      const departmentsData = DataStorage.loadDepartments();
      setDepartments(departmentsData);

      // Load equipment with enhanced error handling
      console.log('🔧 [MaintenancePage] Loading equipment...');
      let equipmentData: Equipment[] = [];
      try {
        const useSupabase = await AuthManager.useSupabase();
        if (useSupabase) {
          const { supabase } = await import('../../utils/supabaseClient');
          if (supabase) {
            const { data, error } = await supabase.from('equipment').select('*');
            if (error) {
              console.error('❌ [MaintenancePage] Supabase equipment error:', error);
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
        console.error('❌ [MaintenancePage] Equipment load error:', error);
        equipmentData = DataStorage.loadEquipment();
      }
      setEquipment(equipmentData);

      // Load maintenance logs with enhanced loader
      console.log('📊 [MaintenancePage] Loading maintenance logs...');
      const maintenanceLogsResult = await MaintenanceDataLoader.loadMaintenanceLogs(forceRefresh);
      if (maintenanceLogsResult.success) {
        setMaintenanceLogs(maintenanceLogsResult.data || []);
        console.log('✅ [MaintenancePage] Maintenance logs loaded:', maintenanceLogsResult.data?.length || 0);
      } else {
        console.error('❌ [MaintenancePage] Maintenance logs failed:', maintenanceLogsResult.error);
        setMaintenanceLogs([]);
      }

      // Load maintenance schedules with enhanced loader
      console.log('📅 [MaintenancePage] Loading maintenance schedules...');
      const maintenanceSchedulesResult = await MaintenanceDataLoader.loadMaintenanceSchedules(forceRefresh);
      if (maintenanceSchedulesResult.success) {
        setMaintenanceSchedules(maintenanceSchedulesResult.data || []);
        console.log('✅ [MaintenancePage] Maintenance schedules loaded:', maintenanceSchedulesResult.data?.length || 0);
      } else {
        console.error('❌ [MaintenancePage] Maintenance schedules failed:', maintenanceSchedulesResult.error);
        setMaintenanceSchedules([]);
      }

      setLastRefresh(new Date());
      console.log('🏁 [MaintenancePage] Data load completed successfully');

    } catch (error: any) {
      console.error('❌ [MaintenancePage] Data load error:', error);
      setError(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [diagnosticData]);

  // Force refresh function
  const handleForceRefresh = async () => {
    console.log('🔄 [MaintenancePage] Force refresh requested...');
    setForceRefreshLoading(true);
    try {
      const refreshResult = await MaintenanceDataLoader.forceRefresh();
      console.log('✅ [MaintenancePage] Force refresh completed:', refreshResult);
      
      // Update state with fresh data
      setMaintenanceLogs(refreshResult.maintenanceLogs.data || []);
      setMaintenanceSchedules(refreshResult.maintenanceSchedules.data || []);
      setEquipment(refreshResult.equipment.data || []);
      setLastRefresh(new Date());
      
      // Show success message
      alert('Force refresh completed successfully!');
    } catch (error: any) {
      console.error('❌ [MaintenancePage] Force refresh error:', error);
      alert(`Force refresh failed: ${error.message}`);
    } finally {
      setForceRefreshLoading(false);
    }
  };

  // Maintenance action handlers
  const handleMaintenanceAction = async (action: 'complete' | 'cancel' | 'edit' | 'status_update', data?: any) => {
    if (!maintenanceModal.maintenanceLog) return;

    try {
      console.log(`🔄 [MaintenancePage] Performing maintenance action: ${action}`, data);

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
      console.error(`❌ [MaintenancePage] Maintenance action failed:`, error);
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
      console.log('🔄 [MaintenancePage] Auto-refresh triggered...');
      loadData();
    }, 30000);

    setAutoRefreshInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [loadData]);

  // Load material requests
  useEffect(() => {
    const loadMaterialRequests = async () => {
      const requests = await OfflineDataManager.getAllMaintenanceMaterialRequests();
      setMaterialRequests(requests);
    };
    loadMaterialRequests();
  }, []);

  // Handler for issuing materials
  const handleIssueMaterials = async (request: any) => {
    try {
      const currentUser = await AuthManager.getCurrentUser();
      for (const item of request.items || []) {
        const allMaterials = DataStorage.loadMaterials();
        const matIdx = allMaterials.findIndex((m: any) => m.name === item.material_name);
        if (matIdx !== -1) {
          allMaterials[matIdx].quantity = Math.max(0, (allMaterials[matIdx].quantity || 0) - (item.quantity_requested || 0));
          DataStorage.saveMaterials(allMaterials);
        }
      }
      await OfflineDataManager.updateMaintenanceMaterialRequest(request.id, { 
        status: 'pending_service',
        updated_by: currentUser?.id || 'system'
      });
      await loadData(true);
      addNotification({
        type: 'issued',
        message: `Materials issued for ${request.equipment_name}`,
        action: 'pending_service',
        requestId: request.id
      });
    } catch (error: any) {
      console.error('Failed to issue materials:', error);
      addNotification({
        type: 'error',
        message: `Failed to issue materials: ${error.message || 'Unknown error'}`,
        action: 'error'
      });
    }
  };

  // Handler for marking as ready to use
  const handleReadyToUse = async (request: any) => {
    try {
      await OfflineDataManager.updateMaintenanceMaterialRequest(request.id, { status: 'completed' });
      await loadData(true);
      addNotification({
        type: 'ready',
        message: `Maintenance marked as Ready to Use for ${request.equipment_name}`,
        action: 'completed',
        requestId: request.id
      });
    } catch (error: any) {
      console.error('Failed to mark as ready to use:', error);
      addNotification({
        type: 'error',
        message: `Failed to mark as ready: ${error.message || 'Unknown error'}`,
        action: 'error'
      });
    }
  };

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
      const hasMaintenanceStatus = eq.status === 'maintenance';
      const hasActiveMaintenance = eq.currentMaintenance || 
        maintenanceLogs.some((log: EquipmentMaintenanceLog) => 
          log.equipment_id === eq.id && 
          (log.status === 'in_progress' || log.status === 'scheduled')
        );
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
        equipment_site: relatedEquipment?.site || log.site_assignment || 'Unknown Site',
        assigned_technician_name: userIdToName(log.assigned_technician || ''),
        completed_by_name: userIdToName(log.completed_by || '')
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

  const userIdToName = (userId: string) => {
    const users = [
      { id: 'tech-1', name: 'Technician One' },
      { id: 'tech-2', name: 'Technician Two' },
    ];
    return users.find(u => u.id === userId)?.name || 'Unknown User';
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
          <div className="flex items-center space-x-4 mb-4">
            <button onClick={() => setShowNotifications(!showNotifications)} className="relative">
              <Bell className="w-6 h-6 text-gray-700" />
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">{notifications.length}</span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute z-50 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg right-0">
                <div className="p-4 border-b font-semibold text-gray-900">Notifications</div>
                <ul className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 && <li className="p-4 text-gray-500">No notifications</li>}
                  {notifications.map((notif, idx) => (
                    <li key={notif.id} className="p-4 border-b hover:bg-gray-50 cursor-pointer" onClick={() => {
                      setShowNotifications(false);
                    }}>
                      <div className="font-medium">{notif.message}</div>
                      <div className="text-xs text-gray-500">{new Date(notif.id).toLocaleTimeString()}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
      <div>
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
                    <div key={schedule.id} className="bg-gray-50 p-3 rounded-lg mb-2">
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
                      {/* Actionable Buttons */}
                      <div className="flex space-x-2 mt-2">
                        <button
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                          onClick={() => handleStartMaintenance(schedule)}
                        >
                          Start Maintenance
                        </button>
                        <button
                          className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                          onClick={() => handleViewDetails(schedule)}
                        >
                          View Details
                        </button>
                        <button
                          className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                          onClick={() => handleCompleteMaintenance(schedule)}
                        >
                          Complete
                        </button>
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
        <div className="bg-white rounded-lg shadowopard p-6">
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
        <EquipmentMaintenanceTable enrichedEquipment={enrichedEquipment} getStatusColor={getStatusColor} />

        {/* Maintenance Requests */}
        <MaintenanceRequestsTable enrichedMaintenanceLogs={enrichedMaintenanceLogs} getStatusColor={getStatusColor} openMaintenanceModal={openMaintenanceModal} />

        {/* Inventory Material Requests */}
        <InventoryMaterialRequests materialRequests={materialRequests} handleIssueMaterials={handleIssueMaterials} handleReadyToUse={handleReadyToUse} />
      </div>

      {/* Maintenance Action Modal */}
      <MaintenanceActionModal
        isOpen={maintenanceModal.isOpen}
        onClose={closeMaintenanceModal}
        maintenanceLog={maintenanceModal.maintenanceLog}
        equipment={maintenanceModal.equipment}
        onAction={handleMaintenanceAction}
      />

      {/* Modals */}
      {modalType === 'start' && activeSchedule && (
        <StartMaintenanceModal
          isOpen={modalType === 'start'}
          onClose={closeModal}
          schedule={activeSchedule}
          equipment={equipment.find(eq => eq.id === activeSchedule.equipment_id) || null}
          detectedClass={detectedClass ?? undefined}
          classMaterials={classMaterials}
          onComplete={async () => {
            try {
              const relatedEquipment = equipment.find(eq => eq.id === activeSchedule.equipment_id);
              const currentUser = await AuthManager.getCurrentUser();
              const materialItems = classMaterials.map((mat: any) => ({
                material_name: mat.spare_part,
                material_type: mat.maintenance_type,
                quantity_requested: mat.estimated_quantity,
                uom: mat.uom,
                status: 'pending',
                estimated_unit_cost: 0,
                actual_unit_cost: 0
              }));
              const request: Partial<MaintenanceMaterialRequest> = {
                maintenance_log_id: activeSchedule.id,
                equipment_id: activeSchedule.equipment_id,
                equipment_name: relatedEquipment?.name || 'Unknown Equipment',
                maintenance_class: detectedClass ?? undefined,
                maintenance_type: activeSchedule.maintenance_type,
                status: 'awaiting_inventory',
                requested_by: currentUser?.id || 'system',
                site: relatedEquipment?.site || 'Unknown Site',
                priority: activeSchedule.priority === 'critical' ? 'urgent' : activeSchedule.priority,
                notes: '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              const parentResult = await OfflineDataManager.createMaintenanceMaterialRequest(request);
              const requestId = parentResult?.data?.id || request.id;
              for (const mat of materialItems) {
                await OfflineDataManager.createMaintenanceMaterialRequestItem({
                  request_id: requestId,
                  ...mat
                });
              }
              closeModal();
              await loadData(true);
              addNotification({
                type: 'material_request',
                message: `Material request created for ${relatedEquipment?.name || activeSchedule.equipment_id} (Class ${detectedClass})`,
                action: 'inventory',
                requestId: request.id
              });
            } catch (error: any) {
              console.error('Failed to create material request:', error);
              addNotification({
                type: 'error',
                message: `Failed to create material request: ${error.message || 'Unknown error'}`,
                action: 'error'
              });
            }
          }}
        />
      )}
      {modalType === 'details' && activeSchedule && (
        <MaintenanceDetailsModal
          isOpen={modalType === 'details'}
          onClose={closeModal}
          schedule={activeSchedule}
          equipment={equipment.find(eq => eq.id === activeSchedule.equipment_id) || null}
          detectedClass={detectedClass ?? undefined}
        />
      )}
      {modalType === 'complete' && activeSchedule && (
        <CompleteMaintenanceModal
          isOpen={modalType === 'complete'}
          onClose={closeModal}
          schedule={activeSchedule}
          equipment={equipment.find(eq => eq.id === activeSchedule.equipment_id) || null}
          onComplete={async () => {
            try {
              const pmService = new PreventiveMaintenanceService();
              await pmService.completePreventiveMaintenance(activeSchedule.id, {
                actual_duration_hours: 0,
                cost: 0,
                technician_notes: '',
                parts_used: '',
                completed_by: (await AuthManager.getCurrentUser())?.id || 'system'
              });
              closeModal();
              await loadData(true);
              addNotification({
                type: 'success',
                message: `Maintenance completed for ${activeSchedule.equipment_id}`,
                action: 'completed'
              });
            } catch (error: any) {
              console.error('Failed to complete maintenance:', error);
              addNotification({
                type: 'error',
                message: `Failed to complete maintenance: ${error.message || 'Unknown error'}`,
                action: 'error'
              });
            }
          }}
        />
      )}
    </div>
  );
};

export default MaintenancePage;