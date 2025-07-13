import React, { useState, useEffect } from 'react';
import { Users, Wrench, Package, Clock, TrendingUp, AlertTriangle, Building, BarChart3, FileText, RefreshCw, Wifi, WifiOff, CheckCircle, Database } from 'lucide-react';
import StatsCard from './StatsCard';
import ReportsPanel from '../scanner/ReportsPanel';
import { DataStorage } from '../../utils/dataStorage';
import { SupabaseDataService } from '../../utils/supabaseDataService';
import { AuthManager } from '../../utils/authUtils';
import { offlineSyncManager, SyncStatus } from '../../utils/offlineSync';
import { Employee, Equipment, Material, Site, TimeLog } from '../../types';

interface DashboardProps {
  currentView?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ currentView }) => {
  const [activeTab, setActiveTab] = React.useState<'overview' | 'reports'>('overview');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(offlineSyncManager.getStatus());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataSource, setDataSource] = useState<'local' | 'supabase'>('local');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);

  // Load data based on current mode
  const loadData = async () => {
    setIsLoadingData(true);
    try {
      const useSupabase = AuthManager.useSupabase();
      setDataSource(useSupabase ? 'supabase' : 'local');
      
      if (useSupabase) {
        // Load from Supabase
        const [empData, eqData, matData, siteData, logData] = await Promise.all([
          SupabaseDataService.getEmployees(),
          SupabaseDataService.getEquipment(),
          SupabaseDataService.getMaterials(),
          SupabaseDataService.getSites(),
          SupabaseDataService.getTimeLogs()
        ]);
        
        setEmployees(empData);
        setEquipment(eqData);
        setMaterials(matData);
        setSites(siteData);
        setTimeLogs(logData);
      } else {
        // Load from local storage
        setEmployees(DataStorage.loadEmployees());
        setEquipment(DataStorage.loadEquipment());
        setMaterials(DataStorage.loadMaterials());
        setSites(DataStorage.loadSites());
        setTimeLogs(DataStorage.loadTimeLogs());
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    const handleStatusChange = (status: SyncStatus) => {
      setSyncStatus(status);
      setIsSyncing(status.isSyncing);
    };

    offlineSyncManager.addSyncListener(handleStatusChange);
    
    // Load initial data
    loadData();

    return () => {
      offlineSyncManager.removeSyncListener(handleStatusChange);
    };
  }, []);

  // Refresh data whenever user navigates back to dashboard
  useEffect(() => {
    if (currentView === 'dashboard') {
      loadData();
    }
  }, [currentView]);

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
  
  // Data is now loaded via useEffect and stored in state

  // Calculate real-time statistics
  const activeEmployees = employees.filter(e => e.status === 'active').length;
  const totalEmployees = employees.length;
  
  const activeEquipment = equipment.filter(e => e.status === 'in-use').length;
  const totalEquipment = equipment.length;
  const maintenanceEquipment = equipment.filter(e => e.status === 'maintenance').length;
  
  const lowStockMaterials = materials.filter(m => m.status === 'low-stock').length;
  const outOfStockMaterials = materials.filter(m => m.status === 'out-of-stock').length;
  const totalMaterials = materials.length;
  
  const totalSites = sites.length;
  
  // Calculate today's activities
  const today = new Date().toDateString();
  const todayLogs = timeLogs.filter(log => 
    new Date(log.timestamp).toDateString() === today
  ).length;

  // Get recent logs (last 10)
  const recentLogs = timeLogs.slice(-10).reverse();

  // Calculate site statistics
  const siteStats = sites.map(site => {
    const siteEmployees = employees.filter(emp => emp.site === site.id);
    const siteEquipment = equipment.filter(eq => eq.site === site.id);
    const siteMaterials = materials.filter(mat => mat.site === site.id);
    
    // Get active employees (those who clocked in today)
    const activeSiteEmployees = siteEmployees.filter(emp => {
      const recentLog = timeLogs
        .filter(log => log.entityId === emp.id && log.entityType === 'employee')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      return recentLog?.action === 'clock-in' && new Date(recentLog.timestamp).toDateString() === today;
    });

    // Get equipment in use
    const activeSiteEquipment = siteEquipment.filter(eq => {
      const recentLog = timeLogs
        .filter(log => log.entityId === eq.id && log.entityType === 'equipment')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      return recentLog?.action === 'start-use';
    });

    return {
      ...site,
      employeeCount: siteEmployees.length,
      activeEmployeeCount: activeSiteEmployees.length,
      equipmentCount: siteEquipment.length,
      activeEquipmentCount: activeSiteEquipment.length,
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
        <div className="flex space-x-1 p-1 bg-gray-50 rounded-t-xl">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-1 justify-center ${
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

      {/* Sync Status and Button */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              !syncStatus.isOnline ? 'bg-red-100 text-red-800' :
              syncStatus.isSyncing ? 'bg-blue-100 text-blue-800' :
              syncStatus.pendingOperations > 0 ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {!syncStatus.isOnline ? (
                <WifiOff className="w-4 h-4" />
              ) : syncStatus.isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : syncStatus.pendingOperations > 0 ? (
                <Clock className="w-4 h-4" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {!syncStatus.isOnline ? 'Offline' :
                 syncStatus.isSyncing ? 'Syncing data...' :
                 syncStatus.pendingOperations > 0 ? `${syncStatus.pendingOperations} items pending sync` :
                 'All data synced'}
              </span>
            </div>
            {syncStatus.lastSyncTime && (
              <span className="text-sm text-gray-500">
                Last sync: {new Date(syncStatus.lastSyncTime).toLocaleTimeString()}
              </span>
            )}
          </div>
          <button
            onClick={handleSyncNow}
            disabled={!syncStatus.isOnline || syncStatus.isSyncing}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              !syncStatus.isOnline || syncStatus.isSyncing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : syncStatus.pendingOperations > 0
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {React.createElement(getSyncButtonIcon(), {
              className: `w-4 h-4 ${syncStatus.isSyncing ? 'animate-spin' : ''}`
            })}
            <span>{getSyncButtonText()}</span>
          </button>
        </div>
        {syncStatus.errors.length > 0 && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {syncStatus.errors.length} sync error{syncStatus.errors.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="mt-1 text-xs text-red-600">
              Click the sync button to retry failed operations
            </div>
          </div>
        )}
      </div>

      {/* Data Source Indicator */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              dataSource === 'supabase' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}>
              <Database className="w-4 h-4" />
              <span className="text-sm font-medium">
                Data Source: {dataSource === 'supabase' ? 'Supabase Database' : 'Local Storage'}
              </span>
            </div>
            {isLoadingData && (
              <div className="flex items-center space-x-2 text-blue-600">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading data...</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadData}
              disabled={isLoadingData}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isLoadingData
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin' : ''}`} />
              <span>Refresh Data</span>
            </button>
            <a
              href="/enable-supabase.html"
              target="_blank"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-all duration-200"
            >
              <Database className="w-4 h-4" />
              <span>Switch Mode</span>
            </a>
          </div>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Main Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Active Employees"
              value={`${activeEmployees}/${totalEmployees}`}
              icon={Users}
              change={activeEmployees > 0 ? `${activeEmployees} currently active` : 'No active employees'}
              changeType={activeEmployees > 0 ? "increase" : "neutral"}
              color="blue"
            />
            <StatsCard
              title="Equipment Status"
              value={`${activeEquipment}/${totalEquipment}`}
              icon={Wrench}
              change={maintenanceEquipment > 0 ? `${maintenanceEquipment} in maintenance` : 'All equipment operational'}
              changeType={maintenanceEquipment > 0 ? "decrease" : "increase"}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Today's Activity</h3>
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{todayLogs}</div>
                <p className="text-sm text-gray-600">Total activities logged today</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Material Status</h3>
                <Package className="w-5 h-5 text-orange-600" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Available:</span>
                  <span className="font-medium text-green-600">{materials.filter(m => m.status === 'available').length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Low Stock:</span>
                  <span className="font-medium text-yellow-600">{lowStockMaterials}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Out of Stock:</span>
                  <span className="font-medium text-red-600">{outOfStockMaterials}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Equipment Status</h3>
                <Wrench className="w-5 h-5 text-green-600" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Available:</span>
                  <span className="font-medium text-green-600">{equipment.filter(e => e.status === 'available').length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">In Use:</span>
                  <span className="font-medium text-blue-600">{activeEquipment}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Maintenance:</span>
                  <span className="font-medium text-yellow-600">{maintenanceEquipment}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity and Site Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
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

                    return (
                      <div key={log.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`w-2 h-2 rounded-full ${
                          log.action.includes('in') || log.action.includes('start') ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {entity?.name || log.entityId} - {log.action.replace('-', ' ').toUpperCase()}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                            <span>•</span>
                            <span>{log.site}</span>
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

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Site Overview</h3>
                <Building className="w-5 h-5 text-purple-600" />
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {siteStats.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No sites registered</p>
                ) : (
                  siteStats.map((site) => (
                    <div key={site.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{site.name}</h4>
                        <span className="text-xs text-gray-500">{site.province}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <Users className="w-3 h-3 text-blue-600" />
                            <span className="font-medium">{site.activeEmployeeCount}/{site.employeeCount}</span>
                          </div>
                          <span className="text-gray-500">Employees</span>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <Wrench className="w-3 h-3 text-green-600" />
                            <span className="font-medium">{site.activeEquipmentCount}/{site.equipmentCount}</span>
                          </div>
                          <span className="text-gray-500">Equipment</span>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <Package className="w-3 h-3 text-orange-600" />
                            <span className="font-medium">{site.availableMaterialCount}/{site.materialCount}</span>
                          </div>
                          <span className="text-gray-500">Materials</span>
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
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                <h3 className="text-lg font-semibold text-gray-900">Alerts & Notifications</h3>
              </div>
              <div className="space-y-3">
                {outOfStockMaterials > 0 && (
                  <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-900">Critical: {outOfStockMaterials} materials out of stock</p>
                      <p className="text-sm text-red-700">Immediate restocking required</p>
                    </div>
                  </div>
                )}
                {lowStockMaterials > 0 && (
                  <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-900">Warning: {lowStockMaterials} materials running low</p>
                      <p className="text-sm text-yellow-700">Consider restocking soon</p>
                    </div>
                  </div>
                )}
                {maintenanceEquipment > 0 && (
                  <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <Wrench className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="font-medium text-orange-900">Maintenance: {maintenanceEquipment} equipment units need attention</p>
                      <p className="text-sm text-orange-700">Schedule maintenance to avoid downtime</p>
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
          <ReportsPanel />
        </div>
      )}
    </div>
  );
};