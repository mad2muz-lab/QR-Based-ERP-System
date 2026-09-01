import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Save, X, Building2, Package } from 'lucide-react';
import { InventoryStorageService } from '../utils/inventoryStorage';
import { MaterialItem, MaterialCategory, CATEGORIES } from '../data/ksaData';
import { OfflineDataManager } from '../../../utils/offlineDataManager';

const SupplierItemMaster: React.FC = () => {
  const navigate = useNavigate();
  const inventoryStorage = InventoryStorageService.getInstance();
  const [items, setItems] = useState<MaterialItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<MaterialItem>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems(inventoryStorage.getItems());
  }, []);

  const resetForm = () => {
    setEditingItem({});
    setIsEditing(false);
  };

  const handleEdit = (item: MaterialItem) => {
    setEditingItem({ ...item });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editingItem.name || !editingItem.sku || !editingItem.category) {
      setError('Name, SKU, and Category are required');
      return;
    }

    try {
      if (editingItem.id) {
        const existing = inventoryStorage.getItemById(editingItem.id);
        if (existing) {
          const updated = { ...existing, ...editingItem, lastUpdated: new Date().toISOString() };
          inventoryStorage.updateItem(editingItem.id, updated);
          setSuccess('Item updated successfully');
        }
      } else {
        const newItem = inventoryStorage.addItem({
          ...editingItem,
          quantity: editingItem.quantity || 0,
          reserved: editingItem.reserved || 0,
          minStock: editingItem.minStock || 0,
          reorderLevel: editingItem.reorderLevel || 10,
          unitCost: editingItem.unitCost || 0,
          status: editingItem.quantity === 0 ? 'out_of_stock' : editingItem.quantity <= (editingItem.reorderLevel || 10) ? 'low_stock' : 'in_stock',
          location: editingItem.location || 'TBD',
          zoneId: editingItem.zoneId || '',
          warehouseId: editingItem.warehouseId || '',
          qrCode: editingItem.qrCode || `INV-${Date.now()}`,
          type: editingItem.type || 'raw',
          unit: editingItem.unit || 'pcs',
        } as Omit<MaterialItem, 'id'>);
        setSuccess('Item created successfully');
      }
      setItems(inventoryStorage.getItems());
      resetForm();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Save failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/scan')} className="p-2 rounded-lg hover:bg-gray-100 transition">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Supplier / Item Master</h1>
                <p className="text-sm text-gray-500">Manage item metadata, UOM, lead times, and suppliers</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {success && (
              <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                {success}
              </div>
            )}
            {error && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">{error}</div>
            )}

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  {isEditing ? 'Edit Item' : 'Create New Item'}
                </h3>
                {isEditing && (
                  <button onClick={resetForm} className="text-sm text-gray-600 hover:text-gray-900">Cancel</button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={editingItem.name || ''}
                    onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Item name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                  <input
                    type="text"
                    value={editingItem.sku || ''}
                    onChange={e => setEditingItem({ ...editingItem, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="SKU-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={editingItem.category || ''}
                    onChange={e => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={editingItem.type || 'raw'}
                    onChange={e => setEditingItem({ ...editingItem, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="raw">Raw</option>
                    <option value="finished">Finished</option>
                    <option value="consumable">Consumable</option>
                    <option value="spare">Spare</option>
                    <option value="tool">Tool</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    value={editingItem.unit || ''}
                    onChange={e => setEditingItem({ ...editingItem, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="pcs, kg, L"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <input
                    type="text"
                    value={editingItem.supplier || ''}
                    onChange={e => setEditingItem({ ...editingItem, supplier: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Supplier name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lead Time (days)</label>
                  <input
                    type="number"
                    value={editingItem.supplierLeadTime || ''}
                    onChange={e => setEditingItem({ ...editingItem, supplierLeadTime: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="14"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                  <input
                    type="number"
                    value={editingItem.reorderLevel || ''}
                    onChange={e => setEditingItem({ ...editingItem, reorderLevel: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost (SAR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.unitCost || ''}
                    onChange={e => setEditingItem({ ...editingItem, unitCost: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
                  <select
                    value={editingItem.warehouseId || ''}
                    onChange={e => setEditingItem({ ...editingItem, warehouseId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select warehouse</option>
                    {inventoryStorage.getWarehouses().map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingItem.id ? 'Update' : 'Create'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">SKU</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Supplier</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Lead Time</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Reorder Level</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.slice(0, 50).map(item => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{item.name}</td>
                      <td className="py-3 px-4 text-gray-600">{item.sku}</td>
                      <td className="py-3 px-4 text-gray-600">{item.category}</td>
                      <td className="py-3 px-4 text-gray-600">{item.supplier || 'N/A'}</td>
                      <td className="py-3 px-4 text-gray-600">{item.supplierLeadTime || 'N/A'} days</td>
                      <td className="py-3 px-4 text-gray-600">{item.reorderLevel}</td>
                      <td className="py-3 px-4">
                        <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierItemMaster;
