import React, { useState, useEffect } from 'react';
import { Wrench, AlertCircle } from 'lucide-react';
import { Equipment } from '../../../types';
import { equipmentCategories } from '../../../data/materialTypes';
import { DataStorage } from '../../../utils/dataStorage';

interface EquipmentFormProps {
  sites: any[];
  onSubmit: (equipment: Omit<Equipment, 'id' | 'createdAt' | 'qrCode'>, isEdit?: boolean) => void;
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
    status: 'available' as 'available' | 'in-use' | 'maintenance' | 'down',
  });
  const [showCustomType, setShowCustomType] = useState(false);
  const [idError, setIdError] = useState('');
  const [isCheckingId, setIsCheckingId] = useState(false);

  const isEditMode = !!initialData;

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
        status: initialData.status || 'available',
      });
      
      const allTypes = getAllEquipmentTypes();
      const isCustomType = !allTypes.includes(initialData.type || '');
      setShowCustomType(isCustomType);
      if (isCustomType) {
        setFormData(prev => ({ ...prev, customType: initialData.type || '' }));
      }
    } else {
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

  useEffect(() => {
    if (formData.id.trim() === '') {
      setIdError('');
      return;
    }

    // Skip validation for edit mode
    if (isEditMode) {
      setIdError('');
      return;
    }

    // Validate EQP- prefix
    if (!formData.id.startsWith('EQP-')) {
      setIdError('Equipment ID must start with "EQP-" (e.g., EQP-001)');
      return;
    }

    // Validate format: EQP- followed by alphanumeric characters
    const idPattern = /^EQP-[A-Za-z0-9]+$/;
    if (!idPattern.test(formData.id)) {
      setIdError('Equipment ID must follow format: EQP-XXX (e.g., EQP-001, EQP-ABC)');
      return;
    }

    setIsCheckingId(true);
    const timeoutId = setTimeout(() => {
      const existingEquipment = DataStorage.loadEquipment();
      const isDuplicate = existingEquipment.some(eq => eq.id === formData.id);
      
      if (isDuplicate) {
        setIdError('Equipment ID already exists. Please choose a different ID.');
      } else {
        setIdError('');
      }
      setIsCheckingId(false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.id, isEditMode]);



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.id.trim()) {
      setIdError('Equipment ID is required');
      return;
    }

    if (idError) {
      return;
    }
    
    const equipmentData = {
      ...formData,
      type: showCustomType ? formData.customType : formData.type,
      lastUpdated: new Date().toISOString()
    };
    
    const { customType, ...finalData } = equipmentData;
    
    onSubmit(finalData, isEditMode);
    
    // Reset form for next equipment
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
          {/* Equipment ID Input */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Equipment ID *
            </label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                idError ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter Equipment ID (e.g., EQP-001)"
              required
              disabled={isEditMode}
            />
            {isCheckingId && (
              <div className="text-sm text-blue-600 mt-1">
                Checking availability...
              </div>
            )}
            {idError && (
              <div className="text-sm text-red-600 mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {idError}
              </div>
            )}
            {!idError && formData.id && !isCheckingId && !isEditMode && (
              <div className="text-sm text-green-600 mt-1">
                ✓ ID is available
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              Equipment ID must start with "EQP-" followed by alphanumeric characters (e.g., EQP-001, EQP-ABC).
            </div>
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
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'available' | 'in-use' | 'maintenance' | 'down' })}
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
          {isEditMode ? 'Update Equipment' : 'Register Equipment'}
        </button>
      </form>
    </div>
  );
};

export default EquipmentForm;