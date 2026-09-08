import React, { useState, useEffect } from 'react';
import { Building2, AlertCircle, X, MapPin, Navigation, Loader2, CheckCircle2 } from 'lucide-react';
import { Warehouse } from '../../../modules/inventory/data/ksaData';
import { REGIONS } from '../../../modules/inventory/data/ksaData';
import { ksaCitiesData } from '../../../data/ksaCitiesData';

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
  const [isLocating, setIsLocating] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isCustomCity, setIsCustomCity] = useState(false);

  const isEditMode = !!initialData;

  useEffect(() => {
    if (initialData) {
      const cityInList = ksaCitiesData.some(c => c.city.toLowerCase() === (initialData.city || '').toLowerCase());
      setIsCustomCity(!!initialData.city && !cityInList);
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

  const handleCitySelect = (selectedCityName: string) => {
    if (selectedCityName === '__custom__') {
      setIsCustomCity(true);
      setFormData(prev => ({ ...prev, city: '' }));
      return;
    }

    setIsCustomCity(false);
    const cityData = ksaCitiesData.find(c => c.city === selectedCityName);
    if (cityData) {
      setFormData(prev => ({
        ...prev,
        city: cityData.city,
        coordinates: {
          lat: cityData.latitude,
          lng: cityData.longitude
        },
        address: prev.address || `${cityData.city}, ${cityData.province}, Saudi Arabia`
      }));
      setGpsStatus({
        type: 'info',
        text: `Default GPS coordinates applied for ${cityData.city} (${cityData.latitude.toFixed(4)}, ${cityData.longitude.toFixed(4)})`
      });
    } else {
      setFormData(prev => ({ ...prev, city: selectedCityName }));
    }
  };

  const handleGetGPSLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus({
        type: 'error',
        text: 'Geolocation is not supported by your browser or device.'
      });
      return;
    }

    setIsLocating(true);
    setGpsStatus({
      type: 'info',
      text: 'Acquiring high-accuracy GPS coordinates from your device...'
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        const accuracy = Math.round(position.coords.accuracy);

        // Find closest city in KSA if city isn't set or custom
        let closestCity = '';
        let minDistance = Infinity;
        ksaCitiesData.forEach(c => {
          const dist = Math.hypot(c.latitude - lat, c.longitude - lng);
          if (dist < minDistance) {
            minDistance = dist;
            closestCity = c.city;
          }
        });

        setFormData(prev => {
          const updated = {
            ...prev,
            coordinates: { lat, lng }
          };
          if (!prev.city && closestCity && minDistance < 0.6) {
            updated.city = closestCity;
            setIsCustomCity(false);
          }
          return updated;
        });

        setIsLocating(false);
        setGpsStatus({
          type: 'success',
          text: `GPS Location acquired: ${lat.toFixed(4)}, ${lng.toFixed(4)} (Accuracy: ±${accuracy}m)`
        });
      },
      (error) => {
        setIsLocating(false);
        let errorMsg = 'Failed to acquire GPS location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Location permission was denied. Please allow location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location information is currently unavailable from your device.';
            break;
          case error.TIMEOUT:
            errorMsg = 'The request to get your location timed out. Please try again.';
            break;
        }
        setGpsStatus({ type: 'error', text: errorMsg });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>City (KSA) *</label>
              <button
                type="button"
                onClick={() => {
                  setIsCustomCity(!isCustomCity);
                  if (isCustomCity) {
                    setFormData(prev => ({ ...prev, city: '' }));
                  }
                }}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
              >
                {isCustomCity ? '← Choose from KSA Cities' : '+ Custom City'}
              </button>
            </div>
            {isCustomCity ? (
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Enter custom city name"
                style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '16px', outline: 'none' }}
                required
              />
            ) : (
              <select
                value={formData.city}
                onChange={(e) => handleCitySelect(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '16px', outline: 'none', background: 'white' }}
                required
              >
                <option value="">-- Select KSA Major City --</option>
                {ksaCitiesData.map(c => (
                  <option key={c.city} value={c.city}>
                    {c.city} ({c.province})
                  </option>
                ))}
                <option value="__custom__">+ Other / Custom City...</option>
              </select>
            )}
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

        {/* GPS Location Section */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin style={{ width: '18px', height: '18px', color: '#2563eb' }} />
                Warehouse GPS Location
              </span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Select a KSA city above for defaults or acquire live device GPS position
              </span>
            </div>
            <button
              type="button"
              onClick={handleGetGPSLocation}
              disabled={isLocating}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                background: isLocating ? '#94a3b8' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isLocating ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
                transition: 'background-color 0.2s'
              }}
            >
              {isLocating ? (
                <>
                  <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                  Detecting GPS...
                </>
              ) : (
                <>
                  <Navigation style={{ width: '16px', height: '16px' }} />
                  Get GPS Location
                </>
              )}
            </button>
          </div>

          {gpsStatus && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '500',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: gpsStatus.type === 'success' ? '#dcfce7' : gpsStatus.type === 'error' ? '#fee2e2' : '#e0f2fe',
              color: gpsStatus.type === 'success' ? '#166534' : gpsStatus.type === 'error' ? '#991b1b' : '#075985',
              border: `1px solid ${gpsStatus.type === 'success' ? '#bbf7d0' : gpsStatus.type === 'error' ? '#fecaca' : '#bae6fd'}`
            }}>
              {gpsStatus.type === 'success' ? <CheckCircle2 style={{ width: '16px', height: '16px', flexShrink: 0 }} /> : <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />}
              <span>{gpsStatus.text}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Latitude</label>
              <input
                type="number"
                step="0.000001"
                value={formData.coordinates.lat || ''}
                onChange={(e) => setFormData({ ...formData, coordinates: { ...formData.coordinates, lat: Number(e.target.value) || 0 } })}
                placeholder="e.g., 24.713600"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', outline: 'none', background: 'white' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Longitude</label>
              <input
                type="number"
                step="0.000001"
                value={formData.coordinates.lng || ''}
                onChange={(e) => setFormData({ ...formData, coordinates: { ...formData.coordinates, lng: Number(e.target.value) || 0 } })}
                placeholder="e.g., 46.675300"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', outline: 'none', background: 'white' }}
              />
            </div>
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
