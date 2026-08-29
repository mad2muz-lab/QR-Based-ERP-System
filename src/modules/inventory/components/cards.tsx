import React from 'react';
import { Package, AlertTriangle, TrendingUp, TrendingDown, MapPin, Box, Archive } from 'lucide-react';
import { Region, Warehouse } from '../data/ksaData';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  change?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  subtitle?: string;
}

const colorMap: Record<string, { bg: string; border: string; text: string; iconBg: string; iconColor: string }> = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
  green: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  yellow: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
  red: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-900', iconBg: 'bg-rose-100', iconColor: 'text-rose-600' },
  purple: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-900', iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
  gray: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-900', iconBg: 'bg-slate-100', iconColor: 'text-slate-600' }
};

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, change, color = 'gray', subtitle }) => {
  const colors = colorMap[color] || colorMap.gray;
  return (
    <div className={`${colors.bg} ${colors.border} border rounded-xl p-5`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase">{title}</p>
          <p className={`text-2xl font-bold ${colors.text} mt-1`}>{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          {change && <p className="text-xs text-slate-600 mt-2">{change}</p>}
        </div>
        <div className={`${colors.iconBg} p-3 rounded-lg`}>
          <Icon className={`w-5 h-5 ${colors.iconColor}`} />
        </div>
      </div>
    </div>
  );
};

export const RegionCard: React.FC<{ region: Region; onClick: (r: Region) => void }> = ({ region, onClick }) => (
  <div onClick={() => onClick(region)} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 cursor-pointer hover:shadow-md transition-shadow">
    <div className="flex items-center space-x-3 mb-3">
      <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: region.color }}>
        {region.name[0]}
      </div>
      <div>
        <h3 className="font-semibold text-slate-900">{region.name}</h3>
        <p className="text-xs text-slate-500">{region.arabicName}</p>
        <p className="text-xs text-slate-400">{region.warehouses.length} sites</p>
      </div>
    </div>
    <p className="text-sm text-blue-600 hover:underline">View details →</p>
  </div>
);

export const WarehouseCard: React.FC<{
  warehouse: Warehouse;
  stats: { totalItems: number; totalQuantity: number; totalValue: number; lowStockCount: number };
  onClick: (id: string) => void;
}> = ({ warehouse, stats, onClick }) => {
  const statusColors: Record<string, string> = { active: 'bg-emerald-100 text-emerald-700', maintenance: 'bg-amber-100 text-amber-700', full: 'bg-rose-100 text-rose-700' };
  return (
    <div onClick={() => onClick(warehouse.id)} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 cursor-pointer hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
            <Archive className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{warehouse.name}</h3>
            <p className="text-xs text-slate-500">{warehouse.code} • {warehouse.city}</p>
          </div>
        </div>
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[warehouse.status]}`}>{warehouse.status}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><p className="text-slate-500 text-xs">Items</p><p className="font-semibold">{stats.totalItems}</p></div>
        <div><p className="text-slate-500 text-xs">Qty</p><p className="font-semibold">{stats.totalQuantity.toLocaleString()}</p></div>
        <div><p className="text-slate-500 text-xs">Value</p><p className="font-semibold">SAR {(stats.totalValue / 1000).toFixed(0)}k</p></div>
        <div><p className="text-slate-500 text-xs">Alerts</p><p className={`font-semibold ${stats.lowStockCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{stats.lowStockCount}</p></div>
      </div>
      <div className="mt-3 pt-3 border-t text-xs text-slate-500 flex justify-between">
        <span>Manager: {warehouse.manager}</span>
        <span className="text-blue-600">View →</span>
      </div>
    </div>
  );
};
