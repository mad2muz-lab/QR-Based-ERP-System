import React, { useState, useEffect } from 'react';
import {
  Users, Wrench, Package, Clock, TrendingUp, AlertTriangle,
  Building, BarChart3, FileText, RefreshCw, Wifi,
  WifiOff, CheckCircle, Database, Play, ArrowUpRight, ArrowDownRight,
  Activity, Sparkles, Shield, Bell, Calendar, ChevronRight
} from 'lucide-react';
import ReportsPanel from '../scanner/ReportsPanel';
import { DataStorage } from '../../utils/dataStorage';
import { AuthManager } from '../../utils/authUtils';
import { offlineSyncManager, SyncStatus } from '../../utils/offlineSync';
import { Employee, Equipment, Material, Site, TimeLog } from '../../types';
import { fetchData, getAllLogs, getCurrentDataSource } from '../../utils/dataProxy';
import DataSourceToggle from '../common/DataSourceToggle';
import { SampleDataInitializer } from '../../utils/sampleDataInitializer';
import ActivityTimer from '../common/ActivityTimer';
import TotalDurationDisplay from '../common/TotalDurationDisplay';
import { isActiveActivity, isCompletionActivity, findStartActivityForCompletion } from '../../utils/activityUtils';
import { InventoryStorageService } from '../../modules/inventory/utils/inventoryStorage';

interface DashboardProps {
  currentView?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ currentView }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'reports'>('overview');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(offlineSyncManager.getStatus());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataSource, setDataSource] = useState<'local' | 'supabase'>('local');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [employeeLogs, setEmployeeLogs] = useState<any[]>([]);
  const [equipmentLogs, setEquipmentLogs] = useState<any[]>([]);
  const [materialLogs, setMaterialLogs] = useState<any[]>([]);

  const loadData = async () => {
    setIsLoadingData(true);
    try {
      const currentSource = getCurrentDataSource();
      if (currentSource === 'localstorage') {
        SampleDataInitializer.initializeSampleData();
      }

      setDataSource(currentSource === 'supabase' ? 'supabase' : 'local');

      const [empData, eqData, matData, siteData, logData, separateLogsData] = await Promise.all([
        fetchData('employees'),
        fetchData('equipment'),
        fetchData('materials'),
        fetchData('sites'),
        fetchData('time_logs'),
        getAllLogs()
      ]);

      // Merge with inventory items
      const inv = InventoryStorageService.getInstance().getItems();
      const matMerged = (matData as Material[]).slice();
      const matIds = new Set(matMerged.map(m => m.id));
      for (const im of inv) {
        if (!matIds.has(im.id)) {
          matMerged.push({
            id: im.id,
            name: im.name || '',
            type: im.category || '',
            unit: im.unit || '',
            site: im.warehouseId || '',
            qrCode: im.qrCode || im.id,
            quantity: im.quantity,
            status: im.status === 'out_of_stock' ? 'out-of-stock' :
                    im.status === 'low_stock' ? 'low-stock' : 'available',
            createdAt: im.lastReceived || new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
          } as Material);
        }
      }

      setEmployees(empData as Employee[]);
      setEquipment(eqData as Equipment[]);
      setMaterials(matMerged);
      setSites(siteData as Site[]);
      setTimeLogs(logData as TimeLog[]);

      if (separateLogsData && typeof separateLogsData === 'object' && 'employeeLogs' in separateLogsData) {
        setEmployeeLogs(separateLogsData.employeeLogs || []);
        setEquipmentLogs(separateLogsData.equipmentLogs || []);
        setMaterialLogs(separateLogsData.materialLogs || []);
      } else {
        setEmployeeLogs([]);
        setEquipmentLogs([]);
        setMaterialLogs([]);
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
    const handleLogUpdate = () => loadData();
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && (
        e.key === 'qr_system_employee_logs' ||
        e.key === 'qr_system_equipment_logs' ||
        e.key === 'qr_system_material_logs'
      )) {
        handleLogUpdate();
      }
    };

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

  useEffect(() => {
    if (currentView === 'dashboard') loadData();
  }, [currentView]);

  const handleSyncNow = async () => {
    if (syncStatus.isOnline && !syncStatus.isSyncing) {
      setIsSyncing(true);
      try { await offlineSyncManager.forcSync(); } catch (e) { console.error(e); }
    }
  };

  const activeEmployees = employees.filter(e => e.status === 'active').length;
  const totalEmployees = employees.length;
  const activeEquipment = equipment.filter(e => e.status === 'in-use').length;
  const totalEquipment = equipment.length;
  const maintenanceEquipment = equipment.filter(e => e.status === 'maintenance').length;
  const lowStockMaterials = materials.filter(m => m.status === 'low-stock').length;
  const outOfStockMaterials = materials.filter(m => m.status === 'out-of-stock').length;
  const totalMaterials = materials.length;
  const totalSites = sites.length;

  const today = new Date().toDateString();
  const allLogs = [
    ...employeeLogs.map(log => ({ ...log, entityType: 'employee', entityId: log.employeeId })),
    ...equipmentLogs.map(log => ({ ...log, entityType: 'equipment', entityId: log.equipmentId })),
    ...materialLogs.map(log => ({ ...log, entityType: 'material', entityId: log.materialId }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const todayLogs = allLogs.filter(log => new Date(log.timestamp).toDateString() === today).length;
  const recentLogs = allLogs.slice(0, 8);

  // Headline KPI cards
  const kpis = [
    {
      label: 'Total Active Workforce',
      value: activeEmployees,
      sub: `${totalEmployees} registered`,
      delta: '+12%',
      deltaUp: true,
      icon: Users,
      gradient: 'from-indigo-500 via-blue-500 to-cyan-500',
      glow: 'shadow-indigo-500/30',
    },
    {
      label: 'Equipment Live',
      value: `${activeEquipment}/${totalEquipment}`,
      sub: `${maintenanceEquipment} in maintenance`,
      delta: '92%',
      deltaUp: true,
      icon: Wrench,
      gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
      glow: 'shadow-emerald-500/30',
    },
    {
      label: 'Materials Tracked',
      value: totalMaterials,
      sub: `${lowStockMaterials} low · ${outOfStockMaterials} out`,
      delta: outOfStockMaterials > 0 ? 'Action needed' : 'Healthy',
      deltaUp: outOfStockMaterials === 0,
      icon: Package,
      gradient: 'from-amber-500 via-orange-500 to-pink-500',
      glow: 'shadow-amber-500/30',
    },
    {
      label: "Today's Activity",
      value: todayLogs,
      sub: 'Across all sites',
      delta: 'Live',
      deltaUp: true,
      icon: Activity,
      gradient: 'from-fuchsia-500 via-purple-500 to-indigo-500',
      glow: 'shadow-fuchsia-500/30',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
              </span>
              <span className="text-xs font-medium text-slate-500">Operations Command Center</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Good day, Operator</h1>
            <p className="text-sm text-slate-500 mt-0.5">Real-time overview of workforce, equipment, and inventory across all sites.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 shadow-sm">
              <DataSourceToggle />
            </div>
            <button
              onClick={handleSyncNow}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border shadow-sm transition ${
                syncStatus.isOnline
                  ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {syncStatus.isOnline ? <Wifi className="w-4 h-4 text-emerald-600" /> : <WifiOff className="w-4 h-4 text-slate-400" />}
              <span>{syncStatus.isOnline ? 'Synced' : 'Offline'}</span>
            </button>
            <button className="relative w-10 h-10 rounded-lg border border-slate-200 bg-white shadow-sm flex items-center justify-center hover:bg-slate-50 transition">
              <Bell className="w-4 h-4 text-slate-600" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
            </button>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k, i) => {
            const Icon = k.icon;
            return (
              <div key={i} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center bg-gradient-to-br ${k.gradient} text-white shadow-sm`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${k.deltaUp ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {k.deltaUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {k.delta}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">{k.value}</div>
                  <div className="text-sm font-medium text-slate-700 mt-1">{k.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{k.sub}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main grid: activity + quick actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Activity */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">Live Activity Feed</h3>
                <p className="text-xs text-slate-500">Real-time operations across all sites</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Streaming
              </div>
            </div>
            <div className="p-3 sm:p-5 space-y-2 max-h-[460px] overflow-y-auto">
              {recentLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No recent activity yet. Start scanning to see updates.
                </div>
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

                  const isStart = log.action.includes('in') || log.action.includes('start');
                  const accent = log.entityType === 'employee' ? 'bg-indigo-50 text-indigo-700' :
                                 log.entityType === 'equipment' ? 'bg-emerald-50 text-emerald-700' :
                                 log.entityType === 'material' ? 'bg-amber-50 text-amber-700' :
                                 'bg-slate-100 text-slate-600';

                  return (
                    <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${accent}`}>
                        {log.entityType === 'employee' ? <Users className="w-4 h-4" /> :
                         log.entityType === 'equipment' ? <Wrench className="w-4 h-4" /> :
                         <Package className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${isStart ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {log.action.replace('-', ' ').toUpperCase()} · {entityName}
                        </p>
                        <p className="text-xs text-slate-500">{log.site || '—'} · {new Date(log.timestamp).toLocaleString()}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Quick Actions</h3>
              <p className="text-xs text-slate-500">Jump into common workflows</p>
            </div>
            <div className="p-5 space-y-2.5">
              {[
                { to: '/scanner', icon: Scan, color: 'bg-indigo-50 text-indigo-600', title: 'Open QR Scanner', desc: 'Scan badges, equipment, materials' },
                { to: '/workers', icon: Users, color: 'bg-emerald-50 text-emerald-600', title: 'Register Worker', desc: 'Add a new employee to the system' },
                { to: '/materials', icon: Package, color: 'bg-amber-50 text-amber-600', title: 'Inventory Hub', desc: 'Manage materials & stock' },
                { to: '/aop', icon: BarChart3, color: 'bg-fuchsia-50 text-fuchsia-600', title: 'AOP Dashboard', desc: 'Budget & financial management' },
              ].map((a) => {
                const AIcon = a.icon;
                return (
                  <button key={a.to} onClick={() => window.location.href = a.to}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition text-left">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${a.color}`}>
                      <AIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900">{a.title}</div>
                      <div className="text-xs text-slate-500 truncate">{a.desc}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Secondary grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-900">Sites Overview</h3>
                <p className="text-xs text-slate-500">{totalSites} active locations</p>
              </div>
              <Building className="w-5 h-5 text-slate-400" />
            </div>
            <div className="space-y-2.5 max-h-64 overflow-y-auto">
              {sites.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-6">No sites registered</p>
              ) : sites.map(site => (
                <div key={site.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-slate-900">{site.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">{site.status}</span>
                  </div>
                  <div className="text-xs text-slate-500">{site.address}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-900">Material Health</h3>
                <p className="text-xs text-slate-500">Stock status breakdown</p>
              </div>
              <Package className="w-5 h-5 text-slate-400" />
            </div>
            <div className="space-y-4">
              {[
                { label: 'Available', value: materials.filter(m => m.status === 'available').length, color: 'bg-emerald-500', text: 'text-emerald-600' },
                { label: 'Low Stock', value: lowStockMaterials, color: 'bg-amber-500', text: 'text-amber-600' },
                { label: 'Out of Stock', value: outOfStockMaterials, color: 'bg-rose-500', text: 'text-rose-600' },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-600">{row.label}</span>
                    <span className={`font-semibold ${row.text}`}>{row.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full ${row.color}`} style={{ width: `${(row.value / Math.max(totalMaterials, 1)) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-900">Equipment Status</h3>
                <p className="text-xs text-slate-500">Fleet utilization</p>
              </div>
              <Wrench className="w-5 h-5 text-slate-400" />
            </div>
            <div className="space-y-4">
              {[
                { label: 'Available', value: equipment.filter(e => e.status === 'available').length, color: 'bg-emerald-500', text: 'text-emerald-600' },
                { label: 'In Use', value: activeEquipment, color: 'bg-indigo-500', text: 'text-indigo-600' },
                { label: 'Maintenance', value: maintenanceEquipment, color: 'bg-amber-500', text: 'text-amber-600' },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-600">{row.label}</span>
                    <span className={`font-semibold ${row.text}`}>{row.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full ${row.color}`} style={{ width: `${(row.value / Math.max(totalEquipment, 1)) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts */}
        {(outOfStockMaterials > 0 || lowStockMaterials > 0 || maintenanceEquipment > 0) && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-slate-900">Alerts & Action Items</h3>
              </div>
              <span className="text-xs font-medium text-slate-500">{outOfStockMaterials + lowStockMaterials + maintenanceEquipment} total</span>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-3">
              {outOfStockMaterials > 0 && (
                <div className="p-4 rounded-lg bg-rose-50 border border-rose-100">
                  <div className="text-xs font-semibold text-rose-700 uppercase tracking-wide">Critical</div>
                  <div className="mt-1 text-sm font-medium text-rose-900">{outOfStockMaterials} materials out of stock</div>
                  <div className="text-xs text-rose-700 mt-1">Immediate restocking required</div>
                </div>
              )}
              {lowStockMaterials > 0 && (
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
                  <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Warning</div>
                  <div className="mt-1 text-sm font-medium text-amber-900">{lowStockMaterials} materials running low</div>
                  <div className="text-xs text-amber-700 mt-1">Plan restocking soon</div>
                </div>
              )}
              {maintenanceEquipment > 0 && (
                <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-100">
                  <div className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Maintenance</div>
                  <div className="mt-1 text-sm font-medium text-indigo-900">{maintenanceEquipment} equipment units need attention</div>
                  <div className="text-xs text-indigo-700 mt-1">Schedule service to avoid downtime</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AOP banner */}
        <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
          <div className="p-6 bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Annual Operating Plan (AOP)</h3>
                <p className="text-sm text-white/60">Activate budget tracking and financial management</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => window.location.href = '/aop'} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition">View Dashboard</button>
              <button onClick={() => window.location.href = '/aop/setup'} className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-sm font-semibold transition">Activate AOP</button>
            </div>
          </div>
        </div>

        {/* Reports */}
        {activeTab === 'reports' && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
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
    </div>
  );
};
