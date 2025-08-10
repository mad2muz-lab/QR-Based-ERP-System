import React, { useState, useEffect } from 'react';
import { 
  Users, Wrench, Package, Clock, TrendingUp, AlertTriangle, 
  Building, BarChart3, FileText, RefreshCw, 
  WifiOff, CheckCircle
} from 'lucide-react';
import StatsCard from './StatsCard';
import ReportsPanel from '../scanner/ReportsPanel';

import { offlineSyncManager, SyncStatus } from '../../utils/offlineSync';
import { Employee, Equipment, Material, Site, TimeLog } from '../../types';
import { fetchData, getAllLogs, getCurrentDataSource } from '../../utils/dataProxy';
import DataSourceToggle from '../common/DataSourceToggle';
import ActivityTimer from '../common/ActivityTimer';
import TotalDurationDisplay from '../common/TotalDurationDisplay';
import { isActiveActivity, isCompletionActivity, findStartActivityForCompletion } from '../../utils/activityUtils';

interface DashboardProps {
  currentView?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ currentView }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'reports'>('overview');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(offlineSyncManager.getStatus());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataSource, setDataSource] = useState<'local' | 'supabase'>('local');
  
  // State for all data entities
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [employeeLogs, setEmployeeLogs] = useState<any[]>([]);
  const [equipmentLogs, setEquipmentLogs] = useState<any[]>([]);
  const [materialLogs, setMaterialLogs] = useState<any[]>([]);

  // Load data based on current mode
  const loadData = async () => {
    setIsLoadingData(true);
    try {
      // Initialize sample data if no data exists (only for local storage)
      const currentSource = getCurrentDataSource();
      // if (currentSource === 'localstorage') {
      //   SampleDataInitializer.initializeSampleData();
      // }
      
      // Use centralized data source
      setDataSource(currentSource === 'supabase' ? 'supabase' : 'local');
      
      // Load all data through proxy
      const [empData, eqData, matData, siteData, logData, separateLogsData] = await Promise.all([
        fetchData('employees'),
        fetchData('equipment'),
        fetchData('materials'),
        fetchData('sites'),
        fetchData('time_logs'),
        getAllLogs()
      ]);
      
      setEmployees(empData as Employee[]);
      setEquipment(eqData as Equipment[]);
      setMaterials(matData as Material[]);
      setSites(siteData as Site[]);
      setTimeLogs(logData as TimeLog[]);
      
      // Load separate log tables
      if (separateLogsData && typeof separateLogsData === 'object' && 'employeeLogs' in separateLogsData) {
        setEmployeeLogs(separateLogsData.employeeLogs || []);
        setEquipmentLogs(separateLogsData.equipmentLogs || []);
        setMaterialLogs(separateLogsData.materialLogs || []);
        console.log('Loaded logs:', {
          employeeLogs: separateLogsData.employeeLogs?.length,
          equipmentLogs: separateLogsData.equipmentLogs?.length,
          materialLogs: separateLogsData.materialLogs?.length
        });
      } else {
        // Handle case where separateLogsData is an array (localStorage format)
        setEmployeeLogs([]);
        setEquipmentLogs([]);
        setMaterialLogs([]);
        console.log('Loaded logs:', {
          employeeLogs: 0,
          equipmentLogs: 0,
          materialLogs: 0
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Initial data loading and sync setup
  useEffect(() => {
    const handleStatusChange = (status: SyncStatus) => {
      setSyncStatus(status);
      setIsSyncing(status.isSyncing);
    };

    // Listen for log updates to refresh dashboard
    const handleLogUpdate = () => {
      console.log('Log updated, refreshing dashboard...');
      loadData();
    };

    // Listen for storage changes (new logs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && (
        e.key === 'qr_system_employee_logs' ||
        e.key === 'qr_system_equipment_logs' ||
        e.key === 'qr_system_material_logs'
      )) {
        handleLogUpdate();
      }
    };

    // Listen for custom events
    window.addEventListener('employeeLogCreated', handleLogUpdate);
    window.addEventListener('equipmentLogCreated', handleLogUpdate);
    window.addEventListener('materialLogCreated', handleLogUpdate);
    window.addEventListener('storage', handleStorageChange);

    offlineSyncManager.addSyncListener(handleStatusChange);
    loadData();

    return () => {
      window.removeEventListener('employeeLogCreated', handleLogUpdate);
      window.removeEventListener('equipmentLogCreated', handleLogUpdate);
      window.removeEventListener('materialLogCreated', handleLogUpdate);
      window.removeEventListener('storage', handleStorageChange);
      offlineSyncManager.removeSyncListener(handleStatusChange);
    };
  }, []);

  // Refresh data when navigating back to dashboard
  useEffect(() => {
    if (currentView === 'dashboard') {
      loadData();
    }
  }, [currentView]);

  // Sync button handler
  const handleSyncNow = async () => {
    if (syncStatus.isOnline && !syncStatus.isSyncing) {
      setIsSyncing(true);
      try {
        await offlineSyncManager.forcSync();
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }
  };

  // Helper functions for sync UI
  const getSyncButtonText = () => {
    if (!syncStatus.isOnline) return 'Offline';
    if (syncStatus.isSyncing) return 'Syncing...';
    if (syncStatus.pendingOperations > 0) return `Sync Now (${syncStatus.pendingOperations})`;
    return 'Sync Now';
  };

  const getSyncButtonIcon = () => {
    if (!syncStatus.isOnline) return WifiOff;
    if (syncStatus.isSyncing) return RefreshCw;
    if (syncStatus.pendingOperations === 0) return CheckCircle;
    return RefreshCw;
  };

  // Calculate real-time statistics based on actual log data
  const today = new Date().toDateString();
  
  console.log('🔍 Dashboard Debug - Today:', today);
  console.log('🔍 Dashboard Debug - Employees:', employees.length);
  console.log('🔍 Dashboard Debug - Employee Logs:', employeeLogs.length);
  console.log('🔍 Dashboard Debug - Equipment:', equipment.length);
  console.log('🔍 Dashboard Debug - Equipment Logs:', equipmentLogs.length);
  
  // Debug log structure
  if (employeeLogs.length > 0) {
    console.log('🔍 Dashboard Debug - Sample Employee Log:', employeeLogs[0]);
  }
  if (equipmentLogs.length > 0) {
    console.log('🔍 Dashboard Debug - Sample Equipment Log:', equipmentLogs[0]);
  }
  
  // Calculate currently clocked-in employees (based on recent clock-in logs)
  const currentlyClockedInEmployees = employees.filter(emp => {
    const recentLog = employeeLogs
      .filter(log => (log.employeeId || log.employee_id) === emp.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    
    console.log(`🔍 Dashboard Debug - Employee ${emp.name} (${emp.id}):`, {
      hasLogs: employeeLogs.filter(log => (log.employeeId || log.employee_id) === emp.id).length > 0,
      recentLog: recentLog,
      isClockIn: recentLog?.action === 'clock-in',
      isToday: recentLog ? new Date(recentLog.timestamp).toDateString() === today : false
    });
    
    return recentLog?.action === 'clock-in' && new Date(recentLog.timestamp).toDateString() === today;
  }).length;
  
  const totalEmployees = employees.length;
  
  // Calculate currently in-use equipment (based on recent start-use logs)
  const currentlyInUseEquipment = equipment.filter(eq => {
    const recentLog = equipmentLogs
      .filter(log => (log.equipmentId || log.equipment_id) === eq.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    
    console.log(`🔍 Dashboard Debug - Equipment ${eq.name} (${eq.id}):`, {
      hasLogs: equipmentLogs.filter(log => (log.equipmentId || log.equipment_id) === eq.id).length > 0,
      recentLog: recentLog,
      isStartUse: recentLog?.action === 'start-use',
      isStandbyStart: recentLog?.action === 'standby-start'
    });
    
    return recentLog?.action === 'start-use';
  }).length;
  
  // Calculate currently in standby equipment (based on recent standby-start logs)
  const currentlyInStandbyEquipment = equipment.filter(eq => {
    const recentLog = equipmentLogs
      .filter(log => (log.equipmentId || log.equipment_id) === eq.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    return recentLog?.action === 'standby-start';
  }).length;
  
  // Total equipment in use or standby
  const activeEquipment = currentlyInUseEquipment + currentlyInStandbyEquipment;
  const totalEquipment = equipment.length;
  const maintenanceEquipment = equipment.filter(e => e.status === 'maintenance').length;
  
  console.log('🔍 Dashboard Debug - Final Results:', {
    currentlyClockedInEmployees,
    totalEmployees,
    currentlyInUseEquipment,
    currentlyInStandbyEquipment,
    activeEquipment,
    totalEquipment
  });
  
  const lowStockMaterials = materials.filter(m => m.status === 'low-stock').length;
  const outOfStockMaterials = materials.filter(m => m.status === 'out-of-stock').length;
  
  
  const totalSites = sites.length;
  
  // Combine all logs from separate tables with normalized entityId
  const allLogs = [
    ...employeeLogs.map(log => ({ ...log, entityType: 'employee', entityId: log.employeeId || log.employee_id })),
    ...equipmentLogs.map(log => ({ ...log, entityType: 'equipment', entityId: log.equipmentId || log.equipment_id })),
    ...materialLogs.map(log => ({ ...log, entityType: 'material', entityId: log.materialId || log.material_id }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  const todayLogs = allLogs.filter(log => 
    new Date(log.timestamp).toDateString() === today
  ).length;

  // Get recent logs (last 10)
  const recentLogs = allLogs.slice(0, 10);

  // Calculate site statistics
  const siteStats = sites.map(site => {
    const siteEmployees = employees.filter(emp => emp.site === site.id);
    const siteEquipment = equipment.filter(eq => eq.site === site.id);
    const siteMaterials = materials.filter(mat => mat.site === site.id);
    
    // Get active employees (those who clocked in today)
    const activeSiteEmployees = siteEmployees.filter(emp => {
      const recentLog = employeeLogs
        .filter(log => (log.employeeId || log.employee_id) === emp.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      return recentLog?.action === 'clock-in' && new Date(recentLog.timestamp).toDateString() === today;
    });

    // Get equipment in use
    const inUseSiteEquipment = siteEquipment.filter(eq => {
      const recentLog = equipmentLogs
        .filter(log => (log.equipmentId || log.equipment_id) === eq.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      return recentLog?.action === 'start-use';
    });

    // Get equipment in standby
    const standbySiteEquipment = siteEquipment.filter(eq => {
      const recentLog = equipmentLogs
        .filter(log => (log.equipmentId || log.equipment_id) === eq.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      return recentLog?.action === 'standby-start';
    });

    const activeSiteEquipment = inUseSiteEquipment.length + standbySiteEquipment.length;

    return {
      ...site,
      employeeCount: siteEmployees.length,
      activeEmployeeCount: activeSiteEmployees.length,
      equipmentCount: siteEquipment.length,
      activeEquipmentCount: activeSiteEquipment.length,
      inUseEquipmentCount: inUseSiteEquipment.length,
      standbyEquipmentCount: standbySiteEquipment.length,
      materialCount: siteMaterials.length,
      availableMaterialCount: siteMaterials.filter(mat => mat.status === 'available').length
    };
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'reports', label: 'Reports & Analytics', icon: FileText }
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex space-x-1 p-1 bg-gray-50 rounded-t-xl overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-1 justify-center whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-800 text-white shadow-lg'
                    : 'text-gray-600 hover:text-blue-800 hover:bg-blue-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sync Status Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <DataSourceToggle />
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center">
          <button
            onClick={handleSyncNow}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              syncStatus.isOnline
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!syncStatus.isOnline || syncStatus.isSyncing}
          >
            {React.createElement(getSyncButtonIcon(), { className: 'w-5 h-5' })}
            <span>{getSyncButtonText()}</span>
          </button>
          <span className={`text-xs ${syncStatus.isOnline ? 'text-green-600' : 'text-red-600'}`}>{syncStatus.isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Main Statistics Cards - Responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatsCard
              title="Employee Status"
              value={`${currentlyClockedInEmployees}/${totalEmployees}`}
              icon={Users}
              change={currentlyClockedInEmployees > 0 ? `${currentlyClockedInEmployees} currently clocked in` : 'No employees clocked in'}
              changeType={currentlyClockedInEmployees > 0 ? "increase" : "neutral"}
              color="blue"
            />
            <StatsCard
              title="Equipment Status"
              value={`${activeEquipment}/${totalEquipment}`}
              icon={Wrench}
              change={`${currentlyInUseEquipment} in use, ${currentlyInStandbyEquipment} in standby`}
              changeType={activeEquipment > 0 ? "increase" : "neutral"}
              color="green"
            />
            <StatsCard
              title="Material Alerts"
              value={lowStockMaterials + outOfStockMaterials}
              icon={Package}
              change={lowStockMaterials > 0 || outOfStockMaterials > 0 ? 'Needs attention' : 'All materials stocked'}
              changeType={lowStockMaterials > 0 || outOfStockMaterials > 0 ? "decrease" : "increase"}
              color="yellow"
            />
            <StatsCard
              title="Active Sites"
              value={totalSites}
              icon={Building}
              change={`${totalSites} operational sites`}
              changeType="increase"
              color="red"
            />
          </div>

          {/* Secondary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Today's Activity</h3>
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">{todayLogs}</div>
                <p className="text-xs md:text-sm text-gray-600">Total activities logged today</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Employee Status</h3>
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-gray-600">Clocked In:</span>
                  <span className="font-medium text-green-600">{currentlyClockedInEmployees}</span>
                </div>
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-gray-600">Not Clocked In:</span>
                  <span className="font-medium text-gray-600">{totalEmployees - currentlyClockedInEmployees}</span>
                </div>
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-medium text-blue-600">{totalEmployees}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Material Status</h3>
                <Package className="w-5 h-5 text-orange-600" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-gray-600">Available:</span>
                  <span className="font-medium text-green-600">{materials.filter(m => m.status === 'available').length}</span>
                </div>
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-gray-600">Low Stock:</span>
                  <span className="font-medium text-yellow-600">{lowStockMaterials}</span>
                </div>
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-gray-600">Out of Stock:</span>
                  <span className="font-medium text-red-600">{outOfStockMaterials}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Equipment Status</h3>
                <Wrench className="w-5 h-5 text-green-600" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-gray-600">In Use:</span>
                  <span className="font-medium text-blue-600">{currentlyInUseEquipment}</span>
                </div>
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-gray-600">In Standby:</span>
                  <span className="font-medium text-orange-600">{currentlyInStandbyEquipment}</span>
                </div>
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-gray-600">Available:</span>
                  <span className="font-medium text-green-600">{equipment.filter(e => e.status === 'available').length}</span>
                </div>
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-gray-600">Maintenance:</span>
                  <span className="font-medium text-yellow-600">{maintenanceEquipment}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity and Site Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Recent Activity</h3>
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {recentLogs.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No recent activity</p>
                ) : (
                  recentLogs.map((log) => {
                    const entity =
                      log.entityType === 'employee' ? employees.find(e => e.id === log.entityId) :
                      log.entityType === 'equipment' ? equipment.find(e => e.id === log.entityId) :
                      log.entityType === 'material' ? materials.find(m => m.id === log.entityId) :
                      sites.find(s => s.id === log.entityId);
                    const entityName =
                      entity?.name ||
                      log.employeeName || log.employee_name ||
                      log.equipmentName || log.equipment_name ||
                      log.materialName || log.material_name ||
                      log.entityId;
                    
                    // Check if this specific log represents an active activity
                    // For start activities, check if there's no corresponding end activity after it
                    const shouldShowTimer = isActiveActivity(log.action);
                    let isCurrentlyActive = false;
                    
                    if (shouldShowTimer) {
                      // Check if there's a corresponding end action AFTER this start action
                      const endActions = {
                        'clock-in': 'clock-out',
                        'start-use': 'stop-use',
                        'maintenance-start': 'maintenance-end',
                        'standby-start': 'standby-end'
                      };
                      
                      const expectedEndAction = endActions[log.action as keyof typeof endActions];
                      
                      // Look for any end action that happened AFTER this start action
                      const hasEndAction = allLogs.some(otherLog => 
                        otherLog.entityType === log.entityType &&
                        otherLog.entityId === log.entityId &&
                        otherLog.action === expectedEndAction &&
                        new Date(otherLog.timestamp) > new Date(log.timestamp)
                      );
                      
                      isCurrentlyActive = !hasEndAction;
                    }
                    
                    // Check if this is a completion activity that should show total duration
                    const shouldShowTotalDuration = isCompletionActivity(log.action);
                    const startLog = shouldShowTotalDuration ? findStartActivityForCompletion(allLogs, log) : null;
                    
                    return (
                      <div key={log.id} className="flex items-center space-x-3 p-2 md:p-3 bg-gray-50 rounded-lg">
                        <div className={`w-2 h-2 rounded-full ${
                          log.action.includes('in') || log.action.includes('start') ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <div className="flex-1">
                          <p className="text-xs md:text-sm font-medium text-gray-900">
                            {log.action.replace('-', ' ').toUpperCase()} • {entityName}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                            <span>•</span>
                            <span>{log.site}</span>
                            {shouldShowTimer && isCurrentlyActive && (
                              <>
                                <span>•</span>
                                <ActivityTimer 
                                  startTime={log.timestamp} 
                                  variant="short" 
                                  showIcon={true}
                                />
                              </>
                            )}
                            {shouldShowTotalDuration && startLog && (
                              <>
                                <span>•</span>
                                <TotalDurationDisplay 
                                  startTime={startLog.timestamp}
                                  endTime={log.timestamp}
                                  showIcon={true}
                                />
                              </>
                            )}
                            {log.quantity && (
                              <>
                                <span>•</span>
                                <span>Qty: {log.quantity}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Site Overview</h3>
                <Building className="w-5 h-5 text-purple-600" />
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {siteStats.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No sites registered</p>
                ) : (
                  siteStats.map((site) => (
                    <div key={site.id} className="p-2 md:p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm md:text-base text-gray-900">{site.name}</h4>
                        <span className="text-xs text-gray-500">{site.province}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <Users className="w-3 h-3 text-blue-600" />
                            <span className="font-medium">{site.activeEmployeeCount}/{site.employeeCount}</span>
                          </div>
                          <span className="text-gray-500">Clocked In</span>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <Wrench className="w-3 h-3 text-green-600" />
                            <span className="font-medium">{site.activeEquipmentCount}/{site.equipmentCount}</span>
                          </div>
                          <span className="text-gray-500">In Use/Standby</span>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <Package className="w-3 h-3 text-orange-600" />
                            <span className="font-medium">{site.availableMaterialCount}/{site.materialCount}</span>
                          </div>
                          <span className="text-gray-500">Available</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Alerts Section */}
          {(lowStockMaterials > 0 || outOfStockMaterials > 0 || maintenanceEquipment > 0) && (
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-200">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Alerts & Notifications</h3>
              </div>
              <div className="space-y-3">
                {outOfStockMaterials > 0 && (
                  <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-medium text-sm md:text-base text-red-900">Critical: {outOfStockMaterials} materials out of stock</p>
                      <p className="text-xs md:text-sm text-red-700">Immediate restocking required</p>
                    </div>
                  </div>
                )}
                {lowStockMaterials > 0 && (
                  <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-sm md:text-base text-yellow-900">Warning: {lowStockMaterials} materials running low</p>
                      <p className="text-xs md:text-sm text-yellow-700">Consider restocking soon</p>
                    </div>
                  </div>
                )}
                {maintenanceEquipment > 0 && (
                  <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <Wrench className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="font-medium text-sm md:text-base text-orange-900">Maintenance: {maintenanceEquipment} equipment units need attention</p>
                      <p className="text-xs md:text-sm text-orange-700">Schedule maintenance to avoid downtime</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'reports' && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <ReportsPanel
            employeeLogs={employeeLogs}
            equipmentLogs={equipmentLogs}
            materialLogs={materialLogs}
            timeLogs={timeLogs}
            employees={employees}
            equipment={equipment}
            materials={materials}
          />
        </div>
      )}
    </div>
  );
};