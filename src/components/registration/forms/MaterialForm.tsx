import React, { useState, useEffect } from 'react';
import { Package, X, Plus, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Material } from '../../../types';
import { materialCategories } from '../../../data/materialTypes';
import { CustomMaterialTypeManager } from '../../../utils/customMaterialTypeManager';

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
    description: '',
    sku: '',
    barcode: '',
    unitCost: 0,
    sellingPrice: 0,
    taxRate: 15,
    minStock: 0,
    maxStock: 0,
    safetyStock: 0,
    reorderLevel: 0,
    supplier: '',
    supplierLeadTime: 0,
    location: '',
    warehouseId: '',
    zoneId: '',
    batchNumber: '',
    manufacturingDate: '',
    expirationDate: '',
    serialNumber: '',
  });
  const [showCustomType, setShowCustomType] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [customMaterialTypes, setCustomMaterialTypes] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState({ identity: true, pricing: true, stock: true, supplier: true, location: true, batch: true });

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
        accessLevel: initialData.accessLevel || 'basic',
        oldId: initialData.oldId || '',
        description: initialData.description || '',
        sku: initialData.sku || '',
        barcode: (initialData as any).barcode || '',
        unitCost: (initialData as any).unitCost || 0,
        sellingPrice: (initialData as any).sellingPrice || 0,
        taxRate: (initialData as any).taxRate || 15,
        minStock: (initialData as any).minStock || 0,
        maxStock: (initialData as any).maxStock || 0,
        safetyStock: (initialData as any).safetyStock || 0,
        reorderLevel: (initialData as any).reorderLevel || 0,
        reserved: (initialData as any).reserved || 0,
        supplier: initialData.supplier || '',
        supplierLeadTime: (initialData as any).supplierLeadTime || 0,
        location: initialData.location || '',
        warehouseId: (initialData as any).warehouseId || '',
        zoneId: (initialData as any).zoneId || '',
        batchNumber: (initialData as any).batchNumber || '',
        manufacturingDate: (initialData as any).manufacturingDate || '',
        expirationDate: (initialData as any).expirationDate || '',
        serialNumber: (initialData as any).serialNumber || '',
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
        accessLevel: 'basic',
        oldId: '',
        description: '',
        sku: '',
        barcode: '',
        unitCost: 0,
        sellingPrice: 0,
        taxRate: 15,
        minStock: 0,
        maxStock: 0,
        safetyStock: 0,
        reorderLevel: 0,
        supplier: '',
        supplierLeadTime: 0,
        location: '',
        warehouseId: '',
        zoneId: '',
        batchNumber: '',
        manufacturingDate: '',
        expirationDate: '',
        serialNumber: '',
      });
      setShowCustomType(false);
    }
  }, [initialData]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const materialData = {
      ...formData,
      type: (showCustomType ? formData.customType : formData.type) as any,
      lastUpdated: new Date().toISOString(),
      sku: formData.sku,
      description: formData.description,
      barcode: formData.barcode,
      unitCost: formData.unitCost,
      sellingPrice: formData.sellingPrice,
      taxRate: formData.taxRate,
      minStock: formData.minStock,
      maxStock: formData.maxStock,
      safetyStock: formData.safetyStock,
      reorderLevel: formData.reorderLevel,
      reserved: formData.reserved || 0,
      supplier: formData.supplier,
      supplierLeadTime: formData.supplierLeadTime,
      location: formData.location,
      warehouseId: formData.warehouseId,
      zoneId: formData.zoneId,
      batchNumber: formData.batchNumber,
      manufacturingDate: formData.manufacturingDate,
      expirationDate: formData.expirationDate,
      serialNumber: formData.serialNumber,
    };
    
    // Remove customType from the final data
    const { customType, ...finalData } = materialData;
    
    try {
      onSubmit(finalData);
      setMessage({ type: 'success', text: 'Material added successfully!' });
      setFormData({ name: '', type: '', customType: '', unit: '', quantity: 0, site: '', use: '', status: 'available', accessLevel: 'basic', oldId: '', description: '', sku: '', barcode: '', unitCost: 0, sellingPrice: 0, taxRate: 15, minStock: 0, maxStock: 0, safetyStock: 0, reorderLevel: 0, supplier: '', supplierLeadTime: 0, location: '', warehouseId: '', zoneId: '', batchNumber: '', manufacturingDate: '', expirationDate: '', serialNumber: '' });
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

  // Get all material types from categories
  const getAllMaterialTypes = () => {
    return Object.keys(materialCategories);
  };

  return (
    <div className="relative space-y-6">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-0 right-0 mt-2 mr-2 text-gray-400 hover:text-gray-700 z-10"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
      )}
      {message && (
        <div className={`mb-4 px-4 py-2 rounded text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>
      )}
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-orange-100 rounded-lg">
          <Package className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Register New Material</h3>
          <p className="text-sm text-gray-500">Fill in the details below to add a new material to inventory</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Material Identity */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setExpandedSections(prev => ({ ...prev, identity: !prev.identity }))}
            className="w-full flex items-center justify-between px-6 py-3 bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">1</span>
              <span className="text-sm font-semibold text-gray-700">Material Identity</span>
            </div>
            {expandedSections.identity ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
          </button>
          {expandedSections.identity && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Old Material ID (Optional)</label>
                <input type="text" value={formData.oldId} onChange={(e) => setFormData({ ...formData, oldId: e.target.value })} className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter legacy material ID" />
                <div className="text-xs text-gray-500 mt-1">Enter the material ID from your previous system for backward compatibility and audit purposes.</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material Type *</label>
                {showCustomType ? (
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <input type="text" value={formData.customType} onChange={(e) => setFormData({ ...formData, customType: e.target.value })} placeholder="Enter custom material type" className="flex-1 px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomType(); } }} />
                      <button type="button" onClick={handleAddCustomType} className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-1" title="Add Custom Type"><Plus className="w-4 h-4" /><span>Add</span></button>
                      <button type="button" onClick={() => setShowCustomType(false)} className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">Cancel</button>
                    </div>
                    <div className="text-xs text-gray-500">Press Enter or click Add to save this custom material type for future use.</div>
                  </div>
                ) : (
                  <select value={formData.type} onChange={(e) => handleTypeChange(e.target.value)} className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                    <option value="">Select material type</option>
                    {Object.entries(materialCategories).map(([categoryKey, category]) => (<option key={categoryKey} value={category.name}>{category.name}</option>))}
                    {customMaterialTypes.length > 0 && (<optgroup label="Custom Types">{customMaterialTypes.map((customType) => (<option key={customType} value={customType}>{customType}</option>))}</optgroup>)}
                    <option value="custom">+ Add Custom Type</option>
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measurement *</label>
                <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
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
                <input type="number" min="0" step="0.01" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site Assignment *</label>
                <select value={formData.site} onChange={(e) => setFormData({ ...formData, site: e.target.value })} className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">Select site</option>
                  {sites.map(site => (<option key={site.id} value={site.id}>{site.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent md:col-span-2" placeholder="Detailed description of the material..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <input type="text" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Stock Keeping Unit (auto-generated if blank)" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                <input type="text" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Barcode value (auto-generated if blank)" />
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Pricing & Tax */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <button type="button" onClick={() => setExpandedSections(prev => ({ ...prev, pricing: !prev.pricing }))} className="w-full flex items-center justify-between px-6 py-3 bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-2"><span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">2</span><span className="text-sm font-semibold text-gray-700">Pricing & Tax</span></div>
            {expandedSections.pricing ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
          </button>
          {expandedSections.pricing && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost (SAR)</label><input type="number" min="0" step="0.01" value={formData.unitCost} onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0.00" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (SAR)</label><input type="number" min="0" step="0.01" value={formData.sellingPrice} onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0.00" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%) <span className="text-xs text-gray-400">(KSA VAT)</span></label><input type="number" min="0" step="0.01" value={formData.taxRate} onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 15 })} className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" /></div>
            </div>
          )}
        </div>

        {/* Section 3: Stock Management */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <button type="button" onClick={() => setExpandedSections(prev => ({ ...prev, stock: !prev.stock }))} className="w-full flex items-center justify-between px-6 py-3 bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-2"><span className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center">3</span><span className="text-sm font-semibold text-gray-700">Stock Management</span></div>
            {expandedSections.stock ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
          </button>
          {expandedSections.stock && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label><input type="number" min="0" step="0.001" value={formData.minStock} onChange={(e) => setFormData({ ...formData, minStock: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Max Stock</label><input type="number" min="0" step="0.001" value={formData.maxStock} onChange={(e) => setFormData({ ...formData, maxStock: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Safety Stock</label><input type="number" min="0" step="0.001" value={formData.safetyStock} onChange={(e) => setFormData({ ...formData, safetyStock: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label><input type="number" min="0" step="0.001" value={formData.reorderLevel} onChange={(e) => setFormData({ ...formData, reorderLevel: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0" /></div>
            </div>
          )}
        </div>

        {/* Section 4: Supplier Information */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <button type="button" onClick={() => setExpandedSections(prev => ({ ...prev, supplier: !prev.supplier }))} className="w-full flex items-center justify-between px-6 py-3 bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-2"><span className="w-6 h-6 rounded-full bg-teal-500 text-white text-xs font-bold flex items-center justify-center">4</span><span className="text-sm font-semibold text-gray-700">Supplier Information</span></div>
            {expandedSections.supplier ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
          </button>
          {expandedSections.supplier && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label><input type="text" value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Supplier name" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Supplier Lead Time (days)</label><input type="number" min="0" value={formData.supplierLeadTime} onChange={(e) => setFormData({ ...formData, supplierLeadTime: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0" /></div>
            </div>
          )}
        </div>

        {/* Section 5: Location & Storage */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <button type="button" onClick={() => setExpandedSections(prev => ({ ...prev, location: !prev.location }))} className="w-full flex items-center justify-between px-6 py-3 bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-2"><span className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center">5</span><span className="text-sm font-semibold text-gray-700">Location & Storage</span></div>
            {expandedSections.location ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
          </button>
          {expandedSections.location && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Location (Aisle-Rack-Shelf)</label><input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="e.g., A-3-B-2" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Warehouse ID</label><input type="text" value={formData.warehouseId} onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })} className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Warehouse identifier" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Zone ID</label><input type="text" value={formData.zoneId} onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })} className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Zone identifier" /></div>
            </div>
          )}
        </div>

        {/* Section 6: Batch & Serial */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <button type="button" onClick={() => setExpandedSections(prev => ({ ...prev, batch: !prev.batch }))} className="w-full flex items-center justify-between px-6 py-3 bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-2"><span className="w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center">6</span><span className="text-sm font-semibold text-gray-700">Batch & Serial</span></div>
            {expandedSections.batch ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
          </button>
          {expandedSections.batch && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label><input type="text" value={formData.batchNumber} onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })} className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Batch/lot number" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Manufacturing Date</label><input type="date" value={formData.manufacturingDate} onChange={(e) => setFormData({ ...formData, manufacturingDate: e.target.value })} className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label><input type="date" value={formData.expirationDate} onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })} className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label><input type="text" value={formData.serialNumber} onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })} className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Unique serial/lot serial number" /></div>
            </div>
          )}
        </div>

        <button type="submit" className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm tracking-wide">
          Register Material
        </button>
      </form>
    </div>
  );
};

export default MaterialForm;