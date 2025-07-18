import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, AlertCircle, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { DataStorage } from '../../utils/dataStorage';

interface CostElement {
  id: string;
  name: string;
  description?: string;
  isDirect: boolean;
  isIndirect: boolean;
  isContingency: boolean;
  subcategories: CostSubcategory[];
  createdAt: string;
  lastUpdated: string;
}

interface CostSubcategory {
  id: string;
  name: string;
  description?: string;
  costElementId: string;
  createdAt: string;
  costAmount?: number;
  markupType?: 'percent' | 'amount';
  markupValue?: number;
}

interface CostBreakdownManagerProps {
  onCostBreakdownUpdate?: () => void;
}

const CostBreakdownManager: React.FC<CostBreakdownManagerProps> = ({ onCostBreakdownUpdate }) => {
  console.log('CostBreakdownManager: Component rendering');
  
  const [costElements, setCostElements] = useState<CostElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingElement, setEditingElement] = useState<CostElement | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '',
    isDirect: false,
    isIndirect: false,
    isContingency: false
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingCell, setEditingCell] = useState<{ subcategoryId: string; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  useEffect(() => {
    console.log('CostBreakdownManager: useEffect triggered');
    try {
      loadCostElements();
    } catch (error) {
      console.error('CostBreakdownManager: Error in useEffect:', error);
    }
  }, []);

  const loadCostElements = () => {
    console.log('CostBreakdownManager: loadCostElements called');
    try {
      let loadedElements = DataStorage.loadCostElements();
      console.log('CostBreakdownManager: loaded elements:', loadedElements);
      
      // Validate and fix data structure
      loadedElements = loadedElements.map(element => ({
        ...element,
        subcategories: Array.isArray(element.subcategories) ? element.subcategories : [],
        isDirect: Boolean(element.isDirect),
        isIndirect: Boolean(element.isIndirect),
        isContingency: Boolean(element.isContingency)
      }));
      
      // If no elements exist, create some sample data
      if (loadedElements.length === 0) {
        console.log('CostBreakdownManager: No elements found, creating sample data');
        const sampleElements: CostElement[] = [
          {
            id: 'cost-1',
            name: 'Raw Materials',
            description: 'Construction materials and supplies',
            isDirect: true,
            isIndirect: false,
            isContingency: false,
            subcategories: [
              {
                id: 'sub-1',
                name: 'Sand',
                description: 'Fine aggregate',
                costElementId: 'cost-1',
                createdAt: new Date().toISOString(),
                costAmount: 1000,
                markupType: 'percent',
                markupValue: 15
              },
              {
                id: 'sub-2',
                name: 'Aggregate',
                description: 'Coarse aggregate',
                costElementId: 'cost-1',
                createdAt: new Date().toISOString(),
                costAmount: 1500,
                markupType: 'percent',
                markupValue: 20
              }
            ],
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          },
          {
            id: 'cost-2',
            name: 'Labor',
            description: 'Workforce and personnel costs',
            isDirect: true,
            isIndirect: false,
            isContingency: false,
            subcategories: [],
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          }
        ];
        
        DataStorage.saveCostElements(sampleElements);
        loadedElements = sampleElements;
        console.log('CostBreakdownManager: Sample data created and saved');
      }
      
      setCostElements(loadedElements);
      if (loadedElements.length > 0 && !selectedElementId) {
        setSelectedElementId(loadedElements[0].id);
      }
    } catch (error) {
      console.error('CostBreakdownManager: Error loading cost elements:', error);
      setCostElements([]);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const validateElementName = (name: string, excludeId?: string): boolean => {
    const trimmedName = name.trim().toLowerCase();
    return !costElements.some(element => 
      element.name.toLowerCase() === trimmedName && element.id !== excludeId
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showMessage('error', 'Cost element name is required');
      return;
    }

    if (!validateElementName(formData.name, editingElement?.id)) {
      showMessage('error', 'Cost element name already exists');
      return;
    }

    if (editingElement) {
      // Update existing cost element
      const updatedElement: CostElement = {
        ...editingElement,
        name: formData.name.trim(),
        description: formData.description.trim(),
        isDirect: formData.isDirect,
        isIndirect: formData.isIndirect,
        isContingency: formData.isContingency,
        lastUpdated: new Date().toISOString()
      };

      const updatedElements = costElements.map(element =>
        element.id === editingElement.id ? updatedElement : element
      );

      setCostElements(updatedElements);
      DataStorage.saveCostElements(updatedElements);
      DataStorage.logTransaction('cost_element', 'update', updatedElement);
      showMessage('success', 'Cost element updated successfully');
    } else {
      // Create new cost element
      const newElement: CostElement = {
        id: `cost-${Date.now()}`,
        name: formData.name.trim(),
        description: formData.description.trim(),
        isDirect: formData.isDirect,
        isIndirect: formData.isIndirect,
        isContingency: formData.isContingency,
        subcategories: [],
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      const updatedElements = [...costElements, newElement];
      setCostElements(updatedElements);
      DataStorage.saveCostElements(updatedElements);
      DataStorage.logTransaction('cost_element', 'create', newElement);
      showMessage('success', 'Cost element created successfully');
    }

    resetForm();
    onCostBreakdownUpdate?.();
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', isDirect: false, isIndirect: false, isContingency: false });
    setEditingElement(null);
    setShowAddForm(false);
  };

  const addSubcategoryToElement = (elementId: string) => {
    const element = costElements.find(el => el.id === elementId);
    if (!element) return;
    
    const newSubcategory: CostSubcategory = {
      id: `sub-${Date.now()}`,
      name: 'New Subcategory',
      description: '',
      costElementId: elementId,
      createdAt: new Date().toISOString(),
      costAmount: 0,
      markupType: 'percent',
      markupValue: 0
    };

    const updatedElements = costElements.map(el => {
      if (el.id === elementId) {
        return {
          ...el,
          subcategories: Array.isArray(el.subcategories) ? [...el.subcategories, newSubcategory] : [newSubcategory]
        };
      }
      return el;
    });

    setCostElements(updatedElements);
    DataStorage.saveCostElements(updatedElements);
    setSelectedElementId(elementId); // Expand the element
    setMessage({ type: 'success', text: 'Subcategory added successfully!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleEdit = (element: CostElement) => {
    setEditingElement(element);
    setFormData({
      name: element.name,
      description: element.description || '',
      isDirect: element.isDirect,
      isIndirect: element.isIndirect,
      isContingency: element.isContingency
    });
    setShowAddForm(true);
  };

  const handleDelete = (element: CostElement) => {
    if (window.confirm(`Are you sure you want to delete "${element.name}" and all its subcategories?`)) {
      const updatedElements = costElements.filter(el => el.id !== element.id);
      setCostElements(updatedElements);
      DataStorage.saveCostElements(updatedElements);
      if (selectedElementId === element.id) {
        setSelectedElementId('');
      }
      setMessage({ type: 'success', text: 'Cost element deleted successfully!' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const startEdit = (element: CostElement) => {
    setEditingElement(element);
    setFormData({
      name: element.name,
      description: element.description || '',
      isDirect: element.isDirect,
      isIndirect: element.isIndirect,
      isContingency: element.isContingency
    });
    setShowAddForm(true);
  };

  const deleteCostElement = (elementId: string) => {
    const element = costElements.find(el => el.id === elementId);
    if (!element) return;
    handleDelete(element);
  };

  const updateSubcategory = (subcategoryId: string, field: string, value: any) => {
    const updatedElements = costElements.map(element => {
      if (element.id === selectedElementId) {
        return {
          ...element,
          subcategories: element.subcategories.map(sub =>
            sub.id === subcategoryId
              ? { ...sub, [field]: value }
              : sub
          ),
          lastUpdated: new Date().toISOString()
        };
      }
      return element;
    });

    setCostElements(updatedElements);
    DataStorage.saveCostElements(updatedElements);
  };

  const deleteSubcategory = (subcategoryId: string) => {
    if (!selectedElement) return;
    
    const updatedElements = costElements.map(element => {
      if (element.id === selectedElement.id) {
        return {
          ...element,
          subcategories: Array.isArray(element.subcategories) 
            ? element.subcategories.filter(sub => sub.id !== subcategoryId)
            : []
        };
      }
      return element;
    });

    setCostElements(updatedElements);
    DataStorage.saveCostElements(updatedElements);
    setMessage({ type: 'success', text: 'Subcategory deleted successfully!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const startEditingCell = (subcategoryId: string, field: string, currentValue: any) => {
    setEditingCell({ subcategoryId, field });
    setEditingValue(currentValue?.toString() || '');
  };

  const saveCellEdit = () => {
    if (!editingCell || !selectedElement) return;

    const updatedElements = costElements.map(element => {
      if (element.id === selectedElement.id) {
        const subcategories = Array.isArray(element.subcategories) ? [...element.subcategories] : [];
        const subcategoryIndex = subcategories.findIndex(sub => sub.id === editingCell.subcategoryId);
        
        if (subcategoryIndex !== -1) {
          const updatedSubcategory = { ...subcategories[subcategoryIndex] };
          
          switch (editingCell.field) {
            case 'name':
              updatedSubcategory.name = editingValue;
              break;
            case 'costAmount':
              updatedSubcategory.costAmount = parseFloat(editingValue) || 0;
              break;
            case 'markupType':
              updatedSubcategory.markupType = editingValue as 'percent' | 'amount';
              break;
            case 'markupValue':
              updatedSubcategory.markupValue = parseFloat(editingValue) || 0;
              break;
            case 'description':
              updatedSubcategory.description = editingValue;
              break;
          }
          
          subcategories[subcategoryIndex] = updatedSubcategory;
        }
        
        return {
          ...element,
          subcategories
        };
      }
      return element;
    });

    setCostElements(updatedElements);
    DataStorage.saveCostElements(updatedElements);
    setEditingCell(null);
    setEditingValue('');
  };

  const cancelCellEdit = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  const selectedElement = costElements.find(el => el.id === selectedElementId);

  // Ensure subcategories is always an array
  const safeSubcategories = selectedElement?.subcategories || [];
  const subcategoriesArray = Array.isArray(safeSubcategories) ? safeSubcategories : [];

  try {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-blue-800">Cost Breakdown Manager</p>
          <p className="text-sm text-blue-600">Total Cost Elements: {costElements.length}</p>
          <button
            onClick={() => {
              localStorage.removeItem('cost_elements');
              window.location.reload();
            }}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Reset Data
          </button>
        </div>
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Cost Breakdown Structure</h3>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Cost Element</span>
          </button>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-lg border flex items-center space-x-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-gray-50 rounded-lg p-4 sm:p-6 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-4">
              {editingElement ? 'Edit Cost Element' : 'Add New Cost Element'}
            </h4>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost Element Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter cost element name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter description (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cost Categories
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isDirect}
                      onChange={(e) => setFormData({ ...formData, isDirect: e.target.checked })}
                      className="mr-2"
                    />
                    <span>Direct Cost</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isIndirect}
                      onChange={(e) => setFormData({ ...formData, isIndirect: e.target.checked })}
                      className="mr-2"
                    />
                    <span>Indirect Cost</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isContingency}
                      onChange={(e) => setFormData({ ...formData, isContingency: e.target.checked })}
                      className="mr-2"
                    />
                    <span>Contingency Cost</span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingElement ? 'Update' : 'Create'}</span>
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Unified Cost Elements and Subcategories Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Name</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Description</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Cost Price (SAR)</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Markup Type</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Markup Value</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Final Price (SAR)</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {costElements.map(element => {
                  const elementSubcategories = Array.isArray(element.subcategories) ? element.subcategories : [];
                  const isExpanded = selectedElementId === element.id;
                  
                  return (
                    <React.Fragment key={element.id}>
                      {/* Cost Element Row */}
                      <tr className="bg-blue-50 hover:bg-blue-100">
                        <td className="border border-gray-300 px-3 py-2 font-semibold">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setSelectedElementId(isExpanded ? '' : element.id)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {isExpanded ? '▼' : '▶'}
                            </button>
                            <span>{element.name}</span>
                            <div className="flex space-x-1">
                              {element.isDirect && <span className="text-xs px-1 py-0.5 bg-blue-100 text-blue-800 rounded">Direct</span>}
                              {element.isIndirect && <span className="text-xs px-1 py-0.5 bg-green-100 text-green-800 rounded">Indirect</span>}
                              {element.isContingency && <span className="text-xs px-1 py-0.5 bg-yellow-100 text-yellow-800 rounded">Contingency</span>}
                            </div>
                          </div>
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">{element.description}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">-</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">-</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">-</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm font-semibold">-</td>
                        <td className="border border-gray-300 px-3 py-2">
                          <div className="flex space-x-1">
                            <button
                              onClick={() => startEdit(element)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit Cost Element"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => addSubcategoryToElement(element.id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Add Subcategory"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => deleteCostElement(element.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Delete Cost Element"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Subcategories Rows (when expanded) */}
                      {isExpanded && elementSubcategories.map(subcategory => {
                        const finalPrice = subcategory.markupType === 'percent'
                          ? (subcategory.costAmount || 0) + ((subcategory.costAmount || 0) * ((subcategory.markupValue || 0) / 100))
                          : (subcategory.costAmount || 0) + (subcategory.markupValue || 0);
                        
                        return (
                          <tr key={subcategory.id} className="bg-gray-50 hover:bg-gray-100">
                            <td className="border border-gray-300 px-3 py-2">
                              <div className="flex items-center space-x-2">
                                <span className="w-4"></span>
                                {editingCell?.subcategoryId === subcategory.id && editingCell.field === 'name' ? (
                                  <input
                                    type="text"
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    onBlur={saveCellEdit}
                                    onKeyDown={(e) => e.key === 'Enter' && saveCellEdit()}
                                    className="px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                    autoFocus
                                  />
                                ) : (
                                  <span 
                                    className="text-sm cursor-pointer hover:bg-blue-50 px-2 py-1 rounded"
                                    onClick={() => startEditingCell(subcategory.id, 'name', subcategory.name)}
                                  >
                                    └ {subcategory.name || 'Click to edit'}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm">
                              {editingCell?.subcategoryId === subcategory.id && editingCell.field === 'description' ? (
                                <input
                                  type="text"
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  onBlur={saveCellEdit}
                                  onKeyDown={(e) => e.key === 'Enter' && saveCellEdit()}
                                  className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                  autoFocus
                                />
                              ) : (
                                <div
                                  onClick={() => startEditingCell(subcategory.id, 'description', subcategory.description)}
                                  className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded text-sm"
                                >
                                  {subcategory.description || 'Click to edit'}
                                </div>
                              )}
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              {editingCell?.subcategoryId === subcategory.id && editingCell.field === 'costAmount' ? (
                                <input
                                  type="number"
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  onBlur={saveCellEdit}
                                  onKeyDown={(e) => e.key === 'Enter' && saveCellEdit()}
                                  className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                  autoFocus
                                  min="0"
                                  step="0.01"
                                />
                              ) : (
                                <div
                                  onClick={() => startEditingCell(subcategory.id, 'costAmount', subcategory.costAmount)}
                                  className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded text-sm"
                                >
                                  {subcategory.costAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                </div>
                              )}
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              {editingCell?.subcategoryId === subcategory.id && editingCell.field === 'markupType' ? (
                                <select
                                  value={editingValue}
                                  onChange={(e) => {
                                    setEditingValue(e.target.value);
                                    saveCellEdit();
                                  }}
                                  className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                  autoFocus
                                >
                                  <option value="percent">Percentage (%)</option>
                                  <option value="amount">Fixed Amount (SAR)</option>
                                </select>
                              ) : (
                                <div
                                  onClick={() => startEditingCell(subcategory.id, 'markupType', subcategory.markupType)}
                                  className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded text-sm"
                                >
                                  {subcategory.markupType === 'amount' ? 'Fixed Amount' : 'Percentage'}
                                </div>
                              )}
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              {editingCell?.subcategoryId === subcategory.id && editingCell.field === 'markupValue' ? (
                                <input
                                  type="number"
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  onBlur={saveCellEdit}
                                  onKeyDown={(e) => e.key === 'Enter' && saveCellEdit()}
                                  className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                  autoFocus
                                  min="0"
                                  step={subcategory.markupType === 'percent' ? '0.01' : '0.01'}
                                />
                              ) : (
                                <div
                                  onClick={() => startEditingCell(subcategory.id, 'markupValue', subcategory.markupValue)}
                                  className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded text-sm"
                                >
                                  {subcategory.markupValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                  {subcategory.markupType === 'percent' ? '%' : ' SAR'}
                                </div>
                              )}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 font-semibold text-sm">
                              {finalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <button
                                onClick={() => deleteSubcategory(subcategory.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Delete Subcategory"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      
                      {/* Empty state for subcategories */}
                      {isExpanded && elementSubcategories.length === 0 && (
                        <tr className="bg-gray-50">
                          <td colSpan={7} className="border border-gray-300 px-3 py-4 text-center text-gray-500 text-sm">
                            No subcategories added yet. Click the + button to add a subcategory.
                          </td>
                        </tr>
                      )}
                      
                      {/* Summary Row for Cost Element */}
                      {isExpanded && elementSubcategories.length > 0 && (
                        <tr className="bg-blue-100 font-semibold">
                          <td className="border border-gray-300 px-3 py-2">
                            <div className="flex items-center space-x-2">
                              <span className="w-4"></span>
                              <span className="text-sm">Total for {element.name}</span>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">-</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">
                            {elementSubcategories.reduce((sum, sub) => sum + (sub.costAmount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">-</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">-</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">
                            {elementSubcategories.reduce((sum, sub) => {
                              const finalPrice = sub.markupType === 'percent'
                                ? (sub.costAmount || 0) + ((sub.costAmount || 0) * ((sub.markupValue || 0) / 100))
                                : (sub.costAmount || 0) + (sub.markupValue || 0);
                              return sum + finalPrice;
                            }, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="border border-gray-300 px-3 py-2">-</td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                
                {costElements.length === 0 && (
                  <tr>
                    <td colSpan={7} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                      No cost elements added yet. Click "Add Cost Element" to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('CostBreakdownManager: Rendering error:', error);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Cost Breakdown Manager</h3>
        <p className="text-red-700 mb-4">There was an error loading the component. Please try refreshing the page.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    );
  }
};

export default CostBreakdownManager; 