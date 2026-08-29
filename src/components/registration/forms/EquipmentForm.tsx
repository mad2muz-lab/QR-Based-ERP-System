import React, { useState, useEffect } from 'react';
import { Wrench, AlertCircle, X } from 'lucide-react';
import { Equipment } from '../../../types';
import { equipmentCategories } from '../../../data/materialTypes';
import { DataStorage } from '../../../utils/dataStorage';
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
    equipment_name: '',
    equipment_type: '',
    customType: '',
    model: '',
    serialNumber: '',
    site: '',
    status: 'available' as 'available' | 'in-use' | 'maintenance' | 'down',
    oldId: '',
    costCenterCode: '',
    profitCenterCode: '',
    is_pm: false,
    pm_class: '',
    pm_frequency_days: '', // always string
    pm_frequency_hours: '', // always string
    pm_checklist_items: '', // comma-separated string for UI, will split to array
    pm_spare_parts: '' // comma-separated string for UI, will split to array
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
        equipment_name: initialData.equipment_name || '',
        equipment_type: initialData.equipment_type || '',
        customType: '',
        model: initialData.model || '',
        serialNumber: initialData.serialNumber || '',
        site: initialData.site || '',
        status: initialData.status || 'available',
        oldId: initialData.oldId || '',
        costCenterCode: initialData.costCenterCode || '',
        profitCenterCode: initialData.profitCenterCode || '',
        is_pm: initialData.is_pm || false,
        pm_class: initialData.pm_class || '',
        pm_frequency_days: initialData.pm_frequency_days !== undefined ? String(initialData.pm_frequency_days) : '',
        pm_frequency_hours: initialData.pm_frequency_hours !== undefined ? String(initialData.pm_frequency_hours) : '',
        pm_checklist_items: initialData.pm_checklist_items ? initialData.pm_checklist_items.join(', ') : '',
        pm_spare_parts: initialData.pm_spare_parts ? initialData.pm_spare_parts.join(', ') : ''
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
        is_pm: false,
        pm_class: '',
        pm_frequency_days: '',
        pm_frequency_hours: '',
        pm_checklist_items: '',
        pm_spare_parts: ''
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

  useEffect(() => {
    if (initialData && initialData.pm_configs && Array.isArray(initialData.pm_configs)) {
      setPmConfigs(initialData.pm_configs.map(cfg => ({
        pm_class: cfg.pm_class,
        pm_frequency_days: cfg.pm_frequency_days !== undefined ? String(cfg.pm_frequency_days) : '',
        pm_frequency_hours: cfg.pm_frequency_hours !== undefined ? String(cfg.pm_frequency_hours) : '',
        pm_checklist_items: cfg.pm_checklist_items ? cfg.pm_checklist_items.join(', ') : '',
        pm_spare_parts: cfg.pm_spare_parts ? cfg.pm_spare_parts.join(', ') : ''
      })));
    } else {
      setPmConfigs([]);
    }
  }, [initialData]);


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
      is_pm: formData.is_pm,
      // Deprecated single-class fields for backward compatibility
      pm_class: '',
      pm_frequency_days: '',
      pm_frequency_hours: '',
      pm_checklist_items: [],
      pm_spare_parts: [],
      // New multi-class PM configs
      pm_configs: formData.is_pm ? pmConfigs.map(cfg => ({
        pm_class: cfg.pm_class,
        pm_frequency_days: cfg.pm_frequency_days ? Number(cfg.pm_frequency_days) : undefined,
        pm_frequency_hours: cfg.pm_frequency_hours ? Number(cfg.pm_frequency_hours) : undefined,
        pm_checklist_items: cfg.pm_checklist_items ? cfg.pm_checklist_items.split(',').map(s => s.trim()).filter(Boolean) : [],
        pm_spare_parts: cfg.pm_spare_parts ? cfg.pm_spare_parts.split(',').map(s => s.trim()).filter(Boolean) : []
      })) : []
    };
    
    const { customType, ...finalData } = equipmentData;
    
    try {
      onSubmit(finalData, isEditMode);
      setMessage({ type: 'success', text: isEditMode ? 'Equipment updated successfully!' : 'Equipment added successfully!' });
      // Only reset form if not editing
      if (!isEditMode) {
        setFormData({ custom_equipment_id: '', name: '', type: '', customType: '', model: '', serialNumber: '', site: '', status: 'available', oldId: '', costCenterCode: '', profitCenterCode: '', is_pm: false, pm_class: '', pm_frequency_days: '', pm_frequency_hours: '', pm_checklist_items: '', pm_spare_parts: '' });
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

  const PM_CLASS_OPTIONS = ['Routine', 'Class A', 'Class B', 'Class C'];
  const [pmConfigs, setPmConfigs] = useState<{
    pm_class: string;
    pm_frequency_days: string;
    pm_frequency_hours: string;
    pm_checklist_items: string;
    pm_spare_parts: string;
  }[]>([]);

  const PM_SUGGESTIONS: Record<string, Record<string, { checklist: string[]; parts: string[] }>> = {
    'Excavator': {
      'Routine': {
        checklist: ['Check engine oil', 'Inspect hydraulic hoses', 'Clean air filter'],
        parts: ['Oil Filter', 'Hydraulic Hose', 'Air Filter']
      },
      'Class A': {
        checklist: ['Replace oil filter', 'Lubricate pivot points'],
        parts: ['Oil Filter', 'Grease']
      }
      // Add more classes as needed
    },
    'Paver': {
      'Routine': {
        checklist: ['Check hydraulic fluid', 'Inspect belts'],
        parts: ['Hydraulic Fluid', 'Drive Belt']
      }
      // Add more classes as needed
    }
    // Add more equipment types as needed
  };

  const [botModalIdx, setBotModalIdx] = useState<number | null>(null);
  const [botChecklist, setBotChecklist] = useState<string[]>([]);
  const [botParts, setBotParts] = useState<string[]>([]);
  const [botCustomChecklist, setBotCustomChecklist] = useState('');
  const [botCustomParts, setBotCustomParts] = useState('');

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
        </div>

        {/* PM FIELDS START */}
        <div className="md:col-span-2 border-t pt-4 mt-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.is_pm}
              onChange={e => setFormData({ ...formData, is_pm: e.target.checked })}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Include in Preventive Maintenance?</span>
          </label>
          {formData.is_pm && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select PM Classes</label>
              <div className="flex flex-wrap gap-4 mb-4">
                {PM_CLASS_OPTIONS.map(option => (
                  <label key={option} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={pmConfigs.some(cfg => cfg.pm_class === option)}
                      onChange={e => {
                        if (e.target.checked) {
                          setPmConfigs([...pmConfigs, { pm_class: option, pm_frequency_days: '', pm_frequency_hours: '', pm_checklist_items: '', pm_spare_parts: '' }]);
                        } else {
                          setPmConfigs(pmConfigs.filter(cfg => cfg.pm_class !== option));
                        }
                      }}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
              {pmConfigs.map((cfg, idx) => (
                <div key={cfg.pm_class} className="border rounded-lg p-4 mb-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-blue-700">{cfg.pm_class}</span>
                    <div className="flex gap-2">
                      <button type="button" className="text-blue-600 text-xs underline" onClick={() => {
                        // Load suggestions for this equipment type and class
                        const eqType = showCustomType ? formData.customType : formData.type;
                        const suggestions = PM_SUGGESTIONS[eqType]?.[cfg.pm_class] || { checklist: [], parts: [] };
                        setBotChecklist(suggestions.checklist);
                        setBotParts(suggestions.parts);
                        setBotCustomChecklist('');
                        setBotCustomParts('');
                        setBotModalIdx(idx);
                      }}>Bot Assistant</button>
                      <button type="button" className="text-red-500 text-xs" onClick={() => setPmConfigs(pmConfigs.filter((_, i) => i !== idx))}>Remove</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PM Frequency (days)</label>
                      <input
                        type="number"
                        value={cfg.pm_frequency_days}
                        onChange={e => {
                          const val = e.target.value;
                          setPmConfigs(pmConfigs.map((c, i) => i === idx ? { ...c, pm_frequency_days: val } : c));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PM Frequency (hours)</label>
                      <input
                        type="number"
                        value={cfg.pm_frequency_hours}
                        onChange={e => {
                          const val = e.target.value;
                          setPmConfigs(pmConfigs.map((c, i) => i === idx ? { ...c, pm_frequency_hours: val } : c));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PM Checklist Items (comma separated)</label>
                      <textarea
                        value={cfg.pm_checklist_items}
                        onChange={e => {
                          const val = e.target.value;
                          setPmConfigs(pmConfigs.map((c, i) => i === idx ? { ...c, pm_checklist_items: val } : c));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={2}
                        placeholder="e.g., Check oil, Inspect belts, Clean filter"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PM Spare Parts (comma separated)</label>
                      <textarea
                        value={cfg.pm_spare_parts}
                        onChange={e => {
                          const val = e.target.value;
                          setPmConfigs(pmConfigs.map((c, i) => i === idx ? { ...c, pm_spare_parts: val } : c));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={2}
                        placeholder="e.g., Oil Filter, Belt, Hydraulic Hose"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* PM FIELDS END */}

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          {isEditMode ? 'Update Equipment' : 'Register Equipment'}
        </button>
      </form>

      {/* Bot Assistant Modal */}
      {botModalIdx !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setBotModalIdx(null)}>&times;</button>
            <h4 className="text-lg font-bold mb-2">PM Bot Assistant</h4>
            <div className="mb-4">
              <div className="font-semibold mb-1">Suggested Checklist Items:</div>
              {botChecklist.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-2">
                  {botChecklist.map(item => (
                    <label key={item} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={pmConfigs[botModalIdx]?.pm_checklist_items.split(',').map(s => s.trim()).includes(item)}
                        onChange={e => {
                          const current = pmConfigs[botModalIdx]?.pm_checklist_items.split(',').map(s => s.trim()).filter(Boolean);
                          let updated;
                          if (e.target.checked) {
                            updated = [...current, item];
                          } else {
                            updated = current.filter(i => i !== item);
                          }
                          setPmConfigs(pmConfigs.map((c, i) => i === botModalIdx ? { ...c, pm_checklist_items: updated.join(', ') } : c));
                        }}
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              ) : <div className="text-gray-500 text-sm">No suggestions for this equipment/class.</div>}
              <textarea
                value={botCustomChecklist}
                onChange={e => setBotCustomChecklist(e.target.value)}
                className="w-full px-2 py-1 border rounded mb-2"
                rows={2}
                placeholder="Add custom checklist items (comma separated)"
              />
              <button
                type="button"
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                onClick={() => {
                  const current = pmConfigs[botModalIdx]?.pm_checklist_items.split(',').map(s => s.trim()).filter(Boolean);
                  const custom = botCustomChecklist.split(',').map(s => s.trim()).filter(Boolean);
                  const updated = Array.from(new Set([...current, ...custom]));
                  setPmConfigs(pmConfigs.map((c, i) => i === botModalIdx ? { ...c, pm_checklist_items: updated.join(', ') } : c));
                  setBotCustomChecklist('');
                }}
              >Add Custom Items</button>
            </div>
            <div className="mb-4">
              <div className="font-semibold mb-1">Suggested Spare Parts:</div>
              {botParts.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-2">
                  {botParts.map(item => (
                    <label key={item} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={pmConfigs[botModalIdx]?.pm_spare_parts.split(',').map(s => s.trim()).includes(item)}
                        onChange={e => {
                          const current = pmConfigs[botModalIdx]?.pm_spare_parts.split(',').map(s => s.trim()).filter(Boolean);
                          let updated;
                          if (e.target.checked) {
                            updated = [...current, item];
                          } else {
                            updated = current.filter(i => i !== item);
                          }
                          setPmConfigs(pmConfigs.map((c, i) => i === botModalIdx ? { ...c, pm_spare_parts: updated.join(', ') } : c));
                        }}
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              ) : <div className="text-gray-500 text-sm">No suggestions for this equipment/class.</div>}
              <textarea
                value={botCustomParts}
                onChange={e => setBotCustomParts(e.target.value)}
                className="w-full px-2 py-1 border rounded mb-2"
                rows={2}
                placeholder="Add custom spare parts (comma separated)"
              />
              <button
                type="button"
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                onClick={() => {
                  const current = pmConfigs[botModalIdx]?.pm_spare_parts.split(',').map(s => s.trim()).filter(Boolean);
                  const custom = botCustomParts.split(',').map(s => s.trim()).filter(Boolean);
                  const updated = Array.from(new Set([...current, ...custom]));
                  setPmConfigs(pmConfigs.map((c, i) => i === botModalIdx ? { ...c, pm_spare_parts: updated.join(', ') } : c));
                  setBotCustomParts('');
                }}
              >Add Custom Parts</button>
            </div>
            <button
              type="button"
              className="bg-green-600 text-white px-4 py-2 rounded"
              onClick={() => setBotModalIdx(null)}
            >Done</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentForm;