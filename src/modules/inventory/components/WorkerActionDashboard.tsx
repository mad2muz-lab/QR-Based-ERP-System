import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Plus,
  LogOut,
  User,
  Building2,
  Clock,
  Package,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Wrench,
  TrendingUp
} from 'lucide-react';
import { DataStorage } from '../../../utils/dataStorage';
import { Employee } from '../../../types';
import { InventoryStorageService } from '../utils/inventoryStorage';

const WorkerActionDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const employeeData = localStorage.getItem('qr_system_current_employee');
    if (employeeData) {
      try {
        const emp = JSON.parse(employeeData);
        setEmployee(emp);
      } catch {
        const users = DataStorage.loadUsers();
        if (users.length > 0) {
          setEmployee(users[0] as any);
        }
      }
    } else {
      const users = DataStorage.loadUsers();
      if (users.length > 0) {
        setEmployee(users[0] as any);
      }
    }

    try {
      const inventoryService = InventoryStorageService.getInstance();
      const movements = inventoryService.getMovements();
      setRecentActivity(movements.slice(0, 5));
    } catch {
      setRecentActivity([]);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('qr_system_current_employee');
    localStorage.removeItem('qr_system_auth_token');
    localStorage.removeItem('qr_system_current_user');
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const actions = [
    {
      id: 'in',
      label: 'Material IN',
      desc: 'Receive materials into inventory',
      subDesc: 'Scan QR → Enter qty → Confirm',
      icon: ArrowUp,
      gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
      glow: 'shadow-emerald-500/30',
      iconBg: 'bg-emerald-500/20 text-emerald-600',
      route: '/inventory?defaultOperation=material-in',
    },
    {
      id: 'out',
      label: 'Material OUT',
      desc: 'Issue materials from inventory',
      subDesc: 'Scan QR → Enter qty → Confirm',
      icon: ArrowDown,
      gradient: 'from-rose-500 via-pink-500 to-fuchsia-600',
      glow: 'shadow-rose-500/30',
      iconBg: 'bg-rose-500/20 text-rose-600',
      route: '/inventory?defaultOperation=material-out',
    },
    {
      id: 'transfer',
      label: 'Transfer',
      desc: 'Move materials between warehouses',
      subDesc: 'Select from/to → Scan → Confirm',
      icon: RotateCcw,
      gradient: 'from-indigo-500 via-blue-500 to-cyan-500',
      glow: 'shadow-indigo-500/30',
      iconBg: 'bg-indigo-500/20 text-indigo-600',
      route: '/inventory?defaultOperation=transfer',
    },
    {
      id: 'register',
      label: 'Register New Material',
      desc: 'Add a new material to the system',
      subDesc: 'Fill form → Generate QR → Save',
      icon: Plus,
      gradient: 'from-fuchsia-500 via-purple-500 to-indigo-500',
      glow: 'shadow-fuchsia-500/30',
      iconBg: 'bg-fuchsia-500/20 text-fuchsia-600',
      route: '/register',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="relative overflow-hidden border-b border-slate-200 bg-white shadow-sm">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-emerald-500" />
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">CIRM Field Operations</h1>
              <p className="text-xs text-slate-500">Inventory Actions Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-900 flex items-center justify-end gap-1">
                <User className="w-3.5 h-3.5" />
                <span>{employee?.name || 'Field Worker'}</span>
              </p>
              <p className="text-xs text-slate-500">{employee?.department || 'Operations'} · {employee?.site || 'Main Site'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome banner */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 mb-8 shadow-lg">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-white/60 uppercase tracking-wide mb-1">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}</p>
              <h2 className="text-2xl sm:text-3xl font-bold">
                Welcome back, <span className="text-white/90">{employee?.name?.split(' ')[0] || 'Worker'}</span>!
              </h2>
              <p className="text-white/70 mt-2 flex items-center gap-2">
                {employee?.site && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-xs">
                    <Building2 className="w-3.5 h-3.5" />
                    {employee.site}
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-col items-end text-right">
              <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
                <Clock className="w-7 h-7 text-white/90" />
              </div>
              <p className="mt-2 text-sm text-white/80">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="text-xs text-white/60">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Total Items</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">540+</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Today's Moves</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{recentActivity.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Low Stock</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">3</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Shift Status</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">Active</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Grid */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            What would you like to do today?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => navigate(action.route)}
                  className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:border-transparent hover:shadow-xl flex flex-col ${action.glow}`}
                >
                  <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br opacity-50" style={{ background: action.gradient }} />
                  <div className="relative flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${action.iconBg}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="relative flex-1 flex flex-col">
                    <h4 className="text-lg font-semibold text-slate-900">{action.label}</h4>
                    <p className="text-sm text-slate-600 mt-1 flex-1">{action.desc}</p>
                    <p className="text-xs text-slate-500 mt-2 border-t border-slate-100 pt-2">{action.subDesc}</p>
                  </div>
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-slate-900">Recent Activity</h3>
            </div>
            <span className="text-xs text-slate-500">{recentActivity.length} movements</span>
          </div>
          <div className="p-5 space-y-3 max-h-72 overflow-y-auto">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => {
                const isReceived = activity.action === 'received';
                const accent = isReceived ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                               activity.action === 'issued' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                               'bg-indigo-50 text-indigo-700 border-indigo-100';
                return (
                  <div key={index} className="flex items-center justify-between p-3 rounded-xl border hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-semibold ${accent}`}>
                        {isReceived ? <ArrowUp className="w-4 h-4" /> :
                         activity.action === 'issued' ? <ArrowDown className="w-4 h-4" /> :
                         <RotateCcw className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{activity.itemName || activity.name || 'Material'}</p>
                        <p className="text-xs text-slate-500 capitalize">{activity.action} · {activity.quantity || 0} units</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">{formatTime(activity.timestamp)}</p>
                      {activity.status === 'out_of_stock' && (
                        <AlertTriangle className="w-4 h-4 text-rose-500 inline mt-1" />
                      )}
                      {activity.status === 'in_stock' && (
                        <CheckCircle className="w-4 h-4 text-emerald-500 inline mt-1" />
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-slate-400">
                <Package className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No recent activity yet</p>
                <p className="text-xs mt-1">Your inventory movements will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-2 gap-3">
          <button onClick={() => navigate('/scan')} className="rounded-xl border border-slate-200 bg-white p-4 hover:border-indigo-300 hover:bg-indigo-50/50 transition flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Open QR Scanner</p>
              <p className="text-xs text-slate-500">Scan badges, equipment, materials</p>
            </div>
          </button>
          <button onClick={() => navigate('/inventory')} className="rounded-xl border border-slate-200 bg-white p-4 hover:border-emerald-300 hover:bg-emerald-50/50 transition flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Full Inventory Hub</p>
              <p className="text-xs text-slate-500">Advanced search & management</p>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
};

export default WorkerActionDashboard;

