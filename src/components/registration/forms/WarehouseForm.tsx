import React, { useState, useEffect } from 'react';
import { Building2, AlertCircle, X } from 'lucide-react';
import { Warehouse } from '../../../modules/inventory/data/ksaData';
import { REGIONS } from '../../../modules/inventory/data/ksaData';

interface WarehouseFormProps {
  onSubmit: (warehouse: Omit<Warehouse, 'id'>) => void;
  initialData?: Warehouse | null;
  onClose?: () => void;
}

const WarehouseForm: React.FC<WarehouseFormProps> = ({ onSubmit, initialData, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    city: '',
    address: '',
    coordinates: { lat: 0, lng: 0 },
    manager: '',
    capacity: 0,
    established: '',
    status: 'active' as 'active' | 'maintenance' | 'full'
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [codeError, setCodeError] = useState('');

  const isEditMode = !!initialData;

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        code: initialData.code || '',
        city: initialData.city || '',
        address: initialData.address || '',
        coordinates: initialData.coordinates || { lat: 0, lng: 0 },
        manager: initialData.manager || '',
        capacity: initialData.capacity || 0,
        established: initialData.established || '',
        status: initialData.status || 'active'
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Warehouse name is required' });
      return;
    }
    if (!formData.code.trim()) {
      setMessage({ type: 'error', text: 'Warehouse code is required' });
      return;
    }
    if (!formData.city.trim()) {
      setMessage({ type: 'error', text: 'City is required' });
      return;
    }
    if (!formData.manager.trim()) {
      setMessage({ type: 'error', text: 'Manager name is required' });
      return;
    }
    if (formData.capacity <= 0) {
      setMessage({ type: 'error', text: 'Capacity must be greater than 0' });
      return;
    }

    try {
      onSubmit(formData);
      setMessage({ type: 'success', text: isEditMode ? 'Warehouse updated successfully!' : 'Warehouse registered successfully!' });
      if (!isEditMode) {
        setFormData({ name: '', code: '', city: '', address: '', coordinates: { lat: 0, lng: 0 }, manager: '', capacity: 0, established: '', status: 'active' });
        setCodeError('');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to register warehouse. Please try again.' });
    }
  };

  return (
    <div>
      {message && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', fontWeight: '600', background: message.type === 'success' ? '#d1fae5' : '#fee2e2', color: message.type === 'success' ? '#065f46' : '#991b1b' }}>
          {message.text}
        </div>
      )}
      <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Building2 style={{ width: '24px', height: '24px', color: '#059669' }} />
        {isEditMode ? 'Edit Warehouse' : 'Register New Warehouse'}
      </h3>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Warehouse Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Riyadh Main Warehouse"
              style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '16px', outline: 'none' }}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Warehouse Code *</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g., RYD-01"
              style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '16px', outline: 'none' }}
              required
            />
            {codeError && <p style={{ fontSize: '13px', color: '#dc2626', marginTop: '4px' }}>{codeError}</p>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>City *</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="e.g., Riyadh"
              style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '16px', outline: 'none' }}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Manager *</label>
            <input
              type="text"
              value={formData.manager}
              onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
              placeholder="e.g., Ahmed Al-Saud"
              style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '16px', outline: 'none' }}
              required
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Address</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="e.g., Industrial Area 2, Riyadh 11564"
            style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '16px', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Capacity (units) *</label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) || 0 })}
              placeholder="e.g., 50000"
              min="1"
              style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '16px', outline: 'none' }}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Established Date</label>
            <input
              type="date"
              value={formData.established}
              onChange={(e) => setFormData({ ...formData, established: e.target.value })}
              style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '16px', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '16px', outline: 'none', background: 'white' }}
            >
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="full">Full</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Latitude</label>
            <input
              type="number"
              step="0.0001"
              value={formData.coordinates.lat}
              onChange={(e) => setFormData({ ...formData, coordinates: { ...formData.coordinates, lat: Number(e.target.value) || 0 } })}
              placeholder="e.g., 24.7136"
              style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '16px', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Longitude</label>
            <input
              type="number"
              step="0.0001"
              value={formData.coordinates.lng}
              onChange={(e) => setFormData({ ...formData, coordinates: { ...formData.coordinates, lng: Number(e.target.value) || 0 } })}
              placeholder="e.g., 46.6753"
              style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '16px', outline: 'none' }}
            />
          </div>
        </div>

        <button
          type="submit"
          style={{ width: '100%', padding: '14px', background: '#059669', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', marginTop: '8px' }}
        >
          {isEditMode ? 'Update Warehouse' : 'Register Warehouse'}
        </button>
      </form>
    </div>
  );
};

export default WarehouseForm;
