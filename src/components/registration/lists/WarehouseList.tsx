import React, { useState } from 'react';
import { Building2, Edit, Trash2 } from 'lucide-react';
import { Warehouse } from '../../../modules/inventory/data/ksaData';

interface WarehouseListProps {
  warehouses: Warehouse[];
  onEdit: (warehouse: Warehouse) => void;
  onDelete: (id: string) => void;
}

const WarehouseList: React.FC<WarehouseListProps> = ({ warehouses, onEdit, onDelete }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return { bg: '#d1fae5', text: '#065f46' };
      case 'maintenance': return { bg: '#fef3c7', text: '#92400e' };
      case 'full': return { bg: '#fee2e2', text: '#991b1b' };
      default: return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  if (warehouses.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Building2 style={{ width: '48px', height: '48px', color: '#9ca3af', margin: '0 auto 16px' }} />
        <p style={{ fontSize: '18px', color: '#4b5563', fontWeight: '600' }}>No warehouses registered yet.</p>
        <p style={{ fontSize: '14px', color: '#9ca3af' }}>Register your first warehouse to get started.</p>
      </div>
    );
  }

  return (
    <div>
      <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>Registered Warehouses ({warehouses.length})</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {warehouses.map(wh => {
          const status = getStatusColor(wh.status);
          return (
            <div key={wh.id} style={{ background: 'white', border: '2px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', background: '#f0fdf4', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Building2 style={{ width: '22px', height: '22px', color: '#059669' }} />
                  </div>
                  <div>
                    <h5 style={{ fontWeight: '700', color: '#0f172a', fontSize: '16px', margin: 0 }}>{wh.name}</h5>
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0 0 0' }}>{wh.code} • {wh.city}</p>
                  </div>
                </div>
                <span style={{ padding: '4px 12px', fontSize: '12px', fontWeight: '700', borderRadius: '20px', background: status.bg, color: status.text }}>{wh.status}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', color: '#4b5563', marginBottom: '12px' }}>
                <div><span style={{ fontWeight: '600' }}>Manager:</span> {wh.manager}</div>
                <div><span style={{ fontWeight: '600' }}>Capacity:</span> {wh.capacity.toLocaleString()}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => onEdit(wh)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', background: '#eff6ff', color: '#1d4ed8', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                >
                  <Edit style={{ width: '14px', height: '14px' }} /> Edit
                </button>
                <button
                  onClick={() => onDelete(wh.id)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                >
                  <Trash2 style={{ width: '14px', height: '14px' }} /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WarehouseList;
