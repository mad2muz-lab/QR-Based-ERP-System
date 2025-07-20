import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, X, AlertTriangle, Package, CheckCircle } from 'lucide-react';
import { Material, MaterialSelection } from '../../types';
import { materialCategories } from '../../data/materialTypes';
import { DataStorage } from '../../utils/dataStorage';
import { SupabaseDataService } from '../../utils/supabaseDataService';
import { AuthManager } from '../../utils/authUtils';
import { CustomMaterialTypeManager } from '../../utils/customMaterialTypeManager';

interface MaterialSelectionWithQuantityProps {
  selectedMaterials: MaterialSelection[];
  onMaterialsChange: (materials: MaterialSelection[]) => void;
  site: string;
  equipmentType?: string;
  onPRGenerated?: (prId: string) => void;
}

const MaterialSelectionWithQuantity: React.FC<MaterialSelectionWithQuantityProps> = ({
  selectedMaterials,
  onMaterialsChange,
  site,
  equipmentType,
  onPRGenerated
}) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [useSupabase, setUseSupabase] = useState(false);

  useEffect(() => {
    loadMaterials();
    checkDataSource();
  }, []);

  const checkDataSource = async () => {
    const currentUseSupabase = await AuthManager.useSupabase();
    setUseSupabase(currentUseSupabase);
  };

  const loadMaterials = async () => {
    setLoading(true);
    try {
      let materialsData: Material[] = [];
      
      if (useSupabase) {
        const result = await SupabaseDataService.getMaterials();
        materialsData = result || [];
      } else {
        materialsData = DataStorage.loadMaterials();
      }

      // Load custom material types
      const customMaterialTypes = CustomMaterialTypeManager.getCustomTypes();

      // Filter only spare parts and custom types that might be spare parts
      const spareParts = materialsData.filter(material => 
        material.type === 'Spare Parts' || 
        materialCategories.spareParts.items.some(item => 
          item.name === material.name
        ) ||
        // Include custom material types that might be spare parts
        (customMaterialTypes.includes(material.type) && 
         (material.name.toLowerCase().includes('part') || 
          material.name.toLowerCase().includes('filter') ||
          material.name.toLowerCase().includes('oil') ||
          material.name.toLowerCase().includes('belt') ||
          material.name.toLowerCase().includes('pump') ||
          material.name.toLowerCase().includes('motor') ||
          material.name.toLowerCase().includes('sensor') ||
          material.name.toLowerCase().includes('wire') ||
          material.name.toLowerCase().includes('hose') ||
          material.name.toLowerCase().includes('seal') ||
          material.name.toLowerCase().includes('bearing') ||
          material.name.toLowerCase().includes('bolt') ||
          material.name.toLowerCase().includes('nut') ||
          material.name.toLowerCase().includes('gasket')))
      );

      setMaterials(spareParts);
    } catch (error) {
      console.error('Error loading materials:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter materials based on search query and equipment type
  const filteredMaterials = useMemo(() => {
    let filtered = materials.filter(material =>
      material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // If equipment type is provided, prioritize relevant spare parts
    if (equipmentType) {
      const relevantParts = filtered.filter(material => 
        isRelevantForEquipment(material.name, equipmentType)
      );
      const otherParts = filtered.filter(material => 
        !isRelevantForEquipment(material.name, equipmentType)
      );
      return [...relevantParts, ...otherParts];
    }

    return filtered;
  }, [materials, searchQuery, equipmentType]);

  // Check if material is relevant for specific equipment type
  const isRelevantForEquipment = (materialName: string, equipmentType: string): boolean => {
    const equipmentTypeLower = equipmentType.toLowerCase();
    const materialNameLower = materialName.toLowerCase();

    // Engine-related parts for engine-based equipment
    if (equipmentTypeLower.includes('excavator') || equipmentTypeLower.includes('bulldozer') || 
        equipmentTypeLower.includes('loader') || equipmentTypeLower.includes('truck')) {
      return materialNameLower.includes('engine') || materialNameLower.includes('oil') || 
             materialNameLower.includes('filter') || materialNameLower.includes('battery') ||
             materialNameLower.includes('brake') || materialNameLower.includes('tire');
    }

    // Electrical parts for electrical equipment
    if (equipmentTypeLower.includes('generator') || equipmentTypeLower.includes('welding')) {
      return materialNameLower.includes('electrical') || materialNameLower.includes('wire') ||
             materialNameLower.includes('fuse') || materialNameLower.includes('relay');
    }

    // Hydraulic parts for hydraulic equipment
    if (equipmentTypeLower.includes('crane') || equipmentTypeLower.includes('lift')) {
      return materialNameLower.includes('hydraulic') || materialNameLower.includes('pump') ||
             materialNameLower.includes('hose') || materialNameLower.includes('seal');
    }

    return false;
  };

  const addMaterial = (material: Material) => {
    const existingIndex = selectedMaterials.findIndex(m => m.materialId === material.id);
    
    if (existingIndex >= 0) {
      // Update quantity if already selected
      const updatedMaterials = [...selectedMaterials];
      updatedMaterials[existingIndex] = {
        ...updatedMaterials[existingIndex],
        quantity: updatedMaterials[existingIndex].quantity + 1
      };
      onMaterialsChange(updatedMaterials);
    } else {
      // Add new material
      const newSelection: MaterialSelection = {
        materialId: material.id,
        materialName: material.name,
        materialType: material.type,
        quantity: 1,
        unit: material.unit,
        availableStock: material.quantity,
        estimatedCost: 0, // Will be updated by user
        isSparePart: true,
        urgencyLevel: 'normal',
        autoPRGenerated: false
      };
      onMaterialsChange([...selectedMaterials, newSelection]);
    }
    
    setShowDropdown(false);
    setSearchQuery('');
  };

  const updateQuantity = (materialId: string, quantity: number) => {
    const updatedMaterials = selectedMaterials.map(material =>
      material.materialId === materialId
        ? { ...material, quantity: Math.max(1, quantity) }
        : material
    );
    onMaterialsChange(updatedMaterials);
  };

  const updateEstimatedCost = (materialId: string, cost: number) => {
    const updatedMaterials = selectedMaterials.map(material =>
      material.materialId === materialId
        ? { ...material, estimatedCost: Math.max(0, cost) }
        : material
    );
    onMaterialsChange(updatedMaterials);
  };

  const updateUrgencyLevel = (materialId: string, urgency: MaterialSelection['urgencyLevel']) => {
    const updatedMaterials = selectedMaterials.map(material =>
      material.materialId === materialId
        ? { ...material, urgencyLevel: urgency }
        : material
    );
    onMaterialsChange(updatedMaterials);
  };

  const removeMaterial = (materialId: string) => {
    const updatedMaterials = selectedMaterials.filter(material => material.materialId !== materialId);
    onMaterialsChange(updatedMaterials);
  };

  const getUrgencyColor = (urgency: MaterialSelection['urgencyLevel']) => {
    switch (urgency) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'urgent': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStockStatus = (material: MaterialSelection) => {
    if (material.quantity > material.availableStock) {
      return {
        status: 'insufficient',
        color: 'text-red-600',
        icon: <AlertTriangle className="w-4 h-4" />,
        message: `Insufficient stock (${material.availableStock} available)`
      };
    } else if (material.availableStock <= 5) {
      return {
        status: 'low',
        color: 'text-orange-600',
        icon: <AlertTriangle className="w-4 h-4" />,
        message: `Low stock (${material.availableStock} available)`
      };
    } else {
      return {
        status: 'sufficient',
        color: 'text-green-600',
        icon: <CheckCircle className="w-4 h-4" />,
        message: `In stock (${material.availableStock} available)`
      };
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Add Materials */}
      <div className="relative">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search spare parts..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading materials...</div>
            ) : filteredMaterials.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No spare parts found</div>
            ) : (
              filteredMaterials.map((material) => (
                <button
                  key={material.id}
                  onClick={() => addMaterial(material)}
                  className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center space-x-3"
                >
                  <Package className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{material.name}</div>
                    <div className="text-sm text-gray-500">
                      {material.type} • {material.unit} • Stock: {material.quantity}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Selected Materials */}
      {selectedMaterials.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Selected Spare Parts</h4>
          {selectedMaterials.map((material) => {
            const stockStatus = getStockStatus(material);
            return (
              <div key={material.materialId} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Package className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900">{material.materialName}</div>
                      <div className="text-sm text-gray-500">{material.materialType}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeMaterial(material.materialId)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={material.quantity}
                      onChange={(e) => updateQuantity(material.materialId, parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Unit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-700">
                      {material.unit}
                    </div>
                  </div>

                  {/* Estimated Cost */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Est. Cost (SAR)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={material.estimatedCost}
                      onChange={(e) => updateEstimatedCost(material.materialId, parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Urgency Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
                    <select
                      value={material.urgencyLevel}
                      onChange={(e) => updateUrgencyLevel(material.materialId, e.target.value as MaterialSelection['urgencyLevel'])}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                {/* Stock Status */}
                <div className={`flex items-center space-x-2 p-2 rounded-md border ${getUrgencyColor(material.urgencyLevel)}`}>
                  {stockStatus.icon}
                  <span className={`text-sm font-medium ${stockStatus.color}`}>
                    {stockStatus.message}
                  </span>
                  {stockStatus.status === 'insufficient' && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                      PR Required
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {selectedMaterials.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">
                Total: {selectedMaterials.length} spare part(s)
              </div>
              <div className="text-sm text-gray-500">
                Estimated Cost: SAR {selectedMaterials.reduce((total, m) => total + (m.estimatedCost * m.quantity), 0).toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                {selectedMaterials.filter(m => m.quantity > m.availableStock).length} require(s) procurement
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialSelectionWithQuantity; 