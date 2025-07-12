import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { Material } from '../../../types';
import { materialCategories } from '../../../data/materialTypes';

interface MaterialFormProps {
  sites: any[];
  onSubmit: (material: Omit<Material, 'id' | 'createdAt' | 'qrCode'>) => void;
  initialData?: Material | null;
}

const MaterialForm: React.FC<MaterialFormProps> = ({ sites, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    customType: '',
    unit: '',
    quantity: 0,
    site: '',
    use: '',
    status: 'available' as const,
    accessLevel: 'basic' as const
  });
  const [showCustomType, setShowCustomType] = useState(false);

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
        accessLevel: initialData.accessLevel || 'basic'
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
        accessLevel: 'basic'
      });
      setShowCustomType(false);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const materialData = {
      ...formData,
      type: showCustomType ? formData.customType : formData.type
    };
    
    // Remove customType from the final data
    const { customType, ...finalData } = materialData;
    
    onSubmit(finalData);
    
    // Reset form
    setFormData({
      name: '',
      type: '',
      customType: '',
      unit: '',
      quantity: 0,
      site: '',
      use: '',
      status: 'available',
      accessLevel: 'basic'
    });
    setShowCustomType(false);
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

  // Get all material types from categories
  const getAllMaterialTypes = () => {
    return Object.keys(materialCategories);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <Package className="w-6 h-6 text-orange-600" />
        <h3 className="text-lg font-semibold text-gray-900">Register New Material</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Material Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Material Type *</label>
            {showCustomType ? (
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={formData.customType}
                  onChange={(e) => setFormData({ ...formData, customType: e.target.value })}
                  placeholder="Enter custom material type"
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
                <option value="">Select material type</option>
                {Object.entries(materialCategories).map(([categoryKey, category]) => (
                  <option key={categoryKey} value={category.name}>{category.name}</option>
                ))}
                <option value="custom">+ Add Custom Type</option>
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measurement *</label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select unit</option>
              <option value="Tons">Tons</option>
              <option value="Cubic Meters">Cubic Meters</option>
              <option value="Liters">Liters</option>
              <option value="Pieces">Pieces</option>
              <option value="Meters">Meters</option>
              <option value="Square Meters">Square Meters</option>
              <option value="Kilograms">Kilograms</option>
              <option value="Bags">Bags</option>
              <option value="Rolls">Rolls</option>
              <option value="Sheets">Sheets</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Initial Quantity *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Usage Description</label>
            <textarea
              value={formData.use}
              onChange={(e) => setFormData({ ...formData, use: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe how this material is used..."
            />
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