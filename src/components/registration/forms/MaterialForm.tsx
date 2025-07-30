import React, { useState, useEffect } from 'react';
import { Package, X, Plus } from 'lucide-react';
import { Material } from '../../../types';
import { materialCategories } from '../../../data/materialTypes';
import { CostProfitCenterService } from '../../../utils/costProfitCenterService';
import { CustomMaterialTypeManager } from '../../../utils/customMaterialTypeManager';
import { CustomUnitManager } from '../../../utils/customUnitManager';
// import { supabase } from '../../../utils/supabaseClient';

interface MaterialFormProps {
  sites: any[];
  onSubmit: (material: Omit<Material, 'id' | 'createdAt' | 'qrCode'>) => void;
  initialData?: Material | null;
  onClose?: () => void;
}

const MaterialForm: React.FC<MaterialFormProps> = ({ sites, onSubmit, initialData, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    customType: '',
    unit: '',
    quantity: 0,
    site: '',
    use: '',
    status: 'available' as 'available' | 'low-stock' | 'out-of-stock',
    oldId: '',
    accessLevel: 'basic' as 'basic' | 'restricted' | 'admin',
    costCenterCode: '',
    profitCenterCode: '',
    cost: '' // cost is always a string in form state
  });
  const [showCustomType, setShowCustomType] = useState(false);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [profitCenters, setProfitCenters] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [customMaterialTypes, setCustomMaterialTypes] = useState<string[]>([]);
  const [customUnitInput, setCustomUnitInput] = useState('');
  const [showCustomUnitInput, setShowCustomUnitInput] = useState(false);
  const [availableUnits, setAvailableUnits] = useState<string[]>([]);
  const [nameUnique, setNameUnique] = useState(true);

  // Handle initial data for editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        type: initialData.type || '',
        customType: '',
        unit: initialData.unit || '',
        quantity: initialData.quantity || 0,
        site: initialData.site || '',
        use: initialData.use || '',
        status: initialData.status || 'available',
        oldId: initialData.oldId || '',
        accessLevel: 'basic', // No direct mapping for accessLevel in Material type
        costCenterCode: initialData.costCenterCode || '',
        profitCenterCode: initialData.profitCenterCode || '',
        cost: initialData.cost !== undefined ? initialData.cost.toString() : '' // Ensure cost is a string
      });
      
      // Check if we need to show custom type
      const materialTypeNames = Object.values(materialCategories).map(cat => cat.name);
      const isCustomType = !materialTypeNames.includes(initialData.type || '');
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
        unit: '',
        quantity: 0,
        site: '',
        use: '',
        status: 'available',
        oldId: '',
        accessLevel: 'basic',
        costCenterCode: '',
        profitCenterCode: '',
        cost: ''
      });
      setShowCustomType(false);
    }
  }, [initialData]);

  useEffect(() => {
    // Load cost centers and profit centers
    const loadCostProfitCenters = async () => {
      try {
        const [costCentersResult, profitCentersResult] = await Promise.all([
          CostProfitCenterService.getCostCenters(),
          CostProfitCenterService.getProfitCenters()
        ]);
        
        if (costCentersResult.success && costCentersResult.data) {
          setCostCenters(costCentersResult.data);
        } else {
          // Fallback to mock data
          setCostCenters(CostProfitCenterService.getMockCostCenters());
        }
        
        if (profitCentersResult.success && profitCentersResult.data) {
          setProfitCenters(profitCentersResult.data);
        } else {
          // Fallback to mock data
          setProfitCenters(CostProfitCenterService.getMockProfitCenters());
        }
      } catch (error) {
        console.error('Error loading cost/profit centers:', error);
        // Fallback to mock data
        setCostCenters(CostProfitCenterService.getMockCostCenters());
        setProfitCenters(CostProfitCenterService.getMockProfitCenters());
      }
    };
    
    loadCostProfitCenters();
    loadCustomMaterialTypes();
    loadAvailableUnits();
  }, []);

  // Load custom material types from localStorage
  const loadCustomMaterialTypes = () => {
    const customTypes = CustomMaterialTypeManager.getCustomTypes();
    setCustomMaterialTypes(customTypes);
  };

  // Save custom material type to localStorage
  const saveCustomMaterialType = (typeName: string) => {
    const validation = CustomMaterialTypeManager.validateTypeName(typeName);
    if (!validation.isValid) {
      setMessage({ type: 'error', text: validation.error || 'Invalid material type name' });
      return;
    }

    const success = CustomMaterialTypeManager.addCustomType(typeName);
    if (success) {
      loadCustomMaterialTypes(); // Refresh the list
      setMessage({ type: 'success', text: `Custom material type "${typeName}" added successfully!` });
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: 'Failed to save custom material type' });
    }
  };

  const loadAvailableUnits = () => {
    const units = CustomUnitManager.getAllUnits();
    setAvailableUnits(units);
  };

  const saveCustomUnit = (unitName: string) => {
    if (CustomUnitManager.addCustomUnit(unitName)) {
      loadAvailableUnits();
      setCustomUnitInput('');
      setShowCustomUnitInput(false);
      // Set the new unit as selected
      setFormData({ ...formData, unit: unitName });
    }
  };

  const handleAddCustomUnit = () => {
    if (customUnitInput.trim()) {
      saveCustomUnit(customUnitInput.trim());
    }
  };

  const handleUnitChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomUnitInput(true);
    } else {
      setFormData({ ...formData, unit: value });
      setShowCustomUnitInput(false);
    }
  };

  // Simple name validation
  useEffect(() => {
    const name = formData.name.trim();
    if (!name) {
      setNameUnique(true);
      return;
    }
    // For now, assume name is unique - can be enhanced later
    setNameUnique(true);
  }, [formData.name, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameUnique) {
      setMessage({ type: 'error', text: 'Material name must be unique.' });
      return;
    }

    // Validate old_id field is required
    if (!formData.oldId.trim()) {
      setMessage({ type: 'error', text: 'Old Material ID is required. Please enter the legacy material ID from your previous system.' });
      return;
    }
    
    const materialData = {
      ...formData,
      type: (showCustomType ? formData.customType : formData.type) as any,
      lastUpdated: new Date().toISOString(),
      cost: formData.cost !== '' ? parseFloat(formData.cost) : undefined // Ensure cost is a number
    };
    
    // Remove customType from the final data
    const { customType: _, ...finalData } = materialData;
    
    try {
      onSubmit(finalData);
      setMessage({ type: 'success', text: 'Material added successfully!' });
      setFormData({ name: '', type: '', customType: '', unit: '', quantity: 0, site: '', use: '', status: 'available', oldId: '', accessLevel: 'basic', costCenterCode: '', profitCenterCode: '', cost: '' });
      setShowCustomType(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to register material. Please try again.' });
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

  const handleAddCustomType = () => {
    if (!formData.customType.trim()) {
      setMessage({ type: 'error', text: 'Please enter a custom material type name' });
      return;
    }

    const typeName = formData.customType.trim();
    
    // Save the custom type (validation is handled inside saveCustomMaterialType)
    saveCustomMaterialType(typeName);
    
    // Set the form data to use the new custom type
    setFormData({ ...formData, type: typeName, customType: '' });
    setShowCustomType(false);
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
        <Package className="w-6 h-6 text-orange-600" />
        <h3 className="text-lg font-semibold text-gray-900">Register New Material</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Material Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!nameUnique ? 'border-red-500' : 'border-gray-300'}`}
              required
            />
            {!nameUnique && (
              <div className="text-xs text-red-600 mt-1">Material name must be unique.</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Old Material ID *</label>
            <input
              type="text"
              value={formData.oldId}
              onChange={(e) => setFormData({ ...formData, oldId: e.target.value })}
              className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter legacy material ID from previous system"
              required
            />
            <div className="text-xs text-gray-500 mt-1">
              Enter the material ID from your previous system for backward compatibility and audit purposes. This field is now mandatory.
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Material Type *</label>
            {showCustomType ? (
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.customType}
                    onChange={(e) => setFormData({ ...formData, customType: e.target.value })}
                    placeholder="Enter custom material type"
                    className="flex-1 px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomType();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomType}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-1"
                    title="Add Custom Type"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustomType(false)}
                    className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
                <div className="text-xs text-gray-500">
                  Press Enter or click Add to save this custom material type for future use.
                </div>
              </div>
            ) : (
              <select
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select material type</option>
                {Object.entries(materialCategories).map(([categoryKey, category]) => (
                  <option key={categoryKey} value={category.name}>{category.name}</option>
                ))}
                {customMaterialTypes.length > 0 && (
                  <optgroup label="Custom Types">
                    {customMaterialTypes.map((customType) => (
                      <option key={customType} value={customType}>{customType}</option>
                    ))}
                  </optgroup>
                )}
                <option value="custom">+ Add Custom Type</option>
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measurement *</label>
            <div className="space-y-2">
              <select
                value={formData.unit}
                onChange={(e) => handleUnitChange(e.target.value)}
                className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select unit</option>
                {availableUnits.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
                <option value="custom">+ Add Custom Unit</option>
              </select>

              {showCustomUnitInput && (
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={customUnitInput}
                    onChange={(e) => setCustomUnitInput(e.target.value)}
                    placeholder="Enter custom unit name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCustomUnit()}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomUnit}
                    disabled={!customUnitInput.trim()}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomUnitInput(false);
                      setCustomUnitInput('');
                    }}
                    className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Initial Quantity *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Unit *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              placeholder="Enter cost per unit"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site Assignment *</label>
            <select
              value={formData.site}
              onChange={(e) => setFormData({ ...formData, site: e.target.value })}
              className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select site</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usage Description</label>
            <textarea
              value={formData.use}
              onChange={(e) => setFormData({ ...formData, use: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe how this material is used..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cost Center Code</label>
            <select
              value={formData.costCenterCode}
              onChange={(e) => setFormData({ ...formData, costCenterCode: e.target.value })}
              className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select cost center (optional)</option>
              {costCenters.map((costCenter: any) => (
                <option key={costCenter.id} value={costCenter.code}>
                  {costCenter.code} - {costCenter.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profit Center Code</label>
            <select
              value={formData.profitCenterCode}
              onChange={(e) => setFormData({ ...formData, profitCenterCode: e.target.value })}
              className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select profit center (optional)</option>
              {profitCenters.map((profitCenter: any) => (
                <option key={profitCenter.id} value={profitCenter.code}>
                  {profitCenter.code} - {profitCenter.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          Register Material
        </button>
      </form>
    </div>
  );
};

export default MaterialForm;