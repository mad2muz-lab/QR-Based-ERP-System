import React, { useState } from 'react';
import { Wrench } from 'lucide-react';
import { Equipment } from '../../../types';
import { equipmentCategories } from '../../../data/materialTypes';
import { DataStorage } from '../../../utils/dataStorage';

interface EquipmentFormProps {
  sites: any[];
  onSubmit: (equipment: Omit<Equipment, 'id' | 'createdAt' | 'qrCode'>) => void;
  initialData?: Equipment | null;
}

const EquipmentForm: React.FC<EquipmentFormProps> = ({ sites, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    type: '',
    customType: '',
    model: '',
    serialNumber: '',
    site: '',
    status: 'available' as const,
  });
  const [showCustomType, setShowCustomType] = useState(false);
  const [idError, setIdError] = useState('');

  // Handle initial data for editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id || '',
        name: initialData.name || '',
        type: initialData.type || '',
        customType: '',
        model: initialData.model || '',
        serialNumber: initialData.serialNumber || '',
        site: initialData.site || '',
        status: initialData.status || 'available'
      });
      
      // Check if we need to show custom type
      const allTypes = getAllEquipmentTypes();
      const isCustomType = !allTypes.includes(initialData.type || '');
      setShowCustomType(isCustomType);
      if (isCustomType) {
        setFormData(prev => ({ ...prev, customType: initialData.type || '' }));
      }
    } else {
      // Reset form when no initial data (new registration)
      setFormData({
        id: '',
        name: '',
        type: '',
        customType: '',
        model: '',
        serialNumber: '',
        site: '',
        status: 'available'
      });
      setShowCustomType(false);
      setIdError('');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate Equipment ID uniqueness
    if (formData.id.trim()) {
      const existingEquipment = DataStorage.loadEquipment();
      const isDuplicate = existingEquipment.some(eq => eq.id === formData.id.trim());
      
      if (isDuplicate) {
        setIdError('Equipment ID already exists. Please choose a different ID.');
        return;
      }
    }
    
    const equipmentData = {
      ...formData,
      id: formData.id.trim() || undefined, // Use provided ID or let system generate
      type: showCustomType ? formData.customType : formData.type
    };
    
    // Remove customType from the final data
    const { customType, ...finalData } = equipmentData;
    
    onSubmit(finalData);
    
    // Reset form
    setFormData({
      id: '',
      name: '',
      type: '',
      customType: '',
      model: '',
      serialNumber: '',
      site: '',
      status: 'available',
    });
    setShowCustomType(false);
    setIdError('');
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

  // Get all equipment types from categories
  const getAllEquipmentTypes = () => {
    const types: string[] = [];
    Object.values(equipmentCategories).forEach(category => {
      types.push(...category.items);
    });
    return types;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <Wrench className="w-6 h-6 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">Register New Equipment</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Equipment ID <span className="text-xs text-gray-500">(Optional - leave blank for auto-generation)</span>
            </label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => {
                setFormData({ ...formData, id: e.target.value });
                setIdError('');
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                idError ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter equipment ID or leave blank"
            />
            {idError && (
              <p className="text-red-600 text-sm mt-1">{idError}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Type *</label>
            {showCustomType ? (
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={formData.customType}
                  onChange={(e) => setFormData({ ...formData, customType: e.target.value })}
                  placeholder="Enter custom equipment type"
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
                <option value="">Select equipment type</option>
                {Object.entries(equipmentCategories).map(([categoryKey, category]) => (
                  <optgroup key={categoryKey} label={category.name}>
                    {category.items.map(item => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </optgroup>
                ))}
                <option value="custom">+ Add Custom Type</option>
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
            <input
              type="text"
              value={formData.serialNumber}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site Assignment *</label>
            <select
              value={formData.site}
              onChange={(e) => setFormData({ ...formData, site: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select site</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="available">Available</option>
              <option value="in-use">In Use</option>
              <option value="maintenance">Maintenance</option>
              <option value="down">Down</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Register Equipment
        </button>
      </form>
    </div>
  );
};

export default EquipmentForm;