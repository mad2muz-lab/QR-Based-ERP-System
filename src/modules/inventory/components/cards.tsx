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
  blue: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e3a8a', iconBg: '#dbeafe', iconColor: '#1d4ed8' },
  green: { bg: '#ecfdf5', border: '#a7f3d0', text: '#064e3b', iconBg: '#d1fae5', iconColor: '#059669' },
  yellow: { bg: '#fffbeb', border: '#fde68a', text: '#78350f', iconBg: '#fef3c7', iconColor: '#d97706' },
  red: { bg: '#fef2f2', border: '#fecaca', text: '#7f1d1d', iconBg: '#fee2e2', iconColor: '#dc2626' },
  purple: { bg: '#f5f3ff', border: '#ddd6fe', text: '#4c1d95', iconBg: '#ede9fe', iconColor: '#7c3aed' },
  gray: { bg: '#f8fafc', border: '#e2e8f0', text: '#0f172a', iconBg: '#f1f5f9', iconColor: '#475569' }
};

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, change, color = 'gray', subtitle }) => {
  const colors = colorMap[color] || colorMap.gray;
  return (
    <div style={{ background: colors.bg, border: `2px solid ${colors.border}`, borderRadius: '16px', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '16px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 0' }}>{title}</p>
          <p style={{ fontSize: '36px', fontWeight: '800', color: colors.text, margin: 0 }}>{value}</p>
          {subtitle && <p style={{ fontSize: '16px', color: '#475569', fontWeight: '600', marginTop: '4px' }}>{subtitle}</p>}
          {change && <p style={{ fontSize: '16px', color: '#334155', fontWeight: '600', marginTop: '6px' }}>{change}</p>}
        </div>
        <div style={{ background: colors.iconBg, padding: '14px', borderRadius: '12px' }}>
          <Icon style={{ width: '24px', height: '24px', color: colors.iconColor }} />
        </div>
      </div>
    </div>
  );
};

export const RegionCard: React.FC<{ region: Region; onClick: (r: Region) => void }> = ({ region, onClick }) => (
  <div
    onClick={() => onClick(region)}
    className="bg-white dark:bg-[#131B2A] rounded-2xl border border-slate-200/90 dark:border-[#202C3F] hover:border-emerald-500/50 dark:hover:border-emerald-500/40 p-6 cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 group flex flex-col justify-between"
  >
    <div>
      <div className="flex items-center gap-4 mb-4">
        <div
          className="w-13 h-13 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md flex-shrink-0 transition-transform group-hover:scale-105"
          style={{ background: region.color }}
        >
          {region.name[0]}
        </div>
        <div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-lg sm:text-xl group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-tight">
            {region.name}
          </h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-0.5" dir="rtl">{region.arabicName}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {region.warehouses.length} Active Facilities
            </span>
          </div>
        </div>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Regional Hub & Logistic Distribution Nodes</p>
    </div>

    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Tap to inspect facilities</span>
      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-all flex items-center gap-1">
        Explore Warehouses →
      </span>
    </div>
  </div>
);

export const WarehouseCard: React.FC<{
  warehouse: Warehouse;
  stats: { totalItems: number; totalQuantity: number; totalValue: number; lowStockCount: number };
  onClick: (id: string) => void;
}> = ({ warehouse, stats, onClick }) => {
  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    active: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900/50' },
    maintenance: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-900/50' },
    full: { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-900/50' }
  };
  const status = statusColors[warehouse.status] || statusColors.active;

  return (
    <div
      onClick={() => onClick(warehouse.id)}
      className="bg-white dark:bg-[#131B2A] rounded-2xl border border-slate-200/90 dark:border-[#202C3F] hover:border-emerald-500/50 dark:hover:border-emerald-500/40 p-6 cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
            <Archive className="w-6 h-6 text-slate-600 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
              {warehouse.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                {warehouse.code}
              </span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{warehouse.city}</span>
            </div>
          </div>
        </div>
        <span className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider border ${status.bg} ${status.text} ${status.border}`}>
          {warehouse.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50/90 dark:bg-[#0B0F17]/70 rounded-xl border border-slate-100 dark:border-slate-800/80">
        <div>
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Catalog Items</span>
          <div className="font-black text-slate-900 dark:text-white text-xl mt-0.5">{stats.totalItems}</div>
        </div>
        <div>
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Quantity</span>
          <div className="font-black text-slate-900 dark:text-white text-xl mt-0.5">{stats.totalQuantity.toLocaleString()}</div>
        </div>
        <div>
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Stock Valuation</span>
          <div className="font-black text-slate-900 dark:text-slate-200 text-xl mt-0.5">SAR {(stats.totalValue / 1000).toFixed(0)}k</div>
        </div>
        <div>
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Alerts</span>
          <div className={`font-black text-xl mt-0.5 ${stats.lowStockCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
            {stats.lowStockCount}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
        <span>Manager: <strong className="text-slate-700 dark:text-slate-300">{warehouse.manager}</strong></span>
        <span className="font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-all flex items-center gap-1">
          View Facility Details →
        </span>
      </div>
    </div>
  );
};
