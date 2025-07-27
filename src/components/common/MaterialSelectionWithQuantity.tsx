import React, { useState, useEffect } from 'react';
import { Plus, X, Package, Search, Filter } from 'lucide-react';
import { MaterialSelection, QUALITY_GRADE_OPTIONS } from '../../types/inventory';
import { InventoryService } from '../../utils/inventoryService';
import { materialCategories } from '../../data/materialTypes';

interface MaterialSelectionWithQuantityProps {
  selectedMaterials: MaterialSelection[];
  onMaterialsChange: (materials: MaterialSelection[]) => void;
  disabled?: boolean;
}

const MaterialSelectionWithQuantity: React.FC<MaterialSelectionWithQuantityProps> = ({
  selectedMaterials,
  onMaterialsChange,
  disabled = false
}) => {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [showMaterialSelector, setShowMaterialSelector] = useState(false);

  // Load materials on component mount
  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const result = await InventoryService.getMaterials();
      if (result.success && result.data) {
        setMaterials(result.data);
      }
    } catch (error) {
      console.error('Error loading materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMaterial = (material: any) => {
    const newMaterial: MaterialSelection = {
      material_id: material.id,
      material_name: material.name,
      material_type: material.type,
      quantity: 1,
      unit: material.unit || 'pcs',
      quality_grade: 'standard',
      estimated_cost: material.cost || 0
    };

    // Check if material is already selected
    const isAlreadySelected = selectedMaterials.some(
      selected => selected.material_id === material.id
    );

    if (!isAlreadySelected) {
      onMaterialsChange([...selectedMaterials, newMaterial]);
    }
    setShowMaterialSelector(false);
  };

  const removeMaterial = (materialId: string) => {
    onMaterialsChange(selectedMaterials.filter(m => m.material_id !== materialId));
  };

  const updateMaterialQuantity = (materialId: string, quantity: number) => {
    onMaterialsChange(
      selectedMaterials.map(m =>
        m.material_id === materialId ? { ...m, quantity } : m
      )
    );
  };

  const updateMaterialQuality = (materialId: string, quality: 'standard' | 'premium' | 'economy') => {
    onMaterialsChange(
      selectedMaterials.map(m =>
        m.material_id === materialId ? { ...m, quality_grade: quality } : m
      )
    );
  };

  const updateMaterialCost = (materialId: string, cost: number) => {
    onMaterialsChange(
      selectedMaterials.map(m =>
        m.material_id === materialId ? { ...m, estimated_cost: cost } : m
      )
    );
  };

  // Filter materials based on search and type
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || material.type === selectedType;
    return matchesSearch && matchesType;
  });

  // Get unique material types for filter
  const materialTypes = Array.from(new Set(materials.map(m => m.type))).sort();

  const getTotalCost = () => {
    return selectedMaterials.reduce((total, material) => {
      return total + (material.estimated_cost * material.quantity);
    }, 0);
  };

  return (
    <div className="space-y-4">
      {/* Selected Materials Display */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700 flex items-center">
          <Package className="w-4 h-4 mr-2" />
          Selected Materials ({selectedMaterials.length})
        </h3>
        
        {selectedMaterials.length === 0 ? (
          <div className="text-sm text-gray-500 italic">
            No materials selected. Click "Add Material" to select materials.
          </div>
        ) : (
          <div className="space-y-3">
            {selectedMaterials.map((material) => (
              <div key={material.material_id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{material.material_name}</h4>
                    <p className="text-sm text-gray-600">{material.material_type}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMaterial(material.material_id)}
                    className="text-red-500 hover:text-red-700 p-1"
                    disabled={disabled}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Quantity */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={material.quantity}
                      onChange={(e) => updateMaterialQuantity(material.material_id, parseInt(e.target.value) || 1)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      disabled={disabled}
                    />
                  </div>

                  {/* Unit */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Unit
                    </label>
                    <input
                      type="text"
                      value={material.unit}
                      onChange={(e) => updateMaterialQuantity(material.material_id, parseInt(e.target.value) || 1)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      disabled={disabled}
                    />
                  </div>

                  {/* Quality Grade */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Quality
                    </label>
                    <select
                      value={material.quality_grade}
                      onChange={(e) => updateMaterialQuality(material.material_id, e.target.value as any)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      disabled={disabled}
                    >
                      {QUALITY_GRADE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Estimated Cost */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Cost/Unit
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={material.estimated_cost}
                      onChange={(e) => updateMaterialCost(material.material_id, parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      disabled={disabled}
                    />
                  </div>
                </div>

                <div className="mt-2 text-sm text-gray-600">
                  Total: ${(material.estimated_cost * material.quantity).toFixed(2)}
                </div>
              </div>
            ))}

            {/* Total Cost */}
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">Total Estimated Cost:</span>
                <span className="font-bold text-lg text-blue-600">
                  ${getTotalCost().toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Material Button */}
      <button
        type="button"
        onClick={() => setShowMaterialSelector(true)}
        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        disabled={disabled}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Material
      </button>

      {/* Material Selector Modal */}
      {showMaterialSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Select Materials</h3>
              <button
                onClick={() => setShowMaterialSelector(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search and Filter */}
            <div className="mb-6 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search materials..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="w-48">
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    {materialTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Materials List */}
            <div className="space-y-2">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading materials...</p>
                </div>
              ) : filteredMaterials.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No materials found matching your criteria.
                </div>
              ) : (
                filteredMaterials.map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => addMaterial(material)}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{material.name}</h4>
                      <p className="text-sm text-gray-600">{material.type}</p>
                      <p className="text-xs text-gray-500">
                        Available: {material.quantity} {material.unit} | 
                        Cost: ${material.cost || 0}/unit
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-500">{material.unit}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialSelectionWithQuantity; 