import React, { useState, useEffect } from 'react';
import { Building, X } from 'lucide-react';
import { Site } from '../../../types';
import { siteTypes } from '../../../data/materialTypes';
import SearchableLocationDropdown from '../../common/SearchableLocationDropdown';

interface SiteFormProps {
  onSubmit: (site: Omit<Site, 'id'>, isEdit?: boolean) => void;
  initialData?: Site | null;
  onClose?: () => void;
}

const SiteForm: React.FC<SiteFormProps> = ({ onSubmit, initialData, onClose }) => {
  const isEditMode = !!initialData;
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    customType: '',
    selectedLocation: '',
    coordinates: [0, 0] as [number, number],
    province: '',
    address: '',
    manager: ''
  });
  const [showCustomType, setShowCustomType] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Handle initial data for editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        type: initialData.type || '',
        customType: '',
        selectedLocation: '',
        coordinates: initialData.coordinates || [0, 0],
        province: initialData.province || '',
        address: initialData.address || '',
        manager: initialData.manager || ''
      });
      
      // Check if we need to show custom type
      const isCustomType = !siteTypes.includes(initialData.type || '');
      setShowCustomType(isCustomType);
      if (isCustomType) {
        setFormData(prev => ({ ...prev, customType: initialData.type || '' }));
      }
    } else {
      // Reset form when no initial data (new registration)
      setFormData({
        name: '',
        type: '',
        customType: '',
        selectedLocation: '',
        coordinates: [0, 0],
        province: '',
        address: '',
        manager: ''
      });
      setShowCustomType(false);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate coordinates
    if (!formData.coordinates || formData.coordinates.length !== 2 || 
        (formData.coordinates[0] === 0 && formData.coordinates[1] === 0)) {
      alert("Please select a valid location with coordinates. Coordinates cannot be [0,0].");
      return;
    }
    
    const siteData = {
      ...formData,
      type: showCustomType ? formData.customType : formData.type,
      lastUpdated: new Date().toISOString()
    };
    
    // Remove customType and selectedLocation from the final data
    const { customType, selectedLocation, ...finalData } = siteData;
    

    try {
      onSubmit(finalData, isEditMode);
      setMessage({ type: 'success', text: isEditMode ? 'Site updated successfully!' : 'Site added successfully!' });
      // Only reset form if not editing
      if (!isEditMode) {
        setFormData({ name: '', type: '', customType: '', selectedLocation: '', coordinates: [0, 0], province: '', address: '', manager: '' });
        setShowCustomType(false);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to register site. Please try again.' });
    }
  };

  const handleTypeChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomType(true);
      setFormData({ ...formData, type: '', customType: '' });
    } else {
      setShowCustomType(false);
      setFormData({ ...formData, type: value, customType: '' });
    }
  };

  const handleLocationChange = (city: string, coordinates: [number, number], province: string) => {
    setFormData({
      ...formData,
      selectedLocation: city,
      coordinates,
      province,
      address: formData.address || `${city}, ${province}, Saudi Arabia`
    });
  };

  return (
    <div className="relative space-y-6">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-0 right-0 mt-2 mr-2 text-gray-400 hover:text-gray-700"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
      )}
      {message && (
        <div className={`mb-4 px-4 py-2 rounded text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>
      )}
      <div className="flex items-center space-x-3 mb-6">
        <Building className="w-6 h-6 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">Register New Site</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site Type *</label>
            {showCustomType ? (
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={formData.customType}
                  onChange={(e) => setFormData({ ...formData, customType: e.target.value })}
                  placeholder="Enter custom site type"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCustomType(false)}
                  className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <select
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select site type</option>
                {siteTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
                <option value="custom">+ Add Custom Type</option>
              </select>
            )}
          </div>

          <div>
            <label className="block nửa text-sm font-medium text-gray-700 mb-1">Location *</label>
            <SearchableLocationDropdown
              value={formData.selectedLocation}
              onChange={handleLocationChange}
              placeholder="Search for a city or location..."
              required
            />
            {formData.selectedLocation && (
              <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
                <div className="text-sm text-gray-600">
                  <div><span className="font-medium">Province:</span> {formData.province}</div>
                  <div>
                    <span className="font-medium">Coordinates:</span> 
                    <span className="font-mono text-blue-700"> {formData.coordinates[1].toFixed(4)}, {formData.coordinates[0].toFixed(4)}</span> (Lat, Lng)
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site Manager *</label>
            <input
              type="text"
              value={formData.manager}
              onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter complete site address..."
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          {isEditMode ? 'Update Site' : 'Register Site'}
        </button>
      </form>
    </div>
  );
};

export default SiteForm;