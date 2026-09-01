import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Package, Bell, Mail, Phone, CheckCircle, X } from 'lucide-react';
import { InventoryStorageService } from '../utils/inventoryStorage';
import { MaterialItem } from '../data/ksaData';

const StockAlerts: React.FC = () => {
  const navigate = useNavigate();
  const inventoryStorage = InventoryStorageService.getInstance();
  const [items, setItems] = useState<MaterialItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'low_stock' | 'out_of_stock'>('all');
  const [notifyMethod, setNotifyMethod] = useState<'bell' | 'email' | 'sms'>('bell');

  useEffect(() => {
    setItems(inventoryStorage.getItems());
  }, []);

  const lowStockItems = items.filter(item => item.quantity <= (item.reorderLevel || 0));
  const outOfStockItems = items.filter(item => item.quantity === 0);
  const filteredItems = filter === 'all' ? items.filter(i => i.quantity <= (i.reorderLevel || 0)) : filter === 'low_stock' ? lowStockItems : outOfStockItems;

  const getStockStatus = (item: MaterialItem) => {
    if (item.quantity === 0) return { label: 'Out of Stock', color: 'red' };
    if (item.quantity <= item.reorderLevel) return { label: 'Low Stock', color: 'yellow' };
    return { label: 'In Stock', color: 'green' };
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/scan')} className="p-2 rounded-lg hover:bg-gray-100 transition">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Stock Alerts & Thresholds</h1>
                <p className="text-sm text-gray-500">Monitor items below reorder point and manage notifications</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex gap-2">
                <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  All Alerts ({lowStockItems.length + outOfStockItems.length})
                </button>
                <button onClick={() => setFilter('low_stock')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'low_stock' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  Low Stock ({lowStockItems.length})
                </button>
                <button onClick={() => setFilter('out_of_stock')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'out_of_stock' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  Out of Stock ({outOfStockItems.length})
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Notify via:</span>
                <select value={notifyMethod} onChange={e => setNotifyMethod(e.target.value as any)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="bell">Bell</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Material</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">SKU</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Warehouse</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Current Qty</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Reorder Level</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">No alerts found</td>
                    </tr>
                  ) : filteredItems.map(item => {
                    const status = getStockStatus(item);
                    return (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{item.name}</td>
                        <td className="py-3 px-4 text-gray-600">{item.sku}</td>
                        <td className="py-3 px-4 text-gray-600">{item.warehouseId}</td>
                        <td className="py-3 px-4">
                          <span className={`font-medium ${item.quantity === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                            {item.quantity} {item.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{item.reorderLevel} {item.unit}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            status.color === 'red' ? 'bg-red-100 text-red-700' :
                            status.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {status.color === 'red' ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                            {status.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => navigate(`/inventory/goods-receipt?materialId=${item.id}`)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Restock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockAlerts;
