import React, { useState, useEffect } from 'react';
import { Wrench, AlertCircle, X } from 'lucide-react';
import { Equipment } from '../../../types';
import { equipmentCategories } from '../../../data/materialTypes';
import { EquipmentMigration } from '../../../utils/equipmentMigration';
import { CostProfitCenterService } from '../../../utils/costProfitCenterService';

interface EquipmentFormProps {
  sites: any[];
  onSubmit: (equipment: Omit<Equipment, 'id' | 'createdAt' | 'qrCode'>, isEdit?: boolean) => void;
  initialData?: Equipment | null;
  onClose?: () => void;
}

const EquipmentForm: React.FC<EquipmentFormProps> = ({ sites, onSubmit, initialData, onClose }) => {
  const [formData, setFormData] = useState({
    custom_equipment_id: '',
    name: '',
    type: '',
    customType: '',
    model: '',
    serialNumber: '',
    site: '',
    status: 'available' as 'available' | 'in-use' | 'maintenance' | 'down',
    oldId: '',
    costCenterCode: '',
    profitCenterCode: '',
    hourly_rate: ''
  });
  const [showCustomType, setShowCustomType] = useState(false);
  const [customIdError, setCustomIdError] = useState('');
  const [isCheckingId, setIsCheckingId] = useState(false);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [profitCenters, setProfitCenters] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isEditMode = !!initialData;

  useEffect(() => {
    if (initialData) {
      setFormData({
        custom_equipment_id: initialData.custom_equipment_id || '',
        name: initialData.name || '',
        type: initialData.type || '',
        customType: '',
        model: initialData.model || '',
        serialNumber: initialData.serialNumber || '',
        site: initialData.site || '',
        status: initialData.status || 'available',
        oldId: initialData.oldId || '',
        costCenterCode: initialData.costCenterCode || '',
        profitCenterCode: initialData.profitCenterCode || '',
        hourly_rate: initialData.hourly_rate !== undefined && initialData.hourly_rate !== null ? String(initialData.hourly_rate) : ''
      });
      
      const allTypes = getAllEquipmentTypes();
      const isCustomType = !allTypes.includes(initialData.type || '');
      setShowCustomType(isCustomType);
      if (isCustomType) {
        setFormData(prev => ({ ...prev, customType: initialData.type || '' }));
      }
    } else {
      setFormData({
        custom_equipment_id: '',
        name: '',
        type: '',
        customType: '',
        model: '',
        serialNumber: '',
        site: '',
        status: 'available',
        oldId: '',
        costCenterCode: '',
        profitCenterCode: '',
        hourly_rate: ''
      });
      setShowCustomType(false);
      setCustomIdError('');
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
  }, []);

  useEffect(() => {
    if (formData.custom_equipment_id.trim() === '') {
      setCustomIdError('');
      return;
    }

    // Validate custom equipment ID format
    const validation = EquipmentMigration.validateCustomEquipmentId(formData.custom_equipment_id);
    if (!validation.valid) {
      setCustomIdError(validation.error || 'Invalid format');
      return;
    }

    setIsCheckingId(true);
    const timeoutId = setTimeout(() => {
      // Check uniqueness (exclude current equipment if editing)
      const excludeId = isEditMode ? initialData?.id : undefined;
      const isUnique = EquipmentMigration.isCustomEquipmentIdUnique(formData.custom_equipment_id, excludeId);
      
      if (!isUnique) {
        setCustomIdError('Custom Equipment ID already exists. Please choose a different ID.');
      } else {
        setCustomIdError('');
      }
      setIsCheckingId(false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.custom_equipment_id, isEditMode, initialData?.id]);



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.custom_equipment_id.trim()) {
      setCustomIdError('Custom Equipment ID is required');
      return;
    }

    if (customIdError) {
      return;
    }
    
    const equipmentData = {
      ...formData,
      type: showCustomType ? formData.customType : formData.type,
      operational_status: 'working' as 'working' | 'not_working' | 'in_use' | 'standby' | 'under_repair' | 'under_service',
      lastUpdated: new Date().toISOString(),
      hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate as any) : undefined
    };
    
    const { customType: _, ...finalData } = equipmentData;
    
    try {
      onSubmit(finalData, isEditMode);
      setMessage({ type: 'success', text: isEditMode ? 'Equipment updated successfully!' : 'Equipment added successfully!' });
      // Only reset form if not editing
      if (!isEditMode) {
        setFormData({ custom_equipment_id: '', name: '', type: '', customType: '', model: '', serialNumber: '', site: '', status: 'available', oldId: '', costCenterCode: '', profitCenterCode: '', hourly_rate: '' });
        setShowCustomType(false);
        setCustomIdError('');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to register equipment. Please try again.' });
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

  const getAllEquipmentTypes = () => {
    const types: string[] = [];
    Object.values(equipmentCategories).forEach(category => {
      types.push(...category.items);
    });
    return types;
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
        <Wrench className="w-6 h-6 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">Register New Equipment</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Custom Equipment ID Input */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Equipment ID *
            </label>
            <input
              type="text"
              value={formData.custom_equipment_id}
              onChange={(e) => setFormData({ ...formData, custom_equipment_id: e.target.value.toUpperCase() })}
              className={`w-full px-3 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                customIdError ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter Custom Equipment ID (e.g., EQP-001, DRILL-A1)"
              required
              maxLength={10}
            />
            {isCheckingId && (
              <div className="text-sm text-blue-600 mt-1">
                Checking availability...
              </div>
            )}
            {customIdError && (
              <div className="text-sm text-red-600 mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {customIdError}
              </div>
            )}
            {!customIdError && formData.custom_equipment_id && !isCheckingId && (
              <div className="text-sm text-green-600 mt-1">
                ✓ Custom ID is available
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              Custom Equipment ID: 1-10 characters, uppercase letters, numbers, and dashes only (e.g., EQP-001, DRILL-A1).
              <br />
              <span className="text-blue-600">Note: A unique system ID will be auto-generated for this equipment.</span>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Old Equipment ID (Optional)</label>
            <input
              type="text"
              value={formData.oldId}
              onChange={(e) => setFormData({ ...formData, oldId: e.target.value })}
              className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter legacy equipment ID from previous system"
            />
            <div className="text-xs text-gray-500 mt-1">
              Enter the equipment ID from your previous system for backward compatibility and audit purposes.
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="flex-1 px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
            <input
              type="text"
              value={formData.serialNumber}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'available' | 'in-use' | 'maintenance' | 'down' })}
              className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="available">Available</option>
              <option value="in-use">In Use</option>
              <option value="maintenance">Maintenance</option>
              <option value="down">Down</option>
            </select>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (SAR)</label>
            <input
              type="number"
              value={formData.hourly_rate}
              onChange={e => setFormData({ ...formData, hourly_rate: e.target.value })}
              className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min={0}
              step={0.01}
              placeholder="Enter hourly rate"
            />
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