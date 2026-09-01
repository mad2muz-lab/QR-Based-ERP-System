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
  <div onClick={() => onClick(region)} style={{ background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', padding: '24px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.2s' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
      <div style={{ width: '56px', height: '56px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '22px', background: region.color, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        {region.name[0]}
      </div>
      <div>
        <h3 style={{ fontWeight: '700', color: '#0f172a', fontSize: '20px', margin: '0 0 4px 0' }}>{region.name}</h3>
        <p style={{ fontSize: '16px', color: '#475569', margin: '0 0 2px 0', fontWeight: '500' }}>{region.arabicName}</p>
        <p style={{ fontSize: '15px', color: '#64748b', fontWeight: '600', margin: 0 }}>{region.warehouses.length} warehouses</p>
      </div>
    </div>
    <p style={{ fontSize: '14px', fontWeight: '700', color: '#2563eb', margin: 0 }}>View details →</p>
  </div>
);

export const WarehouseCard: React.FC<{
  warehouse: Warehouse;
  stats: { totalItems: number; totalQuantity: number; totalValue: number; lowStockCount: number };
  onClick: (id: string) => void;
}> = ({ warehouse, stats, onClick }) => {
  const statusColors: Record<string, { bg: string; text: string }> = {
    active: { bg: '#d1fae5', text: '#065f46' },
    maintenance: { bg: '#fef3c7', text: '#92400e' },
    full: { bg: '#fee2e2', text: '#991b1b' }
  };
  const status = statusColors[warehouse.status] || statusColors.active;

  return (
    <div onClick={() => onClick(warehouse.id)} style={{ background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', padding: '24px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.2s' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '48px', height: '48px', background: '#f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Archive style={{ width: '22px', height: '22px', color: '#475569' }} />
          </div>
          <div>
            <h3 style={{ fontWeight: '700', color: '#0f172a', fontSize: '18px', margin: '0 0 2px 0' }}>{warehouse.name}</h3>
            <p style={{ fontSize: '15px', color: '#475569', fontWeight: '500', margin: 0 }}>{warehouse.code} • {warehouse.city}</p>
          </div>
        </div>
        <span style={{ padding: '6px 14px', fontSize: '13px', fontWeight: '700', borderRadius: '20px', background: status.bg, color: status.text }}>{warehouse.status}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
        <div>
          <p style={{ color: '#475569', fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Items</p>
          <p style={{ fontWeight: '800', color: '#0f172a', fontSize: '24px', margin: 0 }}>{stats.totalItems}</p>
        </div>
        <div>
          <p style={{ color: '#475569', fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Qty</p>
          <p style={{ fontWeight: '800', color: '#0f172a', fontSize: '24px', margin: 0 }}>{stats.totalQuantity.toLocaleString()}</p>
        </div>
        <div>
          <p style={{ color: '#475569', fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Value</p>
          <p style={{ fontWeight: '800', color: '#0f172a', fontSize: '24px', margin: 0 }}>SAR {(stats.totalValue / 1000).toFixed(0)}k</p>
        </div>
        <div>
          <p style={{ color: '#475569', fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Alerts</p>
          <p style={{ fontWeight: '800', color: stats.lowStockCount > 0 ? '#dc2626' : '#059669', fontSize: '24px', margin: 0 }}>{stats.lowStockCount}</p>
        </div>
      </div>
      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>Manager: {warehouse.manager}</span>
        <span style={{ fontSize: '14px', color: '#2563eb', fontWeight: '700' }}>View →</span>
      </div>
    </div>
  );
};
