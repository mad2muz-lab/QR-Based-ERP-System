import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { InventoryStorageService } from '../utils/inventoryStorage';
import { REGIONS, MaterialItem } from '../data/ksaData';

const InventoryValuationReport: React.FC = () => {
  const navigate = useNavigate();
  const inventoryStorage = InventoryStorageService.getInstance();
  const [items, setItems] = useState<MaterialItem[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [costMethod, setCostMethod] = useState<'fifo' | 'lifo' | 'average'>('average');

  useEffect(() => {
    setItems(inventoryStorage.getItems());
  }, []);

  const warehouses = REGIONS.flatMap(r => r.warehouses);

  const filteredItems = selectedWarehouse === 'all' ? items : items.filter(i => i.warehouseId === selectedWarehouse);

  const totalValue = filteredItems.reduce((sum, i) => sum + (i.quantity * i.unitCost), 0);
  const totalItems = filteredItems.length;
  const avgUnitCost = totalItems > 0 ? totalValue / filteredItems.reduce((sum, i) => sum + i.quantity, 0) : 0;

  const warehouseStats = warehouses.map(wh => {
    const whItems = items.filter(i => i.warehouseId === wh.id);
    const value = whItems.reduce((sum, i) => sum + (i.quantity * i.unitCost), 0);
    return { ...wh, itemCount: whItems.length, totalValue: value };
  });

  const categoryStats = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = { quantity: 0, value: 0, count: 0 };
    }
    acc[item.category].quantity += item.quantity;
    acc[item.category].value += item.quantity * item.unitCost;
    acc[item.category].count += 1;
    return acc;
  }, {} as Record<string, { quantity: number; value: number; count: number }>);

  const handleExport = () => {
    const headers = ['SKU', 'Name', 'Category', 'Quantity', 'Unit Cost', 'Total Value', 'Warehouse', 'Status'];
    const rows = filteredItems.map(item => [
      item.sku,
      item.name,
      item.category,
      item.quantity,
      item.unitCost.toFixed(2),
      (item.quantity * item.unitCost).toFixed(2),
      item.warehouseId,
      item.status
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-valuation-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
                <h1 className="text-xl font-bold text-gray-900">Inventory Valuation Report</h1>
                <p className="text-sm text-gray-500">Calculate stock value by warehouse / cost method, exportable</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
                  <select
                    value={selectedWarehouse}
                    onChange={e => setSelectedWarehouse(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Warehouses</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost Method</label>
                  <select
                    value={costMethod}
                    onChange={e => setCostMethod(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="average">Average Cost</option>
                    <option value="fifo">FIFO</option>
                    <option value="lifo">LIFO</option>
                  </select>
                </div>
              </div>
              <button onClick={handleExport} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-600 font-medium">Total Stock Value</div>
                <div className="text-2xl font-bold text-blue-700">SAR {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className="text-xs text-blue-500 mt-1">{totalItems} items</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-green-600 font-medium">Avg Unit Cost</div>
                <div className="text-2xl font-bold text-green-700">SAR {avgUnitCost.toFixed(2)}</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-purple-600 font-medium">Cost Method</div>
                <div className="text-2xl font-bold text-purple-700 capitalize">{costMethod}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Valuation by Warehouse</h3>
                <div className="space-y-3">
                  {warehouseStats.map(wh => (
                    <div key={wh.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{wh.name}</div>
                        <div className="text-xs text-gray-500">{wh.itemCount} items</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">SAR {wh.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Valuation by Category</h3>
                <div className="space-y-3">
                  {Object.entries(categoryStats).map(([cat, stats]) => (
                    <div key={cat} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{cat}</div>
                        <div className="text-xs text-gray-500">{stats.count} items | {stats.quantity.toLocaleString()} units</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">SAR {stats.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">SKU</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Qty</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Unit Cost</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Total Value</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Warehouse</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{item.sku}</td>
                      <td className="py-3 px-4">{item.name}</td>
                      <td className="py-3 px-4 text-gray-600">{item.category}</td>
                      <td className="py-3 px-4">{item.quantity} {item.unit}</td>
                      <td className="py-3 px-4 text-gray-600">SAR {item.unitCost.toFixed(2)}</td>
                      <td className="py-3 px-4 font-medium">SAR {(item.quantity * item.unitCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 text-gray-600">{item.warehouseId}</td>
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

export default InventoryValuationReport;
